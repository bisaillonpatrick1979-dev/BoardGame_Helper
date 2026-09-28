// Jeu de cartes standard (52 cartes + jokers)
import { shuffle } from "../lib/core.js";

export const SUITS = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const RED_SUITS = ["hearts", "diamonds"];

// Nom des figures selon la langue (V/D/R en français)
export function rankLabel(rank, lang) {
  if (lang !== "fr") return rank;
  return { J: "V", Q: "D", K: "R" }[rank] || rank;
}

export function buildDeck({ decks = 1, jokers = false } = {}) {
  const cards = [];
  for (let d = 0; d < decks; d += 1) {
    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => cards.push({ id: `${d}-${rank}-${suit}`, rank, suit }));
    });
    if (jokers) {
      cards.push({ id: `${d}-joker-red`, rank: "JOKER", suit: "red" });
      cards.push({ id: `${d}-joker-black`, rank: "JOKER", suit: "black" });
    }
  }
  return cards;
}

export function shuffledDeck(options) {
  return shuffle(buildDeck(options));
}

// Valeur pour la bataille (As fort)
export function battleValue(card) {
  if (!card) return 0;
  if (card.rank === "JOKER") return 15;
  return { A: 14, K: 13, Q: 12, J: 11 }[card.rank] || Number(card.rank);
}

// Valeur pour « plus haut / plus bas » (As faible)
export function orderValue(card) {
  return { A: 1, J: 11, Q: 12, K: 13 }[card.rank] || Number(card.rank);
}

export function cardName(card, lang) {
  if (!card) return "";
  if (card.rank === "JOKER") return "Joker";
  const suitNames = {
    fr: { spades: "pique", hearts: "cœur", diamonds: "carreau", clubs: "trèfle" },
    en: { spades: "spades", hearts: "hearts", diamonds: "diamonds", clubs: "clubs" }
  };
  const rankNames = {
    fr: { A: "As", J: "Valet", Q: "Dame", K: "Roi" },
    en: { A: "Ace", J: "Jack", Q: "Queen", K: "King" }
  };
  const l = lang === "fr" ? "fr" : "en";
  const r = rankNames[l][card.rank] || card.rank;
  return l === "fr" ? `${r} de ${suitNames.fr[card.suit]}` : `${r} of ${suitNames.en[card.suit]}`;
}
