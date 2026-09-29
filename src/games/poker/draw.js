// Poker 5 cartes fermé : fonctions pures propres à l'échange de cartes.
// Les enchères, les pots secondaires, l'évaluation et les bots viennent de engine.js (variant "draw").
import { shuffle } from "../../lib/core.js";
import { evaluate, newTable, openBettingRound } from "./engine.js";

const RANK_VALUE = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };

// Nouvelle table de 5 cartes fermé
export function newDrawTable({ playerName, bots = 3, chips = 1000, limit = "nl" }) {
  return newTable({ playerName, bots, chips, botChips: chips, variant: "draw", limit });
}

// Nombre maximal de cartes échangeables : 3, ou 4 si la carte gardée est un as
export function maxDiscard(hole, indices = []) {
  if (indices.length === 4) {
    const kept = hole.find((_, i) => !indices.includes(i));
    return kept && kept.rank === "A" ? 4 : 3;
  }
  return hole.some((c) => c.rank === "A") ? 4 : 3;
}

// Vérifie qu'un échange est permis
export function canDiscard(hole, indices) {
  const unique = [...new Set(indices)];
  if (unique.length !== indices.length) return false;
  if (unique.some((i) => i < 0 || i >= hole.length)) return false;
  if (unique.length <= 3) return true;
  if (unique.length === 4) {
    const kept = hole.find((_, i) => !unique.includes(i));
    return kept.rank === "A";
  }
  return false;
}

// Le joueur dont c'est le tour jette les cartes indiquées (indices dans sa main) et en reçoit autant
export function drawCards(prev, indices) {
  if (prev.stage !== "draw" || prev.toAct < 0) throw new Error("Ce n'est pas la phase d'échange");
  const i = prev.toAct;
  if (!canDiscard(prev.players[i].hole, indices)) throw new Error("Échange non permis");
  const state = structuredClone(prev);
  const p = state.players[i];
  const tossed = [];
  indices
    .slice()
    .sort((a, b) => a - b)
    .forEach((k) => {
      // Paquet vide : on remélange les cartes jetées (règle officielle)
      if (!state.deck.length && state.muck.length) {
        state.deck = shuffle(state.muck);
        state.muck = [];
      }
      if (!state.deck.length) return; // (ne devrait jamais arriver) : on garde la carte
      tossed.push(p.hole[k]);
      p.hole[k] = state.deck.pop();
    });
  state.muck.push(...tossed);
  p.drew = tossed.length;
  p.lastAction = `draw${tossed.length}`;
  state.log.push({ name: p.name, action: p.lastAction });
  state.pending = state.pending.filter((x) => x !== i);

  if (state.pending.length) {
    const n = state.players.length;
    let next = -1;
    for (let k = 1; k <= n; k += 1) {
      const j = (i + k) % n;
      if (state.pending.includes(j)) {
        next = j;
        break;
      }
    }
    state.toAct = next;
    return state;
  }
  // Tout le monde a échangé : 2e tour d'enchères (ou abattage si tout le monde est à tapis)
  state.stage = "postdraw";
  state.toAct = -1;
  return openBettingRound(state);
}

// Choix de l'ordinateur : quelles cartes jeter (indices)
export function botDiscard(hole) {
  const [cat] = evaluate(hole);
  const values = hole.map((c) => RANK_VALUE[c.rank]);
  const counts = {};
  values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const idx = hole.map((_, i) => i);

  // Suite ou mieux, full, carré : on ne touche à rien
  if (cat >= 4) return [];
  // Brelan : on jette les deux autres
  if (cat === 3) return idx.filter((i) => counts[values[i]] !== 3);
  // Deux paires : on jette la carte seule
  if (cat === 2) return idx.filter((i) => counts[values[i]] === 1);

  // Tirage couleur (4 cartes de la même sorte)
  const suits = {};
  hole.forEach((c, i) => (suits[c.suit] = (suits[c.suit] || []).concat(i)));
  const flushDraw = Object.values(suits).find((l) => l.length === 4);
  // Tirage quinte par les deux bouts (4 valeurs qui se suivent)
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  let straightRun = null;
  for (let k = 0; k + 3 < sorted.length; k += 1) {
    if (sorted[k + 3] - sorted[k] === 3 && sorted[k + 3] < 14) straightRun = sorted.slice(k, k + 4);
  }

  // Paire : on la garde (sauf une petite paire face à un tirage couleur)
  if (cat === 1) {
    const pairValue = Number(Object.keys(counts).find((v) => counts[v] === 2));
    if (flushDraw && pairValue < 8) return idx.filter((i) => !flushDraw.includes(i));
    return idx.filter((i) => counts[values[i]] !== 2);
  }
  if (flushDraw) return idx.filter((i) => !flushDraw.includes(i));
  if (straightRun) {
    const keep = [];
    straightRun.forEach((v) => keep.push(idx.find((i) => values[i] === v && !keep.includes(i))));
    return idx.filter((i) => !keep.includes(i));
  }
  // Rien : on garde un as (et on en prend 4), sinon les deux plus hautes cartes
  const order = idx.slice().sort((a, b) => values[b] - values[a]);
  if (values[order[0]] === 14) return order.slice(1);
  return order.slice(2);
}
