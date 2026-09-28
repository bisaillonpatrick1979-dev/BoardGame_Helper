// Outils partagés : langue, stockage local, sons, hasard
import { createContext, useContext, useEffect, useState } from "react";

// ---------- Langue ----------
export const LangContext = createContext("fr");

export function useLang() {
  const lang = useContext(LangContext);
  return { lang, t: (fr, en) => (lang === "fr" ? fr : en) };
}

// ---------- Stockage local (sécurisé : ne plante jamais) ----------
function readStored(key, initial) {
  const fallback = typeof initial === "function" ? initial() : initial;
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function useStored(key, initial) {
  const [value, setValue] = useState(() => readStored(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Stockage indisponible (navigation privée) : on continue en mémoire
    }
  }, [key, value]);
  return [value, setValue];
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
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
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
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.15, i * 0.11)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.28, "sine", 0.14, i * 0.16))
};

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    // Ignoré
  }
}
