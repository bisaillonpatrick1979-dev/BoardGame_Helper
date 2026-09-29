// Moteur Klondike (le solitaire classique) — fonctions pures
// Piles : stock (talon), waste (défausse), f0…f3 (fondations), t0…t6 (colonnes)
import {
  best,
  card,
  fitsFoundation,
  flipDown,
  flipUp,
  isAltRun,
  isRed,
  isUp,
  makeCodes,
  moveCards,
  range,
  rankOf,
  revealTop,
  shuffleWith,
  top
} from "./cards.js";

export const TABLEAU = range(7, "t");
export const FOUNDATIONS = range(4, "f");
const TARGETS = [...FOUNDATIONS, ...TABLEAU];

const isTab = (id) => id[0] === "t";
const isFnd = (id) => id[0] === "f";

export function deal(opts = {}, rng = Math.random) {
  const codes = shuffleWith(makeCodes(), rng);
  const piles = { stock: [], waste: [] };
  FOUNDATIONS.forEach((f) => (piles[f] = []));
  let k = 0;
  TABLEAU.forEach((t, i) => {
    piles[t] = [];
    for (let j = 0; j <= i; j += 1) piles[t].push(card(codes[k++], j === i));
  });
  piles.stock = codes.slice(k).map((c) => card(c, false));
  return { v: "klondike", draw: opts.draw === 3 ? 3 : 1, piles, moves: 0, passes: 0 };
}

// Peut-on prendre la carte (et celles au-dessus) à cet endroit ?
export function canDrag(state, pile, index) {
  const p = state.piles[pile];
  if (!p || index < 0 || index >= p.length) return false;
  if (pile === "waste" || isFnd(pile)) return index === p.length - 1;
  if (isTab(pile)) return isAltRun(p.slice(index));
  return false;
}

// Colonne : vide → Roi seulement ; sinon couleur opposée et rang -1
function fitsTableau(t, v) {
  if (!t.length) return rankOf(v) === 13;
  const tp = top(t);
  return isUp(tp) && isRed(tp) !== isRed(v) && rankOf(tp) === rankOf(v) + 1;
}

export function canMove(state, from, index, to) {
  if (from === to || !canDrag(state, from, index)) return false;
  const moving = state.piles[from].slice(index);
  const dest = state.piles[to];
  if (!dest) return false;
  if (isFnd(to)) return !isFnd(from) && moving.length === 1 && fitsFoundation(dest, moving[0]);
  if (isTab(to)) return fitsTableau(dest, moving[0]);
  return false;
}

// Piocher (1 ou 3 cartes) ou recycler la défausse quand le talon est vide
function draw(state) {
  const { stock, waste } = state.piles;
  if (stock.length) {
    const n = Math.min(state.draw, stock.length);
    const taken = stock.slice(stock.length - n).reverse().map(flipUp);
    return {
      ...state,
      piles: { ...state.piles, stock: stock.slice(0, stock.length - n), waste: [...waste, ...taken] },
      moves: state.moves + 1
    };
  }
  if (waste.length) {
    return {
      ...state,
      piles: { ...state.piles, stock: [...waste].reverse().map(flipDown), waste: [] },
      moves: state.moves + 1,
      passes: state.passes + 1
    };
  }
  return null;
}

export function apply(state, action) {
  if (!action) return null;
  if (action.t === "draw") return draw(state);
  if (action.t === "move") {
    const { from, index, to } = action;
    if (!canMove(state, from, index, to)) return null;
    let piles = moveCards(state.piles, from, index, to);
    if (isTab(from)) piles = revealTop(piles, from);
    return { ...state, piles, moves: state.moves + 1 };
  }
  return null;
}

// Sources possibles : dessus de la défausse, dessus des fondations, cartes visibles des colonnes
function sources(state) {
  const out = [];
  const w = state.piles.waste;
  if (w.length) out.push(["waste", w.length - 1]);
  FOUNDATIONS.forEach((f) => state.piles[f].length && out.push([f, state.piles[f].length - 1]));
  TABLEAU.forEach((t) => {
    const p = state.piles[t];
    for (let i = 0; i < p.length; i += 1) if (isUp(p[i]) && canDrag(state, t, i)) out.push([t, i]);
  });
  return out;
}

export function actions(state) {
  const list = [];
  if (state.piles.stock.length || state.piles.waste.length) list.push({ t: "draw" });
  sources(state).forEach(([from, index]) => {
    TARGETS.forEach((to) => canMove(state, from, index, to) && list.push({ t: "move", from, index, to }));
  });
  return list;
}

// Valeur d'un coup : sert au toucher automatique et aux indices (négatif = inutile)
export function score(state, a) {
  if (a.t === "draw") return 15;
  const { from, index, to } = a;
  const src = state.piles[from];
  if (isFnd(to)) return 100 - rankOf(src[index]) * 0.1;
  if (isFnd(from)) return 5;
  if (from === "waste") return 40;
  const parent = src[index - 1];
  const destEmpty = state.piles[to].length === 0;
  if (index === 0) return destEmpty ? -1 : 50; // Roi d'une colonne vide vers une autre vide : inutile
  if (!isUp(parent)) return destEmpty ? 55 : 60; // révèle une carte cachée
  return destEmpty ? 2 : 8; // simple transfert entre deux parents équivalents
}

const scored = (state, list) => list.map((action) => ({ action, score: score(state, action) }));

export function hint(state) {
  const all = actions(state);
  const good = best(scored(state, all.filter((a) => a.t !== "draw")), 20);
  if (good) return good;
  if (all.some((a) => a.t === "draw")) return { t: "draw" };
  return best(scored(state, all), 1);
}

// Toucher une carte : elle va au meilleur endroit (fondation d'abord)
export function tap(state, pile, index) {
  if (pile === "stock") return state.piles.stock.length || state.piles.waste.length ? { t: "draw" } : null;
  if (!canDrag(state, pile, index)) return null;
  const list = TARGETS.filter((to) => canMove(state, pile, index, to)).map((to) => ({ t: "move", from: pile, index, to }));
  return best(scored(state, list), 0);
}

export const canSelect = (state, pile, index) => canDrag(state, pile, index);

export function moveTo(state, sel, pile) {
  const a = { t: "move", from: sel.pile, index: sel.index, to: pile };
  return canMove(state, sel.pile, sel.index, pile) ? a : null;
}

export const isWon = (state) => FOUNDATIONS.every((f) => state.piles[f].length === 13);

// Fin automatique : talon et défausse vides, toutes les cartes visibles
export function autoComplete(state) {
  if (isWon(state)) return null;
  const { stock, waste } = state.piles;
  if (stock.length || waste.length) return null;
  if (!TABLEAU.every((t) => state.piles[t].every(isUp))) return null;
  // On envoie la plus petite carte disponible (toujours possible dans ce cas)
  let pick = null;
  TABLEAU.forEach((t) => {
    const p = state.piles[t];
    if (!p.length) return;
    FOUNDATIONS.forEach((f) => {
      if (canMove(state, t, p.length - 1, f) && (!pick || rankOf(top(p)) < pick.r)) {
        pick = { r: rankOf(top(p)), action: { t: "move", from: t, index: p.length - 1, to: f } };
      }
    });
  });
  return pick ? pick.action : null;
}

export const stuck = (state) => !isWon(state) && actions(state).length === 0;
