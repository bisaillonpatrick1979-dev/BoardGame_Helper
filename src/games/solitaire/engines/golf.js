// Moteur Golf — on joue sur la défausse une carte de rang +1 ou -1 (sans tour As↔Roi) — fonctions pures
// Piles : t0…t6 (7 colonnes de 5 cartes visibles), stock (16 cartes), waste (défausse)
import { best, card, flipUp, makeCodes, range, rankOf, shuffleWith, top } from "./cards.js";

export const TABLEAU = range(7, "t");

export function deal(opts = {}, rng = Math.random) {
  const codes = shuffleWith(makeCodes(), rng);
  const piles = {};
  let k = 0;
  TABLEAU.forEach((t) => {
    piles[t] = [];
    for (let j = 0; j < 5; j += 1) piles[t].push(card(codes[k++], true));
  });
  piles.waste = [card(codes[k++], true)];
  piles.stock = codes.slice(k).map((c) => card(c, false));
  return { v: "golf", piles, moves: 0 };
}

export function canPlay(state, from) {
  const p = state.piles[from];
  const w = top(state.piles.waste);
  if (!p || from[0] !== "t" || !p.length || w === undefined) return false;
  return Math.abs(rankOf(top(p)) - rankOf(w)) === 1;
}

export function apply(state, action) {
  if (!action) return null;
  if (action.t === "draw") {
    const { stock, waste } = state.piles;
    if (!stock.length) return null;
    return { ...state, piles: { ...state.piles, stock: stock.slice(0, -1), waste: [...waste, flipUp(top(stock))] }, moves: state.moves + 1 };
  }
  if (action.t === "play") {
    if (!canPlay(state, action.from)) return null;
    const p = state.piles[action.from];
    return {
      ...state,
      piles: { ...state.piles, [action.from]: p.slice(0, -1), waste: [...state.piles.waste, top(p)] },
      moves: state.moves + 1
    };
  }
  return null;
}

export function actions(state) {
  const list = TABLEAU.filter((t) => canPlay(state, t)).map((from) => ({ t: "play", from }));
  if (state.piles.stock.length) list.push({ t: "draw" });
  return list;
}

// Longueur de la plus longue chaîne possible à partir d'un état (recherche bornée)
function chain(state, depth, budget) {
  if (depth <= 0 || budget.n <= 0) return 0;
  let bestLen = 0;
  TABLEAU.forEach((t) => {
    if (!canPlay(state, t) || budget.n <= 0) return;
    budget.n -= 1;
    const next = apply(state, { t: "play", from: t });
    bestLen = Math.max(bestLen, 1 + chain(next, depth - 1, budget));
  });
  return bestLen;
}

export function score(state, a) {
  if (a.t === "draw") return 1;
  const next = apply(state, a);
  return 10 + chain(next, 10, { n: 4000 });
}

export function hint(state) {
  return best(actions(state).map((action) => ({ action, score: score(state, action) })), 1);
}

export function tap(state, pile) {
  if (pile === "stock") return state.piles.stock.length ? { t: "draw" } : null;
  return canPlay(state, pile) ? { t: "play", from: pile } : null;
}

export const canSelect = () => false;
export const canDrag = (state, pile, index) => pile[0] === "t" && index === state.piles[pile].length - 1 && canPlay(state, pile);
export function moveTo(state, sel, pile) {
  return pile === "waste" && canPlay(state, sel.pile) ? { t: "play", from: sel.pile } : null;
}

export const isWon = (state) => TABLEAU.every((t) => !state.piles[t].length);
export const autoComplete = () => null;
export const stuck = (state) => !isWon(state) && actions(state).length === 0;
