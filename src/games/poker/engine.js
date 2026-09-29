// Moteur de poker : Texas Hold'em, Omaha et 5 cartes fermé (variant "holdem" | "omaha" | "draw"),
// sans limite ou pot-limit (limit "nl" | "pl"). Évaluation des mains, tours d'enchères,
// pots secondaires et joueurs ordinateur. Fonctions pures : chaque action renvoie un nouvel état.
import { shuffledDeck } from "../../cards/deck.js";

// ---------- Évaluation des mains ----------
const RANK_VALUE = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13, A: 14 };

export const HAND_NAMES = {
  fr: ["Carte haute", "Paire", "Deux paires", "Brelan", "Suite", "Couleur", "Full", "Carré", "Quinte flush", "Quinte flush royale"],
  en: ["High card", "Pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush", "Royal flush"]
};

// Plus haute suite dans une liste de valeurs (gère l'as bas : A-2-3-4-5)
function straightHigh(values) {
  const set = new Set(values);
  if (set.has(14)) set.add(1);
  for (let high = 14; high >= 5; high -= 1) {
    let ok = true;
    for (let k = 0; k < 5; k += 1) if (!set.has(high - k)) ok = false;
    if (ok) return high;
  }
  return 0;
}

// Renvoie un tableau comparable : [catégorie, départages...]
export function evaluate(cards) {
  const values = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const bySuit = {};
  cards.forEach((c) => (bySuit[c.suit] = bySuit[c.suit] || []).push(RANK_VALUE[c.rank]));
  const flushSuit = Object.keys(bySuit).find((s) => bySuit[s].length >= 5);

  if (flushSuit) {
    const sf = straightHigh(bySuit[flushSuit]);
    if (sf) return [sf === 14 ? 9 : 8, sf];
  }

  const counts = {};
  values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const groups = Object.entries(counts)
    .map(([v, n]) => ({ v: Number(v), n }))
    .sort((a, b) => b.n - a.n || b.v - a.v);
  const kickers = (exclude, n) => values.filter((v) => !exclude.includes(v)).slice(0, n);

  if (groups[0].n === 4) return [7, groups[0].v, ...kickers([groups[0].v], 1)];
  if (groups[0].n === 3 && groups[1] && groups[1].n >= 2) {
    // Avec 8 cartes ou plus (brelan + brelan + paire), la meilleure paire n'est pas forcément le 2e groupe
    return [6, groups[0].v, Math.max(...groups.slice(1).filter((g) => g.n >= 2).map((g) => g.v))];
  }
  if (flushSuit) return [5, ...bySuit[flushSuit].sort((a, b) => b - a).slice(0, 5)];
  const st = straightHigh(values);
  if (st) return [4, st];
  if (groups[0].n === 3) return [3, groups[0].v, ...kickers([groups[0].v], 2)];
  if (groups[0].n === 2 && groups[1] && groups[1].n === 2) return [2, groups[0].v, groups[1].v, ...kickers([groups[0].v, groups[1].v], 1)];
  if (groups[0].n === 2) return [1, groups[0].v, ...kickers([groups[0].v], 3)];
  return [0, ...values.slice(0, 5)];
}

export function compareHands(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const d = (a[i] || 0) - (b[i] || 0);
    if (d) return d;
  }
  return 0;
}

// Toutes les combinaisons de k éléments d'un tableau
export function combinations(arr, k) {
  const out = [];
  const pick = [];
  const rec = (start) => {
    if (pick.length === k) {
      out.push(pick.slice());
      return;
    }
    for (let i = start; i <= arr.length - (k - pick.length); i += 1) {
      pick.push(arr[i]);
      rec(i + 1);
      pick.pop();
    }
  };
  rec(0);
  return out;
}

// Meilleure main de 5 cartes parmi une liste de combinaisons : { rank, cards }
function bestAmong(fives) {
  let best = null;
  fives.forEach((cards) => {
    const rank = evaluate(cards);
    if (!best || compareHands(rank, best.rank) > 0) best = { rank, cards };
  });
  return best;
}

// Omaha : OBLIGATOIREMENT 2 cartes privées + 3 cartes du tableau (tableau d'au moins 3 cartes)
export function omahaBest(hole, board) {
  const fives = [];
  combinations(hole, 2).forEach((h) => combinations(board, 3).forEach((b) => fives.push([...h, ...b])));
  return bestAmong(fives);
}

export function evaluateOmaha(hole, board) {
  return omahaBest(hole, board).rank;
}

// Meilleure main libre (Hold'em) : n'importe quelles 5 cartes parmi privées + tableau
export function holdemBest(hole, board) {
  const all = [...hole, ...board];
  if (all.length <= 5) return { rank: evaluate(all), cards: all };
  return bestAmong(combinations(all, 5));
}

// Valeur d'une main selon la variante (sert à l'abattage)
export function variantRank(variant, hole, board) {
  if (variant === "omaha") return evaluateOmaha(hole, board);
  if (variant === "draw") return evaluate(hole);
  return evaluate([...hole, ...board]);
}

// Les 5 cartes qui forment la meilleure main selon la variante
export function variantBest(variant, hole, board) {
  if (variant === "omaha") return omahaBest(hole, board);
  if (variant === "draw") return { rank: evaluate(hole), cards: hole };
  return holdemBest(hole, board);
}

// ---------- Force d'une main (pour l'ordinateur), entre 0 et 1 ----------
function preflopStrength(hole) {
  const [a, b] = hole.map((c) => RANK_VALUE[c.rank]).sort((x, y) => y - x);
  let score = a / 14 * 0.5 + b / 14 * 0.2;
  if (a === b) score += 0.35 + a / 60;
  if (hole[0].suit === hole[1].suit) score += 0.06;
  if (a - b === 1) score += 0.05;
  return Math.min(1, score);
}

// Omaha avant le flop : paires hautes, cartes assorties et connectées
function omahaPreflopStrength(hole) {
  const values = hole.map((c) => RANK_VALUE[c.rank]).sort((x, y) => y - x);
  let score = (values.reduce((a, b) => a + b, 0) / 56) * 0.35;
  const counts = {};
  values.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  Object.entries(counts).forEach(([v, n]) => {
    if (n === 2) score += 0.12 + (Number(v) / 14) * 0.18;
    if (n >= 3) score -= 0.12; // brelan en main : très mauvais en Omaha
  });
  const suits = {};
  hole.forEach((c) => (suits[c.suit] = (suits[c.suit] || []).concat(RANK_VALUE[c.rank])));
  Object.values(suits).forEach((vals) => {
    if (vals.length === 2) score += vals.includes(14) ? 0.09 : 0.06;
  });
  const distinct = [...new Set(values)];
  if (distinct.length === 4 && distinct[0] - distinct[3] <= 4) score += 0.12;
  else if (distinct.length >= 3 && distinct[0] - distinct[distinct.length - 1] <= 4) score += 0.06;
  return Math.max(0, Math.min(1, score));
}

// Omaha après le flop : les mains sont plus fortes qu'au Hold'em, on est plus prudent
function omahaStrength(hole, board) {
  if (board.length < 3) return omahaPreflopStrength(hole);
  const [cat, top] = evaluateOmaha(hole, board);
  const boardCat = evaluate(board)[0];
  let s = [0.08, 0.32, 0.52, 0.66, 0.74, 0.8, 0.9, 0.96, 0.99, 1][cat];
  if (cat <= boardCat && cat < 4) s -= 0.12;
  if (cat === 1 && top >= 12) s += 0.06;
  return Math.max(0, Math.min(1, s));
}

// 5 cartes fermé : valeur de la main, plus le potentiel de tirage avant l'échange
function drawStrength(hole, beforeDraw) {
  const [cat, top] = evaluate(hole);
  let s;
  if (cat === 0) s = 0.05 + (top / 14) * 0.15;
  else if (cat === 1) s = 0.3 + (top / 14) * 0.25;
  else s = [0, 0, 0.68, 0.8, 0.86, 0.9, 0.95, 0.98, 0.99, 1][cat];
  if (beforeDraw && cat < 4) {
    const suitCounts = {};
    hole.forEach((c) => (suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1));
    if (Math.max(...Object.values(suitCounts)) === 4) s = Math.max(s, 0.46);
    const vals = [...new Set(hole.map((c) => RANK_VALUE[c.rank]))].sort((a, b) => a - b);
    for (let i = 0; i + 3 < vals.length; i += 1) if (vals[i + 3] - vals[i] === 3 && vals[i + 3] < 14) s = Math.max(s, 0.42);
  }
  return Math.max(0, Math.min(1, s));
}

export function handStrength(hole, board, stage) {
  if (hole.length === 5 && board.length === 0) return drawStrength(hole, stage !== "postdraw");
  if (hole.length === 4) return omahaStrength(hole, board);
  if (board.length === 0) return preflopStrength(hole);
  const [cat, top] = evaluate([...hole, ...board]);
  const boardCat = evaluate(board.length >= 5 ? board : board)[0];
  // On valorise surtout ce que les cartes privées apportent
  let s = [0.15, 0.45, 0.62, 0.74, 0.8, 0.85, 0.92, 0.97, 0.99, 1][cat];
  if (cat <= boardCat && cat < 4) s -= 0.15;
  if (cat === 1 && top >= 11) s += 0.08;
  return Math.max(0, Math.min(1, s));
}

// ---------- Partie ----------
export function newTable({ playerName, bots = 3, chips = 1000, botChips = 1000, variant = "holdem", limit = "nl" }) {
  const botNames = ["Lia", "Max", "Rosie", "Zack", "Nora"];
  const players = [{ id: "me", name: playerName, chips, isBot: false }];
  for (let i = 0; i < bots; i += 1) players.push({ id: `bot${i}`, name: botNames[i], chips: botChips, isBot: true, style: [0.35, 0.55, 0.2, 0.45, 0.3][i] });
  return { players, dealer: Math.floor(Math.random() * players.length), smallBlind: 10, bigBlind: 20, handNo: 0, stage: "idle", variant, limit };
}

// Cartes privées par variante
export const HOLE_CARDS = { holdem: 2, omaha: 4, draw: 5 };

const alive = (state) => state.players.filter((p) => p.chips > 0 || p.inHand);
const nextIndex = (state, from, pred) => {
  const n = state.players.length;
  for (let k = 1; k <= n; k += 1) {
    const i = (from + k) % n;
    if (pred(state.players[i], i)) return i;
  }
  return -1;
};
const canAct = (p) => p.inHand && !p.folded && !p.allIn;

function post(state, i, amount) {
  const p = state.players[i];
  const pay = Math.min(amount, p.chips);
  p.chips -= pay;
  p.bet += pay;
  p.total += pay;
  if (p.chips === 0) p.allIn = true;
  return pay;
}

// Nouvelle main : blindes, distribution
export function startHand(prev) {
  const state = structuredClone(prev);
  state.handNo += 1;
  // Les blindes montent toutes les 8 mains
  if (state.handNo > 1 && state.handNo % 8 === 1) {
    state.smallBlind *= 2;
    state.bigBlind *= 2;
  }
  state.deck = shuffledDeck();
  state.muck = [];
  state.refunds = {};
  state.board = [];
  const holeCount = HOLE_CARDS[state.variant] || 2;
  state.log = [];
  state.winners = null;
  state.players.forEach((p) => {
    p.inHand = p.chips > 0;
    p.folded = !p.inHand;
    p.allIn = false;
    p.bet = 0;
    p.total = 0;
    p.hole = p.inHand ? Array.from({ length: holeCount }, () => state.deck.pop()) : [];
    p.lastAction = null;
    p.best = null;
    p.drew = null;
  });
  state.dealer = nextIndex(state, state.dealer, (p) => p.inHand);
  const headsUp = state.players.filter((p) => p.inHand).length === 2;
  const sb = headsUp ? state.dealer : nextIndex(state, state.dealer, (p) => p.inHand);
  const bb = nextIndex(state, sb, (p) => p.inHand);
  post(state, sb, state.smallBlind);
  post(state, bb, state.bigBlind);
  state.players[sb].lastAction = "SB";
  state.players[bb].lastAction = "BB";
  state.sb = sb;
  state.bb = bb;
  state.currentBet = state.bigBlind;
  state.minRaise = state.bigBlind;
  state.stage = state.variant === "draw" ? "predraw" : "preflop";
  state.toAct = nextIndex(state, bb, canAct);
  state.pending = state.players.map((p, i) => i).filter((i) => canAct(state.players[i]));
  return settleIfNeeded(state);
}

export function pot(state) {
  return state.players.reduce((s, p) => s + (p.total || 0), 0);
}

// Relance maximale permise : tapis (sans limite) ou mise du pot (pot-limit)
function raiseCap(state, p) {
  const allIn = p.bet + p.chips;
  if (state.limit !== "pl") return allIn;
  const toCall = state.currentBet - p.bet;
  return Math.min(allIn, state.currentBet + pot(state) + toCall);
}

export function legalActions(state) {
  const p = state.players[state.toAct];
  const toCall = state.currentBet - p.bet;
  const maxRaiseTo = raiseCap(state, p);
  return {
    toCall: Math.min(toCall, p.chips),
    canCheck: toCall === 0,
    minRaiseTo: Math.min(state.currentBet + state.minRaise, maxRaiseTo),
    maxRaiseTo
  };
}

// Applique une action : { type: "fold" | "check" | "call" | "raise", to? }
export function act(prev, action) {
  const state = structuredClone(prev);
  const i = state.toAct;
  const p = state.players[i];
  const toCall = state.currentBet - p.bet;
  state.pending = state.pending.filter((x) => x !== i);

  if (action.type === "fold") {
    p.folded = true;
    p.lastAction = "fold";
  } else if (action.type === "check" || (action.type === "call" && toCall <= 0)) {
    p.lastAction = "check";
  } else if (action.type === "call") {
    post(state, i, toCall);
    p.lastAction = p.allIn ? "allin" : "call";
  } else if (action.type === "raise") {
    const target = Math.min(Math.max(action.to, state.currentBet + state.minRaise), raiseCap(state, p));
    const raiseBy = target - state.currentBet;
    post(state, i, target - p.bet);
    if (target > state.currentBet) {
      if (raiseBy >= state.minRaise) state.minRaise = raiseBy;
      state.currentBet = target;
      // Tout le monde doit répondre à la relance
      state.pending = state.players.map((_, k) => k).filter((k) => k !== i && canAct(state.players[k]));
    }
    p.lastAction = p.allIn ? "allin" : "raise";
  }
  state.log.push({ name: p.name, action: p.lastAction });
  const next = nextIndex(state, i, (q, k) => canAct(q) && state.pending.includes(k));
  state.toAct = next;
  return settleIfNeeded(state);
}

// Fin de tour d'enchères, rue suivante ou abattage
function settleIfNeeded(state) {
  const inHand = state.players.filter((p) => p.inHand && !p.folded);
  if (inHand.length === 1) return awardSingle(state, inHand[0]);
  if (state.pending.length > 0 && state.toAct !== -1) return state;

  // Tour terminé : on passe à la rue suivante
  state.players.forEach((p) => {
    p.bet = 0;
  });
  state.currentBet = 0;
  state.minRaise = state.bigBlind;
  const order =
    state.variant === "draw"
      ? { predraw: "draw", draw: "postdraw", postdraw: "showdown" }
      : { preflop: "flop", flop: "turn", turn: "river", river: "showdown" };
  state.stage = order[state.stage];
  if (state.stage === "flop") state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
  else if (state.stage === "turn" || state.stage === "river") state.board.push(state.deck.pop());
  if (state.stage === "showdown") return showdown(state);

  // 5 cartes fermé : phase d'échange, chaque joueur encore en jeu (même à tapis) échange à son tour
  if (state.stage === "draw") {
    state.pending = state.players.map((_, k) => k).filter((k) => state.players[k].inHand && !state.players[k].folded);
    state.toAct = nextIndex(state, state.dealer, (q, k) => state.pending.includes(k));
    return state;
  }
  return openBettingRound(state);
}

// Ouvre un tour d'enchères (après le flop, la turn, l'échange…) ou dévoile la suite si plus personne ne peut miser
export function openBettingRound(state) {
  const actors = state.players.map((_, k) => k).filter((k) => canAct(state.players[k]));
  // Plus personne ne peut miser (tapis) : on dévoile le reste
  if (actors.length <= 1) {
    state.pending = [];
    state.toAct = -1;
    state.players.forEach((p) => {
      if (p.inHand && !p.folded) p.lastAction = p.allIn ? "allin" : p.lastAction;
    });
    return settleIfNeeded(state);
  }
  state.players.forEach((p) => {
    if (canAct(p)) p.lastAction = null;
  });
  state.pending = actors;
  state.toAct = nextIndex(state, state.dealer, canAct);
  return state;
}

function awardSingle(state, winner) {
  const amount = pot(state);
  winner.chips += amount;
  state.winners = [{ id: winner.id, amount, hand: null }];
  state.stage = "done";
  state.toAct = -1;
  return state;
}

// Abattage avec pots secondaires
function showdown(state) {
  const contenders = state.players.filter((p) => p.inHand && !p.folded);
  contenders.forEach((p) => {
    p.rank = variantRank(state.variant, p.hole, state.board);
    p.best = variantBest(state.variant, p.hole, state.board).cards.map((c) => c.id);
  });
  const levels = [...new Set(state.players.filter((p) => p.total > 0).map((p) => p.total))].sort((a, b) => a - b);
  const payouts = {};
  state.refunds = {};
  let prevLevel = 0;
  levels.forEach((level) => {
    const layer = state.players.reduce((s, p) => s + Math.max(0, Math.min(p.total, level) - prevLevel), 0);
    const eligible = contenders.filter((p) => p.total >= level);
    if (!eligible.length && layer) {
      // Mise que personne encore en jeu n'a égalée (ex. : blinde plus grosse qu'un tapis, puis passe) :
      // elle retourne à ceux qui l'ont versée, sinon ces jetons disparaîtraient
      state.players.forEach((p) => {
        const slice = Math.max(0, Math.min(p.total, level) - prevLevel);
        if (slice) {
          p.chips += slice;
          state.refunds[p.id] = (state.refunds[p.id] || 0) + slice;
        }
      });
    }
    prevLevel = level;
    if (!eligible.length || !layer) return;
    let best = [eligible[0]];
    eligible.slice(1).forEach((p) => {
      const c = compareHands(p.rank, best[0].rank);
      if (c > 0) best = [p];
      else if (c === 0) best.push(p);
    });
    const share = Math.floor(layer / best.length);
    best.forEach((p, k) => (payouts[p.id] = (payouts[p.id] || 0) + share + (k === 0 ? layer - share * best.length : 0)));
  });
  state.winners = Object.entries(payouts).map(([id, amount]) => {
    const p = state.players.find((x) => x.id === id);
    p.chips += amount;
    return { id, amount, hand: p.rank[0] };
  });
  state.stage = "done";
  state.toAct = -1;
  return state;
}

// ---------- Décision de l'ordinateur ----------
export function botDecision(state) {
  const p = state.players[state.toAct];
  const { toCall, canCheck, minRaiseTo, maxRaiseTo } = legalActions(state);
  const strength = handStrength(p.hole, state.board, state.stage);
  const potSize = pot(state);
  const odds = toCall / Math.max(1, potSize + toCall);
  const rnd = Math.random();
  const bluff = rnd < p.style * 0.18;

  if (strength > 0.82 || (bluff && canCheck)) {
    const target = Math.min(maxRaiseTo, Math.max(minRaiseTo, state.currentBet + Math.round((potSize * (0.5 + rnd * 0.6)) / 10) * 10));
    if (target > state.currentBet && maxRaiseTo > state.currentBet) return { type: "raise", to: target };
  }
  if (canCheck) {
    if (strength > 0.6 && rnd < 0.35 + p.style * 0.3 && minRaiseTo > state.currentBet) return { type: "raise", to: minRaiseTo };
    return { type: "check" };
  }
  if (strength + p.style * 0.1 > odds + 0.25 || (toCall <= state.bigBlind && strength > 0.3)) return { type: "call" };
  if (bluff && toCall < potSize * 0.3) return { type: "call" };
  return { type: "fold" };
}
