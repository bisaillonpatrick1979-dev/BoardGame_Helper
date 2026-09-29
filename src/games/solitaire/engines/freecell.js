// Moteur FreeCell — fonctions pures
// Piles : c0…c3 (cellules libres), f0…f3 (fondations), t0…t7 (colonnes). Toutes les cartes visibles.
import { best, card, fitsFoundation, isAltRun, isRed, makeCodes, moveCards, range, rankOf, shuffleWith, top } from "./cards.js";

export const CELLS = range(4, "c");
export const FOUNDATIONS = range(4, "f");
export const TABLEAU = range(8, "t");
const TARGETS = [...FOUNDATIONS, ...TABLEAU, ...CELLS];

const isTab = (id) => id[0] === "t";
const isFnd = (id) => id[0] === "f";
const isCell = (id) => id[0] === "c";

export function deal(opts = {}, rng = Math.random) {
  const codes = shuffleWith(makeCodes(), rng);
  const piles = {};
  [...CELLS, ...FOUNDATIONS, ...TABLEAU].forEach((p) => (piles[p] = []));
  codes.forEach((c, i) => piles[TABLEAU[i % 8]].push(card(c, true)));
  return { v: "freecell", piles, moves: 0 };
}

// Nombre maximal de cartes déplaçables d'un coup : (cellules libres + 1) × 2^(colonnes vides)
export function maxMovable(state, to) {
  const freeCells = CELLS.filter((c) => !state.piles[c].length).length;
  let emptyCols = TABLEAU.filter((t) => !state.piles[t].length).length;
  if (to && isTab(to) && !state.piles[to].length) emptyCols -= 1;
  return (freeCells + 1) * 2 ** emptyCols;
}

export function canDrag(state, pile, index) {
  const p = state.piles[pile];
  if (!p || index < 0 || index >= p.length) return false;
  if (isCell(pile)) return index === p.length - 1;
  if (isTab(pile)) return isAltRun(p.slice(index));
  return false; // on ne reprend pas les cartes des fondations
}

export function canMove(state, from, index, to) {
  if (from === to || !canDrag(state, from, index)) return false;
  const moving = state.piles[from].slice(index);
  const dest = state.piles[to];
  if (!dest) return false;
  if (isFnd(to)) return moving.length === 1 && fitsFoundation(dest, moving[0]);
  if (isCell(to)) return !isCell(from) && moving.length === 1 && dest.length === 0;
  if (isTab(to)) {
    if (moving.length > maxMovable(state, to)) return false;
    if (!dest.length) return true;
    const tp = top(dest);
    return isRed(tp) !== isRed(moving[0]) && rankOf(tp) === rankOf(moving[0]) + 1;
  }
  return false;
}

export function apply(state, action) {
  if (!action || action.t !== "move") return null;
  const { from, index, to } = action;
  if (!canMove(state, from, index, to)) return null;
  return { ...state, piles: moveCards(state.piles, from, index, to), moves: state.moves + 1 };
}

function sources(state) {
  const out = [];
  CELLS.forEach((c) => state.piles[c].length && out.push([c, 0]));
  TABLEAU.forEach((t) => {
    const p = state.piles[t];
    for (let i = p.length - 1; i >= 0 && canDrag(state, t, i); i -= 1) out.push([t, i]);
  });
  return out;
}

export function actions(state) {
  const list = [];
  sources(state).forEach(([from, index]) => {
    TARGETS.forEach((to) => canMove(state, from, index, to) && list.push({ t: "move", from, index, to }));
  });
  return list;
}

// Le parent (carte sous la pile déplacée) est-il déjà un « bon » parent ?
function naturalParent(src, index) {
  if (index === 0) return false;
  const p = src[index - 1];
  const c = src[index];
  return isRed(p) !== isRed(c) && rankOf(p) === rankOf(c) + 1;
}

export function score(state, a) {
  const { from, index, to } = a;
  const src = state.piles[from];
  if (isFnd(to)) return 100 - rankOf(src[index]) * 0.1;
  const destEmpty = !state.piles[to].length;
  if (isCell(to)) return naturalParent(src, index) ? 1 : 8;
  if (isCell(from)) return destEmpty ? 20 : 40;
  // colonne → colonne
  if (destEmpty) return index === 0 || naturalParent(src, index) ? -1 : 30 + (src.length - index);
  if (index === 0) return 45;
  return naturalParent(src, index) ? 5 : 50 + (src.length - index);
}

const scored = (state, list) => list.map((action) => ({ action, score: score(state, action) }));

export function hint(state) {
  return best(scored(state, actions(state)), 1);
}

export function tap(state, pile, index) {
  if (!canDrag(state, pile, index)) return null;
  const list = TARGETS.filter((to) => canMove(state, pile, index, to)).map((to) => ({ t: "move", from: pile, index, to }));
  // Pour un toucher, une cellule reste acceptable même si « peu utile »
  return best(
    list.map((action) => ({ action, score: Math.max(score(state, action), isCell(action.to) ? 0.5 : score(state, action)) })),
    0
  );
}

export const canSelect = (state, pile, index) => canDrag(state, pile, index);

export function moveTo(state, sel, pile) {
  // Toucher une cellule occupée ou une fondation : on vise la pile, pas la carte
  return canMove(state, sel.pile, sel.index, pile) ? { t: "move", from: sel.pile, index: sel.index, to: pile } : null;
}

export const isWon = (state) => FOUNDATIONS.every((f) => state.piles[f].length === 13);

// Fin automatique : chaque colonne est déjà triée en ordre décroissant
export function autoComplete(state) {
  if (isWon(state)) return null;
  const sorted = TABLEAU.every((t) => {
    const p = state.piles[t];
    for (let i = 1; i < p.length; i += 1) if (rankOf(p[i]) > rankOf(p[i - 1])) return false;
    return true;
  });
  if (!sorted) return null;
  let pick = null;
  [...CELLS, ...TABLEAU].forEach((s) => {
    const p = state.piles[s];
    if (!p.length) return;
    FOUNDATIONS.forEach((f) => {
      if (canMove(state, s, p.length - 1, f) && (!pick || rankOf(top(p)) < pick.r)) {
        pick = { r: rankOf(top(p)), action: { t: "move", from: s, index: p.length - 1, to: f } };
      }
    });
  });
  return pick ? pick.action : null;
}

export const stuck = (state) => !isWon(state) && actions(state).length === 0;
