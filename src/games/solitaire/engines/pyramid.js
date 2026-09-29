// Moteur Pyramide — on retire les paires qui font 13 (Roi seul = 13) — fonctions pures
// Piles : p0…p27 (cases de la pyramide, 0 ou 1 carte), stock, waste, done
import { best, card, flipDown, flipUp, makeCodes, range, rankOf, shuffleWith, top } from "./cards.js";

export const SLOTS = range(28, "p");
export const RECYCLES = 2; // 3 passages du talon au total

// Case → rangée et position ; cases qui la recouvrent (rangée suivante)
export const rowOf = (i) => Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
export const slotIndex = (r, k) => (r * (r + 1)) / 2 + k;
export function coveredBy(i) {
  const r = rowOf(i);
  if (r >= 6) return [];
  const k = i - slotIndex(r, 0);
  return [slotIndex(r + 1, k), slotIndex(r + 1, k + 1)];
}

export function deal(opts = {}, rng = Math.random) {
  const codes = shuffleWith(makeCodes(), rng);
  const piles = { stock: [], waste: [], done: [] };
  SLOTS.forEach((p, i) => (piles[p] = [card(codes[i], true)]));
  piles.stock = codes.slice(28).map((c) => card(c, false));
  return { v: "pyramid", piles, moves: 0, recycles: RECYCLES };
}

const slotNum = (id) => Number(id.slice(1));

// Une carte est libre si elle n'est plus recouverte (ou si c'est le dessus de la défausse)
export function isFree(state, pile) {
  const p = state.piles[pile];
  if (!p || !p.length) return false;
  if (pile === "waste") return true;
  if (pile[0] !== "p") return false;
  return coveredBy(slotNum(pile)).every((c) => !state.piles[`p${c}`].length);
}

function freePiles(state) {
  return [...SLOTS, "waste"].filter((p) => isFree(state, p));
}

const val = (state, pile) => rankOf(top(state.piles[pile]));

export function canDraw(state) {
  return state.piles.stock.length > 0 || (state.piles.waste.length > 0 && state.recycles > 0);
}

export function apply(state, action) {
  if (!action) return null;
  if (action.t === "draw") {
    const { stock, waste } = state.piles;
    if (stock.length) {
      return {
        ...state,
        piles: { ...state.piles, stock: stock.slice(0, -1), waste: [...waste, flipUp(top(stock))] },
        moves: state.moves + 1
      };
    }
    if (waste.length && state.recycles > 0) {
      return {
        ...state,
        piles: { ...state.piles, stock: [...waste].reverse().map(flipDown), waste: [] },
        moves: state.moves + 1,
        recycles: state.recycles - 1
      };
    }
    return null;
  }
  if (action.t === "king") {
    const { a } = action;
    if (!isFree(state, a) || val(state, a) !== 13) return null;
    const piles = { ...state.piles, [a]: state.piles[a].slice(0, -1), done: [...state.piles.done, top(state.piles[a])] };
    return { ...state, piles, moves: state.moves + 1 };
  }
  if (action.t === "pair") {
    const { a, b } = action;
    if (a === b || !isFree(state, a) || !isFree(state, b) || val(state, a) + val(state, b) !== 13) return null;
    const piles = { ...state.piles };
    const ca = top(piles[a]);
    const cb = top(piles[b]);
    piles[a] = piles[a].slice(0, -1);
    piles[b] = piles[b].slice(0, -1);
    piles.done = [...piles.done, ca, cb];
    return { ...state, piles, moves: state.moves + 1 };
  }
  return null;
}

export function actions(state) {
  const list = [];
  const free = freePiles(state);
  free.forEach((a, i) => {
    if (val(state, a) === 13) list.push({ t: "king", a });
    for (let j = i + 1; j < free.length; j += 1) {
      if (val(state, a) + val(state, free[j]) === 13) list.push({ t: "pair", a, b: free[j] });
    }
  });
  if (canDraw(state)) list.push({ t: "draw" });
  return list;
}

// Priorité : dégager la pyramide (cartes les plus hautes d'abord)
export function score(state, a) {
  if (a.t === "draw") return 5;
  const piles = a.t === "king" ? [a.a] : [a.a, a.b];
  const inPyr = piles.filter((p) => p[0] === "p");
  return 20 + inPyr.length * 30 - inPyr.reduce((s, p) => s + rowOf(slotNum(p)), 0);
}

export function hint(state) {
  return best(actions(state).map((action) => ({ action, score: score(state, action) })), 1);
}

// Toucher : Roi → retiré ; sinon on cherche le meilleur partenaire libre
export function tap(state, pile) {
  if (pile === "stock") return canDraw(state) ? { t: "draw" } : null;
  if (!isFree(state, pile)) return null;
  if (val(state, pile) === 13) return { t: "king", a: pile };
  const list = freePiles(state)
    .filter((b) => b !== pile && val(state, pile) + val(state, b) === 13)
    .map((b) => ({ t: "pair", a: pile, b }));
  return best(list.map((action) => ({ action, score: score(state, action) })), 0);
}

export const canSelect = (state, pile) => isFree(state, pile) && val(state, pile) !== 13;
export const canDrag = (state, pile) => canSelect(state, pile);

export function moveTo(state, sel, pile) {
  const a = { t: "pair", a: sel.pile, b: pile };
  return apply(state, a) ? a : null;
}

export const isWon = (state) => SLOTS.every((p) => !state.piles[p].length);
export const autoComplete = () => null;
export const stuck = (state) => !isWon(state) && actions(state).length === 0;
