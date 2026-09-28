// Comptes et sauvegarde dans le nuage (Supabase)
import { createClient } from "@supabase/supabase-js";
import { META_KEY, STORE_EVENT, readMeta, readStored, writeStored } from "./core.js";

// Clé publique (sans danger dans l'app : la sécurité est assurée par les règles RLS)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ksdrljqigvgxzelhtpgj.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_NZOb2ltakl346tScfC9KMg_E1SoKsGU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "bgh-auth"
  }
});

const OWNER_KEY = "bgh2__owner";

// Clés synchronisées : toutes les données « bgh2_… » sauf les clés techniques « bgh2__… »
const isSynced = (key) => key.startsWith("bgh2_") && !key.startsWith("bgh2__");

function localKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && isSynced(key)) keys.push(key);
    }
  } catch {
    // Ignoré
  }
  return keys;
}

// Si un autre compte se connecte sur cet appareil, on vide les données du précédent
function claimDevice(userId) {
  const owner = readStored(OWNER_KEY, null);
  if (owner && owner !== userId) {
    localKeys().forEach((key) => {
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { key, source: "cloud" } }));
    });
    localStorage.setItem(META_KEY, "{}");
  }
  localStorage.setItem(OWNER_KEY, JSON.stringify(userId));
}

// Synchronisation complète : la version la plus récente de chaque clé gagne
async function fullSync(userId) {
  const { data, error } = await supabase.from("bgh_saves").select("key, value, updated_at");
  if (error) throw error;
  const meta = readMeta();
  const remoteAt = new Map();

  // 1) Le nuage est plus récent : on met à jour l'appareil
  data.forEach((row) => {
    const at = Date.parse(row.updated_at);
    remoteAt.set(row.key, at);
    if (!meta[row.key] || at > meta[row.key]) {
      writeStored(row.key, row.value, { source: "cloud", at });
    }
  });

  // 2) L'appareil est plus récent : on envoie au nuage
  const freshMeta = readMeta();
  const uploads = localKeys()
    .filter((key) => freshMeta[key] && (!remoteAt.has(key) || freshMeta[key] > remoteAt.get(key)))
    .map((key) => ({
      user_id: userId,
      key,
      value: readStored(key, null),
      updated_at: new Date(freshMeta[key]).toISOString()
    }));
  if (uploads.length) {
    const { error: upErr } = await supabase.from("bgh_saves").upsert(uploads, { onConflict: "user_id,key" });
    if (upErr) throw upErr;
  }
}

// Démarre la synchronisation pour un joueur connecté ; renvoie une fonction d'arrêt
export function startSync(userId, onStatus) {
  let stopped = false;
  let timer = null;
  const pending = new Set();

  claimDevice(userId);

  const run = async () => {
    if (stopped) return;
    onStatus("syncing");
    try {
      await fullSync(userId);
      if (!stopped) onStatus("ok", new Date());
    } catch (error) {
      console.warn("Synchronisation impossible :", error);
      if (!stopped) onStatus(navigator.onLine ? "error" : "offline");
    }
  };

  // Envoi groupé des changements locaux (1,5 s après la dernière modification)
  const push = async () => {
    const keys = [...pending];
    pending.clear();
    if (!keys.length || stopped) return;
    const meta = readMeta();
    const rows = keys.map((key) => ({
      user_id: userId,
      key,
      value: readStored(key, null),
      updated_at: new Date(meta[key] || Date.now()).toISOString()
    }));
    onStatus("syncing");
    const { error } = await supabase.from("bgh_saves").upsert(rows, { onConflict: "user_id,key" });
    if (stopped) return;
    if (error) {
      keys.forEach((k) => pending.add(k));
      onStatus(navigator.onLine ? "error" : "offline");
    } else onStatus("ok", new Date());
  };

  const onChange = (event) => {
    const { key, source } = event.detail;
    if (source === "cloud" || !isSynced(key)) return;
    pending.add(key);
    clearTimeout(timer);
    timer = setTimeout(push, 1500);
  };

  const onOnline = () => run();
  const onVisible = () => document.visibilityState === "visible" && run();

  window.addEventListener(STORE_EVENT, onChange);
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  run();

  return () => {
    stopped = true;
    clearTimeout(timer);
    if (pending.size) push();
    window.removeEventListener(STORE_EVENT, onChange);
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

// Profil du joueur (créé à la première connexion)
export async function loadProfile(user) {
  const name = (user.email || "").split("@")[0].slice(0, 40);
  await supabase.from("bgh_profiles").upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data } = await supabase.from("bgh_profiles").select("display_name, premium, created_at").eq("user_id", user.id).maybeSingle();
  return data;
}

export async function saveDisplayName(userId, name) {
  return supabase.from("bgh_profiles").update({ display_name: name.slice(0, 40), updated_at: new Date().toISOString() }).eq("user_id", userId);
}

export async function deleteAccount() {
  const { error } = await supabase.rpc("bgh_delete_account");
  if (error) throw error;
  localKeys().forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(META_KEY);
  localStorage.removeItem(OWNER_KEY);
  await supabase.auth.signOut();
}

// Traduit les erreurs de connexion courantes
export function authErrorMessage(error, lang) {
  const msg = (error?.message || "").toLowerCase();
  const fr = lang === "fr";
  if (msg.includes("invalid login")) return fr ? "Courriel ou mot de passe incorrect." : "Wrong email or password.";
  if (msg.includes("already registered")) return fr ? "Ce courriel a déjà un compte. Connecte-toi." : "This email already has an account. Sign in.";
  if (msg.includes("email not confirmed")) return fr ? "Confirme d'abord ton courriel (regarde tes messages)." : "Please confirm your email first (check your inbox).";
  if (msg.includes("password") && msg.includes("characters")) return fr ? "Le mot de passe doit avoir au moins 6 caractères." : "Password must be at least 6 characters.";
  if (msg.includes("rate limit")) return fr ? "Trop d'essais. Attends quelques minutes." : "Too many attempts. Wait a few minutes.";
  if (msg.includes("fetch") || msg.includes("network")) return fr ? "Pas de connexion Internet." : "No internet connection.";
  return error?.message || (fr ? "Une erreur est survenue." : "Something went wrong.");
}
