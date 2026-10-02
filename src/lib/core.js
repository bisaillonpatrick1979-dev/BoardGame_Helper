// Outils partagés : langue, stockage local (synchronisé avec le compte), sons, hasard
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

// ---------- Langue ----------
export const LangContext = createContext("fr");

export function useLang() {
  const lang = useContext(LangContext);
  return { lang, t: (fr, en) => (lang === "fr" ? fr : en) };
}

// ---------- Stockage local (sécurisé : ne plante jamais) ----------
// Chaque clé « bgh2_… » est horodatée dans META_KEY pour que la synchronisation
// avec le nuage sache quelle version est la plus récente.
export const META_KEY = "bgh2__meta";
export const STORE_EVENT = "bgh-store";

export function readStored(key, initial) {
  const fallback = () => (typeof initial === "function" ? initial() : initial);
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback() : JSON.parse(raw);
  } catch {
    return fallback();
  }
}

export function readMeta() {
  return readStored(META_KEY, {}) || {};
}

// Écrit une valeur, met à jour son horodatage et prévient les autres composants
export function writeStored(key, value, { source = "local", at } = {}) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (!key.startsWith("bgh2__")) {
      const meta = readMeta();
      meta[key] = at || Date.now();
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    }
  } catch {
    // Stockage indisponible (navigation privée) : on continue en mémoire
  }
  window.dispatchEvent(
    new CustomEvent(STORE_EVENT, { detail: { key, source } }),
  );
}

export function useStored(key, initial) {
  const [value, setValue] = useState(() => readStored(key, initial));
  const id = useId();
  // Dernière valeur connue (JSON) : on n'enregistre que les vrais changements,
  // jamais la valeur par défaut (sinon elle écraserait la sauvegarde du nuage)
  const lastJson = useRef(null);
  if (lastJson.current === null) lastJson.current = JSON.stringify(value);

  useEffect(() => {
    const json = JSON.stringify(value);
    if (json === lastJson.current) return;
    lastJson.current = json;
    writeStored(key, value, { source: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  // Reçoit les changements venant d'ailleurs (autre écran ou nuage)
  useEffect(() => {
    const onChange = (event) => {
      if (event.detail.key !== key || event.detail.source === id) return;
      const next = readStored(key, initial);
      lastJson.current = JSON.stringify(next);
      setValue(next);
    };
    window.addEventListener(STORE_EVENT, onChange);
    return () => window.removeEventListener(STORE_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, id]);

  return [value, setValue];
}

// ---------- Statistiques de jeu (liées au compte) ----------
export const STATS_KEY = "bgh2_stats";

// Enregistre une partie : result = "win" | "loss" | "draw" ; score optionnel (meilleur score gardé)
export function recordGame(gameId, result, score) {
  const stats = readStored(STATS_KEY, {}) || {};
  const s = stats[gameId] || {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    best: null,
  };
  s.played += 1;
  if (result === "win") s.wins += 1;
  else if (result === "loss") s.losses += 1;
  else if (result === "draw") s.draws += 1;
  if (typeof score === "number" && (s.best === null || score > s.best))
    s.best = score;
  stats[gameId] = s;
  writeStored(STATS_KEY, stats);
}

// ---------- Hasard ----------
export function randomInt(max) {
  return Math.floor(Math.random() * max);
}

// Mélange équitable (Fisher-Yates)
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------- Sons synthétisés (aucun fichier) ----------
let ctx = null;
let soundOn = true;

export function setSoundEnabled(on) {
  soundOn = on;
}

function audio() {
  if (!soundOn) return null;
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, duration = 0.12, type = "sine", volume = 0.18, delay = 0) {
  const a = audio();
  if (!a) return;
  const start = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(a.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration = 0.08, freq = 2500, volume = 0.25) {
  const a = audio();
  if (!a) return;
  const length = Math.floor(a.sampleRate * duration);
  const buffer = a.createBuffer(1, length, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1)
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  const gain = a.createGain();
  gain.gain.value = volume;
  src.connect(filter).connect(gain).connect(a.destination);
  src.start();
}

export const sfx = {
  tap: () => tone(660, 0.06, "triangle", 0.08),
  flip: () => noise(0.07, 3200, 0.18),
  deal: () => noise(0.05, 4200, 0.14),
  drop: () => tone(180, 0.18, "sine", 0.22),
  good: () => {
    tone(660, 0.12, "triangle", 0.14);
    tone(880, 0.16, "triangle", 0.14, 0.09);
  },
  bad: () => tone(160, 0.25, "sawtooth", 0.07),
  win: () =>
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(f, 0.22, "triangle", 0.15, i * 0.11),
    ),
  lose: () =>
    [392, 330, 262].forEach((f, i) => tone(f, 0.28, "sine", 0.14, i * 0.16)),
};

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    // Ignoré
  }
}
