// Parties en réseau : plusieurs téléphones autour de la même table.
//
// Fonctionnement :
// - L'hôte crée une salle (code de 6 lettres) et envoie le lien d'invitation par texto, courriel ou code QR.
// - Les amis ouvrent le lien dans leur navigateur : rien à installer, pas de compte requis.
// - Les messages passent par Supabase Realtime (canal « bgh-room-CODE »).
// - L'hôte est l'arbitre : il garde l'état du jeu, vérifie chaque action et envoie à chaque joueur
//   SA vue personnelle, chiffrée (AES-GCM) avec une clé que lui seul partage avec l'hôte.
//
// L'état de la salle vit hors de React (magasin simple) : on peut quitter l'écran et revenir
// sans perdre la connexion.
import { useSyncExternalStore } from "react";
import { supabase } from "../lib/cloud.js";
import { cryptoAvailable, fingerprint, isValidCode, loadKeys, newKeys, open, randomCode, randomId, seal, sharedKey } from "./crypto.js";
import { netGame } from "./games/index.js";

const MAX_MEMBERS = 10;
const HOST_KEY = "bgh2__room_host"; // « __ » : jamais synchronisé dans le nuage
const CLIENT_KEY = "bgh2__room_client";
const SESSION_TTL = 12 * 60 * 60 * 1000; // une salle peut être reprise pendant 12 h

// ---------- Magasin observable ----------
const EMPTY = { status: "idle", code: null, me: null, isHost: false, view: null, error: null, online: [], pin: null };
let snap = EMPTY;
const listeners = new Set();

function set(patch) {
  snap = { ...snap, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRoom() {
  return useSyncExternalStore(subscribe, () => snap, () => snap);
}

export const getRoom = () => snap;

// ---------- État interne ----------
let channel = null;
let keys = null;
let myId = null;
let myName = "";
let code = null;
let isHost = false;
let presence = new Map(); // id -> { id, name, pub, host }
const peerKeys = new Map(); // hôte : id -> { pub, key }
let doc = null; // hôte : état complet de la salle
let hostInfo = null; // joueur : { id, pub, key }
let hostPin = null; // joueur : empreinte attendue de la clé de l'hôte (lien d'invitation)
let seq = 0;
const lastSeq = new Map();
const lastHello = new Map();
let lastEpoch = null;
let lastV = -1;
let helloTimer = null;
let tickTimer = null;
let notFoundTimer = null;
let joinedOnce = false;

const cleanName = (name) => String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 20) || "Joueur";

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage plein ou bloqué : la partie continue quand même
  }
}

// Partie enregistrée qu'on peut reprendre (après un rechargement, un appel, etc.)
export function savedSession() {
  const host = readJSON(HOST_KEY);
  if (host && Date.now() - host.at < SESSION_TTL) return { role: "host", code: host.doc.code, name: host.myName };
  const client = readJSON(CLIENT_KEY);
  if (client && Date.now() - client.at < SESSION_TTL) return { role: "client", code: client.code, name: client.name };
  return null;
}

export function forgetSession() {
  writeJSON(HOST_KEY, null);
  writeJSON(CLIENT_KEY, null);
}

// ---------- Transport (Supabase Realtime) ----------
function send(msg) {
  if (!channel) return;
  channel.send({ type: "broadcast", event: "m", payload: msg }).catch?.(() => {});
}

function connect(meta) {
  return new Promise((resolve, reject) => {
    let settled = false;
    channel = supabase.channel(`bgh-room-${code}`, {
      config: { broadcast: { self: false, ack: false }, presence: { key: myId } }
    });
    channel
      .on("broadcast", { event: "m" }, ({ payload }) => {
        onMessage(payload).catch((e) => console.warn("Réseau :", e));
      })
      .on("presence", { event: "sync" }, () => {
        onPresence(channel.presenceState()).catch((e) => console.warn("Présence :", e));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // (Re)connexion : on annonce sa présence à chaque fois
          await channel.track(meta);
          if (!settled) {
            settled = true;
            resolve();
          }
          if (!isHost) sayHello();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (!settled) {
            settled = true;
            reject(new Error(status));
          } else if (snap.status !== "idle") set({ error: "network" });
        }
      });
  });
}

async function disconnect() {
  clearTimeout(helloTimer);
  clearTimeout(tickTimer);
  clearTimeout(notFoundTimer);
  if (channel) {
    try {
      await channel.untrack();
    } catch {
      // Ignoré
    }
    supabase.removeChannel(channel);
  }
  channel = null;
  presence = new Map();
  peerKeys.clear();
  lastSeq.clear();
  lastHello.clear();
  doc = null;
  hostInfo = null;
  hostPin = null;
  lastEpoch = null;
  lastV = -1;
  joinedOnce = false;
}

function onlineSet() {
  const ids = new Set(presence.keys());
  if (myId) ids.add(myId);
  return ids;
}

// ---------- Messages reçus ----------
async function onMessage(msg) {
  if (!msg || typeof msg !== "object" || typeof msg.t !== "string") return;
  if (msg.to && msg.to !== myId) return;

  if (isHost) {
    if (!doc || typeof msg.from !== "string") return;
    const peer = peerKeys.get(msg.from);
    if (msg.t === "hi") {
      // Un joueur demande sa vue (arrivée, réveil du téléphone…) : max 1 fois par seconde
      const now = Date.now();
      if (peer && now - (lastHello.get(msg.from) || 0) > 1000) {
        lastHello.set(msg.from, now);
        await sendViewTo(msg.from);
      }
      return;
    }
    if (msg.t === "a" && peer && typeof msg.iv === "string" && typeof msg.ct === "string") {
      let data;
      try {
        data = await open(peer.key, msg, `a|${msg.from}`);
      } catch {
        return; // message falsifié ou d'un imposteur
      }
      if (!data || typeof data.s !== "number" || data.s <= (lastSeq.get(msg.from) || 0)) return; // message rejoué
      lastSeq.set(msg.from, data.s);
      hostApply(msg.from, data.a);
    }
    return;
  }

  // Joueur : seule la vue chiffrée envoyée par l'hôte compte
  if (msg.t === "v" && hostInfo && typeof msg.iv === "string" && typeof msg.ct === "string") {
    let view;
    try {
      view = await open(hostInfo.key, msg, `v|${myId}`);
    } catch {
      return;
    }
    receiveView(view);
  }
}

function receiveView(view) {
  if (!view || typeof view !== "object") return;
  if (view.kicked) {
    leaveRoom(true).then(() => set({ status: "kicked" }));
    return;
  }
  if (view.full) {
    leaveRoom(true).then(() => set({ status: "full" }));
    return;
  }
  if (view.ended) {
    leaveRoom(true).then(() => set({ status: "ended" }));
    return;
  }
  // On ignore une vue plus vieille que celle qu'on a déjà
  if (view.epoch === lastEpoch && view.v < lastV) return;
  lastEpoch = view.epoch;
  lastV = view.v;
  clearTimeout(helloTimer);
  clearTimeout(notFoundTimer);
  set({ view, status: view.game ? "playing" : "lobby", error: null });
  persistClient();
}

// ---------- Présence ----------
function readPresence(state) {
  const map = new Map();
  Object.entries(state || {}).forEach(([key, metas]) => {
    const meta = Array.isArray(metas) ? metas[0] : null;
    if (!meta || typeof meta.pub !== "string" || meta.id !== key || key.length > 40 || meta.pub.length > 200) return;
    map.set(key, { id: key, name: cleanName(meta.name), pub: meta.pub, host: meta.host === true });
  });
  map.delete(myId);
  return map;
}

async function onPresence(state) {
  presence = readPresence(state);
  if (isHost) await hostPresence();
  else await clientPresence();
}

async function hostPresence() {
  if (!doc) return;
  for (const meta of presence.values()) {
    if (meta.host || doc.banned.includes(meta.id)) continue;
    const known = doc.members[meta.id];
    // Même identifiant, clé différente : imposteur, on l'ignore
    if (known && known.pub !== meta.pub) continue;
    let peer = peerKeys.get(meta.id);
    if (!peer) {
      try {
        peer = { pub: meta.pub, key: await sharedKey(keys.priv, meta.pub) };
      } catch {
        continue; // clé invalide
      }
      peerKeys.set(meta.id, peer);
    }
    if (!known) {
      if (doc.order.length >= MAX_MEMBERS) {
        const box = await seal(peer.key, { full: true }, `v|${meta.id}`);
        send({ t: "v", to: meta.id, ...box });
        continue;
      }
      doc.members[meta.id] = { name: meta.name, pub: meta.pub };
      doc.order.push(meta.id);
      doc.v += 1;
    } else if (known.name !== meta.name) {
      known.name = meta.name;
      doc.v += 1;
    }
  }
  await broadcast();
  scheduleTick();
}

async function clientPresence() {
  const hosts = [...presence.values()].filter((m) => m.host);
  let hostMeta = hostInfo ? hosts.find((m) => m.pub === hostInfo.pub) : null;
  if (!hostMeta && !hostInfo) {
    for (const m of hosts) {
      // Le lien d'invitation contient l'empreinte de la clé de l'hôte : on vérifie que c'est bien lui
      if (hostPin && (await fingerprint(m.pub)) !== hostPin) continue;
      hostMeta = m;
      break;
    }
    if (hostMeta) {
      hostInfo = { id: hostMeta.id, pub: hostMeta.pub, key: await sharedKey(keys.priv, hostMeta.pub) };
      persistClient();
      sayHello();
    }
  }
  if (!hostMeta) {
    if (snap.view) set({ status: "hostgone", online: [...onlineSet()] });
    return;
  }
  if (snap.status === "hostgone") {
    set({ status: snap.view?.game ? "playing" : "lobby" });
    sayHello();
  }
  set({ online: [...onlineSet()] });
}

// Le joueur demande sa vue à l'hôte jusqu'à la recevoir
function sayHello(tries = 0) {
  clearTimeout(helloTimer);
  if (!channel || isHost) return;
  if (hostInfo) send({ t: "hi", from: myId });
  if (tries < 30) helloTimer = setTimeout(() => sayHello(tries + 1), tries < 5 ? 1500 : 4000);
}

// ---------- Hôte : arbitre de la partie ----------
function namesMap() {
  const names = {};
  Object.entries(doc.members).forEach(([id, m]) => (names[id] = m.name));
  return names;
}

function ctx() {
  return { names: namesMap(), seats: doc.seats, online: onlineSet() };
}

function buildView(pid) {
  const def = doc.game ? netGame(doc.game) : null;
  const online = onlineSet();
  return {
    epoch: doc.epoch,
    v: doc.v,
    lobby: {
      code: doc.code,
      hostId: doc.hostId,
      game: doc.game,
      opts: doc.opts,
      members: doc.order.map((id) => ({ id, name: doc.members[id].name, online: online.has(id), seated: doc.seats.includes(id) }))
    },
    game: def && doc.gs ? def.view(doc.gs, pid, ctx()) : null
  };
}

async function sendViewTo(id) {
  const peer = peerKeys.get(id);
  if (!peer || !doc.members[id]) return;
  const box = await seal(peer.key, buildView(id), `v|${id}`);
  send({ t: "v", to: id, ...box });
}

async function broadcast() {
  if (!doc) return;
  const online = onlineSet();
  const view = buildView(myId);
  set({ view, status: doc.game ? "playing" : "lobby", online: [...online] });
  persistHost();
  for (const id of doc.order) {
    if (id !== myId && online.has(id)) await sendViewTo(id);
  }
}

function hostApply(pid, action, system = false) {
  if (!doc || !doc.game || !doc.gs) return false;
  if (!system && (!doc.members[pid] || doc.banned.includes(pid))) return false;
  const def = netGame(doc.game);
  let next = null;
  try {
    next = def.apply(doc.gs, pid, action, ctx());
  } catch (e) {
    console.warn("Action refusée :", e);
    next = null;
  }
  if (!next) return false;
  doc.gs = next;
  doc.v += 1;
  broadcast();
  scheduleTick();
  return true;
}

// Ordinateurs et joueurs absents : l'hôte les fait jouer après un délai
function scheduleTick() {
  clearTimeout(tickTimer);
  if (!doc?.game || !doc.gs) return;
  const def = netGame(doc.game);
  if (!def.tick) return;
  const next = def.tick(doc.gs, ctx());
  if (!next) return;
  const v = doc.v;
  tickTimer = setTimeout(() => {
    if (doc && doc.v === v) hostApply(next.pid, next.action, true);
  }, next.delay);
}

function persistHost() {
  if (!doc || !keys) return;
  writeJSON(HOST_KEY, { doc, keys: { pub: keys.pub, privJwk: keys.privJwk }, myName, at: Date.now() });
}

function persistClient() {
  if (isHost || !keys || !code) return;
  writeJSON(CLIENT_KEY, { code, id: myId, name: myName, keys: { pub: keys.pub, privJwk: keys.privJwk }, hostPub: hostInfo?.pub || null, pin: hostPin, at: Date.now() });
}

// ---------- Actions publiques ----------
export function inviteLink() {
  if (!snap.code) return "";
  const pin = snap.pin ? `&h=${snap.pin}` : "";
  return `${window.location.origin}/?join=${snap.code}${pin}`;
}

function assertCrypto() {
  if (!cryptoAvailable()) throw new Error("crypto");
}

// Crée une salle (ou reprend celle qui était ouverte sur ce téléphone)
export async function createRoom(name, { resume = false } = {}) {
  assertCrypto();
  await leaveRoom(false);
  const saved = resume ? readJSON(HOST_KEY) : null;
  isHost = true;
  if (saved && Date.now() - saved.at < SESSION_TTL) {
    keys = await loadKeys(saved.keys);
    doc = saved.doc;
    myId = doc.hostId;
    myName = cleanName(name || saved.myName);
    doc.members[myId].name = myName;
    doc.v += 1;
  } else {
    writeJSON(CLIENT_KEY, null);
    keys = await newKeys();
    myId = randomId();
    myName = cleanName(name);
    doc = {
      code: randomCode(),
      hostId: myId,
      epoch: randomId(),
      v: 0,
      members: { [myId]: { name: myName, pub: keys.pub } },
      order: [myId],
      banned: [],
      game: null,
      opts: {},
      seats: [],
      gs: null
    };
  }
  code = doc.code;
  const pin = await fingerprint(keys.pub);
  set({ status: "connecting", code, me: { id: myId, name: myName }, isHost: true, view: null, error: null, pin });
  try {
    await connect({ id: myId, name: myName, pub: keys.pub, host: true });
  } catch {
    await disconnect();
    set({ ...EMPTY, status: "error", error: "network" });
    return;
  }
  await broadcast();
  scheduleTick();
}

// Rejoint la salle d'un ami
export async function joinRoom(roomCode, name, { pin = null, resume = false } = {}) {
  assertCrypto();
  const wanted = String(roomCode || "").toUpperCase().trim();
  if (!isValidCode(wanted)) {
    set({ status: "idle", error: "code" });
    return;
  }
  await leaveRoom(false);
  isHost = false;
  const saved = readJSON(CLIENT_KEY);
  // Même salle qu'avant : on garde la même identité (et la même clé) pour retrouver sa place
  if (saved && saved.code === wanted && Date.now() - saved.at < SESSION_TTL) {
    keys = await loadKeys(saved.keys);
    myId = saved.id;
    hostPin = pin || saved.pin || null;
    if (saved.hostPub) {
      try {
        hostInfo = { id: null, pub: saved.hostPub, key: await sharedKey(keys.priv, saved.hostPub) };
      } catch {
        hostInfo = null;
      }
    }
  } else {
    if (resume) return;
    keys = await newKeys();
    myId = randomId();
    hostPin = pin && /^[0-9a-f]{10}$/.test(pin) ? pin : null;
  }
  code = wanted;
  myName = cleanName(name || saved?.name);
  set({ status: "connecting", code, me: { id: myId, name: myName }, isHost: false, view: null, error: null, pin: hostPin });
  persistClient();
  try {
    await connect({ id: myId, name: myName, pub: keys.pub, host: false });
  } catch {
    await disconnect();
    set({ ...EMPTY, status: "error", error: "network" });
    return;
  }
  joinedOnce = true;
  // Personne ne répond : la salle n'existe pas (ou l'hôte est parti)
  notFoundTimer = setTimeout(() => {
    if (!snap.view && snap.code === wanted) {
      leaveRoom(false).then(() => set({ status: "notfound", code: wanted }));
    }
  }, 12000);
}

// Reprend la partie enregistrée sur ce téléphone
export async function resumeSession() {
  const s = savedSession();
  if (!s) return;
  if (s.role === "host") await createRoom(s.name, { resume: true });
  else await joinRoom(s.code, s.name, { resume: true });
}

// Quitter : l'hôte ferme la salle pour tout le monde
export async function leaveRoom(clearSaved = true) {
  if (isHost && doc && channel && clearSaved) {
    for (const id of doc.order) {
      const peer = peerKeys.get(id);
      if (id !== myId && peer) {
        const box = await seal(peer.key, { ended: true }, `v|${id}`);
        send({ t: "v", to: id, ...box });
      }
    }
  }
  await disconnect();
  if (clearSaved) forgetSession();
  isHost = false;
  keys = null;
  code = null;
  set({ ...EMPTY });
}

// Joue une action (tous les joueurs, y compris l'hôte)
export async function sendAction(action) {
  if (isHost) return hostApply(myId, action);
  if (!hostInfo || !channel) return false;
  seq = Math.max(seq + 1, Date.now());
  const box = await seal(hostInfo.key, { s: seq, a: action }, `a|${myId}`);
  send({ t: "a", from: myId, ...box });
  return true;
}

// ---------- Hôte seulement ----------
export async function startGame(gameId, opts = {}) {
  if (!isHost || !doc) return false;
  const def = netGame(gameId);
  if (!def) return false;
  const online = onlineSet();
  const seats = doc.order.filter((id) => online.has(id)).slice(0, def.max);
  if (seats.length < def.min) return false;
  doc.game = gameId;
  doc.opts = { ...def.defaultOpts, ...opts };
  doc.seats = seats;
  doc.gs = def.setup({ seats, names: namesMap(), opts: doc.opts });
  doc.v += 1;
  await broadcast();
  scheduleTick();
  return true;
}

export async function endGame() {
  if (!isHost || !doc) return;
  clearTimeout(tickTimer);
  doc.game = null;
  doc.gs = null;
  doc.seats = [];
  doc.v += 1;
  await broadcast();
}

export async function kick(id) {
  if (!isHost || !doc || id === myId || !doc.members[id]) return;
  const peer = peerKeys.get(id);
  if (peer) {
    const box = await seal(peer.key, { kicked: true }, `v|${id}`);
    send({ t: "v", to: id, ...box });
  }
  doc.banned.push(id);
  delete doc.members[id];
  doc.order = doc.order.filter((x) => x !== id);
  doc.v += 1;
  await broadcast();
}

// Le téléphone revient au premier plan : on redemande sa vue
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && channel && !isHost && joinedOnce) sayHello();
  });
}

// Pour les tests
export const __internal = { get doc() { return doc; } };
