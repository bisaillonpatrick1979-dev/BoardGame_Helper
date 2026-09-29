// Poker vidéo (solo) : « Jacks or Better » 9/6 et « Deuces Wild » (les 2 sont des jokers).
// Fonctions pures : évaluation d'une main de 5 cartes, table de paiement, donne et échange.
import { shuffledDeck } from "../../cards/deck.js";
import { evaluate } from "./engine.js";

const RANK_VALUE = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };

// Tables de paiement (gain par crédit misé ; la quinte royale paie 4000 à 5 crédits)
export const PAYTABLES = {
  jacks: [
    { key: "royal", pay: [250, 500, 750, 1000, 4000], fr: "Quinte royale", en: "Royal Flush" },
    { key: "straightFlush", pay: 50, fr: "Quinte flush", en: "Straight Flush" },
    { key: "fourKind", pay: 25, fr: "Carré", en: "Four of a Kind" },
    { key: "fullHouse", pay: 9, fr: "Full", en: "Full House" },
    { key: "flush", pay: 6, fr: "Couleur", en: "Flush" },
    { key: "straight", pay: 4, fr: "Suite", en: "Straight" },
    { key: "threeKind", pay: 3, fr: "Brelan", en: "Three of a Kind" },
    { key: "twoPair", pay: 2, fr: "Deux paires", en: "Two Pair" },
    { key: "jacks", pay: 1, fr: "Valets ou mieux", en: "Jacks or Better" }
  ],
  deuces: [
    { key: "naturalRoyal", pay: [250, 500, 750, 1000, 4000], fr: "Royale naturelle", en: "Natural Royal" },
    { key: "fourDeuces", pay: 200, fr: "Quatre 2", en: "Four Deuces" },
    { key: "wildRoyal", pay: 25, fr: "Royale avec joker", en: "Wild Royal" },
    { key: "fiveKind", pay: 15, fr: "Cinq pareilles", en: "Five of a Kind" },
    { key: "straightFlush", pay: 9, fr: "Quinte flush", en: "Straight Flush" },
    { key: "fourKind", pay: 5, fr: "Carré", en: "Four of a Kind" },
    { key: "fullHouse", pay: 3, fr: "Full", en: "Full House" },
    { key: "flush", pay: 2, fr: "Couleur", en: "Flush" },
    { key: "straight", pay: 2, fr: "Suite", en: "Straight" },
    { key: "threeKind", pay: 1, fr: "Brelan", en: "Three of a Kind" }
  ]
};

// Gain pour une main et une mise (1 à 5 crédits). Retourne 0 si la main ne paie pas.
export function payout(game, key, bet) {
  const row = PAYTABLES[game].find((r) => r.key === key);
  if (!row) return 0;
  return Array.isArray(row.pay) ? row.pay[bet - 1] : row.pay * bet;
}

// ---------- Jacks or Better ----------
export function evaluateJacks(cards) {
  const [cat, top] = evaluate(cards);
  if (cat === 0) return null;
  if (cat === 1) return top >= 11 ? "jacks" : null;
  return ["", "", "twoPair", "threeKind", "straight", "flush", "fullHouse", "fourKind", "straightFlush", "royal"][cat];
}

// ---------- Deuces Wild ----------
// Les valeurs naturelles (sans les 2) peuvent-elles former une suite avec w jokers?
function canStraight(naturals, w) {
  if (new Set(naturals).size !== naturals.length) return false;
  if (naturals.length + w !== 5) return false;
  if (!naturals.length) return true;
  const hi = Math.max(...naturals);
  const lo = Math.min(...naturals);
  if (hi - lo <= 4) return true;
  // As bas : A-2-3-4-5 (l'as vaut 1)
  if (naturals.includes(14)) {
    const low = naturals.map((v) => (v === 14 ? 1 : v));
    return Math.max(...low) - Math.min(...low) <= 4;
  }
  return false;
}

export function evaluateDeuces(cards) {
  const wild = cards.filter((c) => c.rank === "2").length;
  const nat = cards.filter((c) => c.rank !== "2");
  const values = nat.map((c) => RANK_VALUE[c.rank]);
  const sameSuit = new Set(nat.map((c) => c.suit)).size <= 1;
  const counts = {};
  values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const groups = Object.values(counts).sort((a, b) => b - a);
  const most = (groups[0] || 0) + wild;
  const straight = canStraight(values, wild);
  const royalValues = values.every((v) => v >= 10) && new Set(values).size === values.length;

  if (wild === 0 && sameSuit && straight && royalValues) return "naturalRoyal";
  if (wild === 4) return "fourDeuces";
  if (sameSuit && royalValues && straight) return "wildRoyal";
  if (most >= 5) return "fiveKind";
  if (sameSuit && straight) return "straightFlush";
  if (most === 4) return "fourKind";
  if ((wild === 0 && groups[0] === 3 && groups[1] === 2) || (wild === 1 && groups[0] === 2 && groups[1] === 2)) return "fullHouse";
  if (sameSuit) return "flush";
  if (straight) return "straight";
  if (most === 3) return "threeKind";
  return null;
}

export function evaluateVideo(game, cards) {
  return game === "deuces" ? evaluateDeuces(cards) : evaluateJacks(cards);
}

// ---------- Déroulement d'une main ----------
// Nouvelle donne : 5 cartes, aucune gardée
export function dealVideo(bet) {
  const deck = shuffledDeck();
  const hand = deck.splice(0, 5);
  return { deck, hand, held: [false, false, false, false, false], bet, stage: "hold" };
}

// Échange les cartes non gardées, calcule le gain
export function drawVideo(prev, game) {
  const deck = prev.deck.slice();
  const hand = prev.hand.map((c, i) => (prev.held[i] ? c : deck.shift()));
  const result = evaluateVideo(game, hand);
  return { ...prev, deck, hand, stage: "result", result, win: payout(game, result, prev.bet) };
}
