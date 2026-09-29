// Moteur Araignée (Spider) — 104 cartes, 1, 2 ou 4 couleurs — fonctions pures
// Piles : stock (talon, 5 distributions de 10), done (suites complètes retirées), t0…t9 (colonnes)
import { best, card, flipUp, isSuitRun, isUp, makeCodes, moveCards, range, rankOf, revealTop, shuffleWith, suitIdx, top } from "./cards.js";

export const TABLEAU = range(10, "t");

const SUITS_BY_COUNT = { 1: [0], 2: [0, 1], 4: [0, 1, 2, 3] };

export function deal(opts = {}, rng = Math.random) {
  const count = [1, 2, 4].includes(opts.suits) ? opts.suits : 1;
  const suits = SUITS_BY_COUNT[count];
  const codes = shuffleWith(makeCodes({ copies: 8 / suits.length, suits }), rng);
  const piles = { stock: [], done: [] };
  let k = 0;
  TABLEAU.forEach((t, i) => {
    const n = i < 4 ? 6 : 5;
    piles[t] = [];
    for (let j = 0; j < n; j += 1) piles[t].push(card(codes[k++], j === n - 1));
  });
  piles.stock = codes.slice(k).map((c) => card(c, false));
  return { v: "spider", suits: count, piles, moves: 0 };
}

export function canDrag(state, pile, index) {
  const p = state.piles[pile];
  if (!p || pile[0] !== "t" || index < 0 || index >= p.length) return false;
  return isSuitRun(p.slice(index));
}

export function canMove(state, from, index, to) {
  if (from === to || to[0] !== "t" || !canDrag(state, from, index)) return false;
  const dest = state.piles[to];
  if (!dest) return false;
  if (!dest.length) return true;
  const tp = top(dest);
  return isUp(tp) && rankOf(tp) === rankOf(state.piles[from][index]) + 1;
}

export const canDeal = (state) => state.piles.stock.length > 0 && TABLEAU.every((t) => state.piles[t].length > 0);

// Retire les suites complètes Roi → As de même couleur, puis retourne la carte dessous
function collect(piles) {
  let next = piles;
  let removed = 0;
  TABLEAU.forEach((t) => {
    const p = next[t];
    if (p.length >= 13) {
      const tail = p.slice(p.length - 13);
      if (rankOf(tail[0]) === 13 && isSuitRun(tail)) {
        next = { ...next, [t]: p.slice(0, p.length - 13), done: [...next.done, ...tail] };
        next = revealTop(next, t);
        removed += 1;
      }
    }
  });
  return { piles: next, removed };
}

export function apply(state, action) {
  if (!action) return null;
  let piles;
  if (action.t === "deal") {
    if (!canDeal(state)) return null;
    piles = { ...state.piles };
    const stock = [...piles.stock];
    TABLEAU.forEach((t) => {
      piles[t] = [...piles[t], flipUp(stock.pop())];
    });
    piles.stock = stock;
  } else if (action.t === "move") {
    const { from, index, to } = action;
    if (!canMove(state, from, index, to)) return null;
    piles = revealTop(moveCards(state.piles, from, index, to), from);
  } else return null;
  const res = collect(piles);
  return { ...state, piles: res.piles, moves: state.moves + 1, lastRun: res.removed ? (state.lastRun || 0) + 1 : state.lastRun || 0 };
}

export function actions(state) {
  const list = [];
  if (canDeal(state)) list.push({ t: "deal" });
  TABLEAU.forEach((from) => {
    const p = state.piles[from];
    for (let i = p.length - 1; i >= 0 && canDrag(state, from, i); i -= 1) {
      TABLEAU.forEach((to) => canMove(state, from, i, to) && list.push({ t: "move", from, index: i, to }));
    }
  });
  return list;
}

export function score(state, a) {
  if (a.t === "deal") return 5;
  const { from, index, to } = a;
  const src = state.piles[from];
  const dest = state.piles[to];
  const c = src[index];
  const parent = src[index - 1];
  const sameSuitTarget = dest.length > 0 && suitIdx(top(dest)) === suitIdx(c);
  let s = !dest.length ? 15 : sameSuitTarget ? 60 : 30;
  if (index === 0) {
    if (!dest.length) return -1; // colonne entière vers une colonne vide : inutile
    s += 20;
  } else if (!isUp(parent)) s += 25;
  else if (rankOf(parent) === rankOf(c) + 1) {
    // Déjà posée sur un bon parent : on ne bouge que pour rejoindre sa couleur
    if (suitIdx(parent) === suitIdx(c) || !sameSuitTarget) return -1;
  } else s += 10;
  return s + (src.length - index) * 0.1;
}

const scored = (state, list) => list.map((action) => ({ action, score: score(state, action) }));

export function hint(state) {
  return best(scored(state, actions(state)), 1);
}

export function tap(state, pile, index) {
  if (pile === "stock") return { t: "deal" };
  if (!canDrag(state, pile, index)) return null;
  const list = TABLEAU.filter((to) => canMove(state, pile, index, to)).map((to) => ({ t: "move", from: pile, index, to }));
  // Au toucher : même un coup « neutre » est accepté (score >= 0 sauf vraiment inutile)
  return best(
    list.map((action) => ({ action, score: Math.max(score(state, action), 0.5) - (index === 0 && !state.piles[action.to].length ? 99 : 0) })),
    0
  );
}

export const canSelect = (state, pile, index) => canDrag(state, pile, index);

export function moveTo(state, sel, pile) {
  return canMove(state, sel.pile, sel.index, pile) ? { t: "move", from: sel.pile, index: sel.index, to: pile } : null;
}

export const isWon = (state) => state.piles.done.length === 104;
export const autoComplete = () => null;
export const stuck = (state) => !isWon(state) && actions(state).length === 0;
