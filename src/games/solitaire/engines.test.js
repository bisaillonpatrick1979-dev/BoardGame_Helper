// Tests purs des moteurs de solitaire — à lancer avec :  node src/games/solitaire/engines.test.js
import assert from "node:assert/strict";
import { allCards, card, codeOf, isAltRun, isUp, rankOf, seeded, suitIdx, top } from "./engines/cards.js";
import { ENGINES, actionHighlight } from "./engines/index.js";
import * as K from "./engines/klondike.js";
import * as F from "./engines/freecell.js";
import * as S from "./engines/spider.js";
import * as P from "./engines/pyramid.js";
import * as G from "./engines/golf.js";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

// Fabrique une carte : rang 1-13, couleur 0♠ 1♥ 2♦ 3♣, copie
const C = (r, s, up = true, copy = 0) => card(copy * 52 + s * 13 + r - 1, up);

// Invariants communs : bon nombre de cartes, aucun doublon
function checkCards(state, total) {
  const cards = allCards(state);
  assert.equal(cards.length, total, "nombre de cartes");
  const codes = new Set(cards.map(codeOf));
  assert.equal(codes.size, total, "doublons");
}

function checkFoundations(state, ids) {
  ids.forEach((f) => {
    state.piles[f].forEach((v, i) => {
      assert.equal(rankOf(v), i + 1, "fondation dans l'ordre");
      assert.equal(suitIdx(v), suitIdx(state.piles[f][0]), "fondation d'une seule couleur");
    });
  });
}

// ---------- Klondike ----------
test("Klondike : distribution", () => {
  const s = K.deal({ draw: 3 }, seeded(1));
  checkCards(s, 52);
  K.TABLEAU.forEach((t, i) => {
    assert.equal(s.piles[t].length, i + 1);
    assert.ok(isUp(top(s.piles[t])));
    s.piles[t].slice(0, -1).forEach((v) => assert.ok(!isUp(v)));
  });
  assert.equal(s.piles.stock.length, 24);
  assert.equal(s.draw, 3);
});

test("Klondike : pioche 3 et recyclage", () => {
  let s = K.deal({ draw: 3 }, seeded(2));
  const firstThree = s.piles.stock.slice(-3).reverse();
  s = K.apply(s, { t: "draw" });
  assert.equal(s.piles.waste.length, 3);
  assert.deepEqual(s.piles.waste.map(codeOf), firstThree.map(codeOf));
  assert.ok(s.piles.waste.every(isUp));
  for (let i = 0; i < 7; i += 1) s = K.apply(s, { t: "draw" });
  assert.equal(s.piles.stock.length, 0);
  assert.equal(s.piles.waste.length, 24);
  s = K.apply(s, { t: "draw" }); // recyclage
  assert.equal(s.piles.stock.length, 24);
  assert.equal(s.passes, 1);
  assert.ok(s.piles.stock.every((v) => !isUp(v)));
  assert.equal(codeOf(top(s.piles.stock)), codeOf(firstThree[0]), "l'ordre du talon est conservé");
});

function emptyKlondike() {
  const piles = { stock: [], waste: [] };
  [...K.FOUNDATIONS, ...K.TABLEAU].forEach((p) => (piles[p] = []));
  return { v: "klondike", draw: 1, piles, moves: 0, passes: 0 };
}

test("Klondike : règles de déplacement", () => {
  const s = emptyKlondike();
  s.piles.t0 = [C(5, 0, false), C(9, 0)]; // 9♠
  s.piles.t1 = [C(8, 1)]; // 8♥
  s.piles.t2 = [C(8, 3)]; // 8♣
  s.piles.t3 = [C(13, 2)]; // R♦
  s.piles.waste = [C(1, 3)]; // A♣
  assert.ok(K.canMove(s, "t1", 0, "t0"), "8♥ sur 9♠");
  assert.ok(!K.canMove(s, "t2", 0, "t0"), "8♣ pas sur 9♠");
  assert.ok(K.canMove(s, "t3", 0, "t4"), "Roi vers colonne vide");
  assert.ok(!K.canMove(s, "t1", 0, "t4"), "8 pas vers colonne vide");
  assert.ok(K.canMove(s, "waste", 0, "f0"), "As vers fondation");
  assert.ok(!K.canMove(s, "t0", 0, "t5"), "carte cachée non déplaçable");
  const n = K.apply(s, { t: "move", from: "t0", index: 1, to: "t4" });
  assert.equal(n, null, "9 vers colonne vide refusé");
  // Toucher l'As : fondation
  assert.deepEqual(K.tap(s, "waste", 0).to[0], "f");
  // Déplacer 9♠ … et retourner la carte cachée
  s.piles.t5 = [C(10, 1)];
  const m = K.apply(s, { t: "move", from: "t0", index: 1, to: "t5" });
  assert.ok(isUp(top(m.piles.t0)), "carte retournée");
  assert.equal(m.moves, 1);
  // Toucher 8♥ : va sur 9♠ (seule destination)
  assert.equal(K.tap(m, "t1", 0).to, "t5");
});

test("Klondike : victoire et fin automatique", () => {
  const s = emptyKlondike();
  K.FOUNDATIONS.forEach((f, i) => (s.piles[f] = Array.from({ length: 12 }, (_, r) => C(r + 1, i))));
  s.piles.t0 = [C(13, 0), C(13, 1)];
  s.piles.t1 = [C(13, 2)];
  s.piles.t2 = [C(13, 3)];
  // Colonne invalide volontaire (deux rois) : la fin auto doit quand même vider proprement
  let st = s;
  let guard = 0;
  while (!K.isWon(st) && guard++ < 20) st = K.apply(st, K.autoComplete(st));
  assert.ok(K.isWon(st));
  assert.equal(K.autoComplete(st), null);
});

// Partie aléatoire : coups au hasard, vérifie les invariants à chaque coup
function randomPlayout(engine, opts, seed, steps, total, foundations, extraCheck) {
  const rng = seeded(seed);
  let s = engine.deal(opts, rng);
  for (let i = 0; i < steps; i += 1) {
    checkCards(s, total);
    if (foundations) checkFoundations(s, foundations);
    if (extraCheck) extraCheck(s);
    const list = engine.actions(s);
    if (!list.length || engine.isWon(s)) break;
    // Mélange de hasard et d'indices pour aller loin dans la partie
    const pick = rng() < 0.5 ? engine.hint(s) || list[0] : list[Math.floor(rng() * list.length)];
    const next = engine.apply(s, pick);
    assert.ok(next, `action légale refusée : ${JSON.stringify(pick)}`);
    assert.equal(next.moves, s.moves + 1);
    s = next;
  }
  return s;
}

test("Klondike : 400 parties aléatoires sans état invalide", () => {
  let wins = 0;
  for (let seed = 1; seed <= 400; seed += 1) {
    const s = randomPlayout(K, { draw: seed % 2 ? 1 : 3 }, seed, 500, 52, K.FOUNDATIONS, (st) => {
      K.TABLEAU.forEach((t) => {
        const p = st.piles[t];
        const firstUp = p.findIndex(isUp);
        if (p.length) assert.ok(firstUp >= 0, "le dessus d'une colonne est visible");
        assert.ok(isAltRun(p.slice(firstUp)), "cartes visibles en suite alternée");
      });
      assert.ok(st.piles.stock.every((v) => !isUp(v)));
      assert.ok(st.piles.waste.every(isUp));
    });
    if (K.isWon(s)) wins += 1;
  }
  console.log(`  Klondike : ${wins}/400 parties gagnées par le joueur automatique`);
});

// ---------- FreeCell ----------
test("FreeCell : distribution et capacité de déplacement", () => {
  const s = F.deal({}, seeded(3));
  checkCards(s, 52);
  assert.deepEqual(F.TABLEAU.map((t) => s.piles[t].length), [7, 7, 7, 7, 6, 6, 6, 6]);
  assert.equal(F.maxMovable(s), 5);
  const e = { ...s, piles: { ...s.piles, c0: [C(1, 0)], t7: [] } };
  assert.equal(F.maxMovable(e), 8); // 3 cellules libres + 1, × 2 (une colonne vide)
  assert.equal(F.maxMovable(e, "t7"), 4); // la colonne vide visée ne compte pas
});

function emptyFreecell() {
  const piles = {};
  [...F.CELLS, ...F.FOUNDATIONS, ...F.TABLEAU].forEach((p) => (piles[p] = []));
  return { v: "freecell", piles, moves: 0 };
}

test("FreeCell : règles de déplacement", () => {
  const s = emptyFreecell();
  s.piles.t0 = [C(10, 0), C(9, 1), C(8, 0), C(7, 1), C(6, 0), C(5, 1)];
  s.piles.t1 = [C(11, 1)];
  s.piles.c0 = [C(2, 2)];
  s.piles.c1 = [C(3, 2)];
  s.piles.c2 = [C(4, 2)];
  s.piles.c3 = [C(5, 2)];
  s.piles.t2 = [C(1, 3)];
  s.piles.t3 = [C(2, 3)];
  s.piles.t4 = [C(3, 3)];
  s.piles.t5 = [C(4, 3)];
  s.piles.t6 = [C(6, 3)];
  s.piles.t7 = [C(7, 3)];
  // Aucune cellule ni colonne libre : une seule carte à la fois
  assert.equal(F.maxMovable(s), 1);
  assert.ok(!F.canMove(s, "t0", 0, "t1"), "6 cartes : trop");
  assert.ok(F.canMove(s, "t0", 5, "t6"), "5♥ sur 6♣");
  assert.ok(!F.canMove(s, "t0", 4, "t7"), "2 cartes : trop");
  assert.ok(F.canMove(s, "t2", 0, "f0"), "As vers fondation");
  assert.ok(!F.canMove(s, "t3", 0, "c0"), "cellule occupée");
  assert.ok(!F.canMove(s, "c0", 0, "c1"), "cellule vers cellule refusé");
  const s2 = F.apply(s, { t: "move", from: "t2", index: 0, to: "f0" });
  assert.equal(F.maxMovable(s2), 2);
  assert.ok(!F.canMove(s2, "t0", 4, "t2"), "2 cartes vers la seule colonne vide : capacité 1");
  assert.ok(F.canMove(s2, "t0", 5, "t2"), "1 carte vers colonne vide");
});

test("FreeCell : fin automatique quand tout est trié", () => {
  const s = emptyFreecell();
  for (let suit = 0; suit < 4; suit += 1) {
    s.piles[F.TABLEAU[suit]] = Array.from({ length: 13 }, (_, i) => C(13 - i, suit));
  }
  let st = s;
  let guard = 0;
  while (!F.isWon(st) && guard++ < 60) {
    const a = F.autoComplete(st);
    assert.ok(a);
    st = F.apply(st, a);
  }
  assert.ok(F.isWon(st));
  checkFoundations(st, F.FOUNDATIONS);
});

test("FreeCell : 400 parties aléatoires sans état invalide", () => {
  for (let seed = 1; seed <= 400; seed += 1) {
    randomPlayout(F, {}, seed * 7, 400, 52, F.FOUNDATIONS, (st) => {
      F.CELLS.forEach((c) => assert.ok(st.piles[c].length <= 1, "une carte par cellule"));
      assert.ok(allCards(st).every(isUp));
    });
  }
});

// ---------- Araignée ----------
test("Araignée : distribution 1, 2 et 4 couleurs", () => {
  [1, 2, 4].forEach((n) => {
    const s = S.deal({ suits: n }, seeded(n));
    checkCards(s, 104);
    const suits = new Set(allCards(s).map(suitIdx));
    assert.equal(suits.size, n);
    assert.equal(s.piles.stock.length, 50);
    assert.deepEqual(S.TABLEAU.map((t) => s.piles[t].length), [6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
  });
});

function emptySpider() {
  const piles = { stock: [], done: [] };
  S.TABLEAU.forEach((t) => (piles[t] = []));
  return { v: "spider", suits: 2, piles, moves: 0 };
}

test("Araignée : règles, distribution bloquée et suite complète", () => {
  const s = emptySpider();
  S.TABLEAU.forEach((t) => (s.piles[t] = [C(2, 3, true, 1)]));
  s.piles.t0 = [C(9, 0, false), C(13, 1)].concat(Array.from({ length: 11 }, (_, i) => C(12 - i, 1))); // R♥…2♥
  s.piles.t1 = [C(1, 1)]; // A♥
  s.piles.t2 = [C(5, 0), C(4, 1)]; // suite mêlée
  s.piles.stock = Array.from({ length: 10 }, (_, i) => C((i % 13) + 1, 0, false, 2));
  assert.ok(!S.canDrag(s, "t2", 0), "suite de couleurs mêlées non déplaçable");
  assert.ok(S.canDrag(s, "t2", 1));
  assert.ok(S.canMove(s, "t1", 0, "t0"), "A♥ sur 2♥");
  const n = S.apply(s, { t: "move", from: "t1", index: 0, to: "t0" });
  assert.equal(n.piles.done.length, 13, "suite complète retirée");
  assert.ok(isUp(top(n.piles.t0)), "carte dessous retournée");
  assert.ok(!S.canDeal(n), "distribution interdite avec une colonne vide");
  assert.equal(S.apply(n, { t: "deal" }), null);
  const filled = { ...n, piles: { ...n.piles, t1: [C(7, 0, true, 3)] } };
  const d = S.apply(filled, { t: "deal" });
  assert.equal(d.piles.stock.length, 0);
  S.TABLEAU.forEach((t) => assert.ok(isUp(top(d.piles[t]))));
});

test("Araignée : victoire", () => {
  const s = emptySpider();
  s.piles.done = Array.from({ length: 91 }, (_, i) => card(i + 13, true));
  s.piles.t0 = Array.from({ length: 12 }, (_, i) => C(13 - i, 0));
  s.piles.t1 = [C(1, 0)];
  S.TABLEAU.slice(2).forEach((t) => (s.piles[t] = []));
  const w = S.apply(s, { t: "move", from: "t1", index: 0, to: "t0" });
  assert.ok(S.isWon(w));
});

test("Araignée : 150 parties aléatoires sans état invalide", () => {
  for (let seed = 1; seed <= 150; seed += 1) randomPlayout(S, { suits: [1, 2, 4][seed % 3] }, seed, 300, 104);
});

// ---------- Pyramide ----------
test("Pyramide : géométrie", () => {
  assert.equal(P.rowOf(0), 0);
  assert.equal(P.rowOf(2), 1);
  assert.equal(P.rowOf(27), 6);
  assert.deepEqual(P.coveredBy(0), [1, 2]);
  assert.deepEqual(P.coveredBy(4), [7, 8]);
  assert.deepEqual(P.coveredBy(21), []);
});

test("Pyramide : paires, rois, talon", () => {
  let s = P.deal({}, seeded(9));
  checkCards(s, 52);
  assert.ok(!P.isFree(s, "p0"));
  assert.ok(P.isFree(s, "p21"));
  // On force des valeurs connues sur la dernière rangée
  s = { ...s, piles: { ...s.piles, p21: [C(6, 0)], p22: [C(7, 1)], p23: [C(13, 2)], p24: [C(5, 3)] } };
  const all = allCards(s).map(codeOf);
  assert.ok(all.length === 52);
  assert.equal(P.apply(s, { t: "pair", a: "p21", b: "p24" }), null, "6+5 ≠ 13");
  const a = P.apply(s, { t: "pair", a: "p21", b: "p22" });
  assert.equal(a.piles.done.length, 2);
  const k = P.apply(a, { t: "king", a: "p23" });
  assert.equal(k.piles.done.length, 3);
  assert.equal(P.tap(k, "p23"), null);
  // Talon : 24 cartes puis 2 recyclages
  let st = P.deal({}, seeded(10));
  let draws = 0;
  while (P.canDraw(st)) {
    st = P.apply(st, { t: "draw" });
    draws += 1;
  }
  assert.equal(draws, 24 * 3 + 2);
  assert.equal(st.recycles, 0);
});

test("Pyramide : 300 parties aléatoires + victoire détectée", () => {
  for (let seed = 1; seed <= 300; seed += 1) randomPlayout(P, {}, seed, 300, 52);
  const s = P.deal({}, seeded(4));
  const cleared = { ...s, piles: { ...s.piles } };
  P.SLOTS.forEach((p) => {
    cleared.piles.done = [...cleared.piles.done, ...cleared.piles[p]];
    cleared.piles[p] = [];
  });
  assert.ok(P.isWon(cleared));
  checkCards(cleared, 52);
});

// ---------- Golf ----------
test("Golf : jeu +1/-1 sans tour, victoire et blocage", () => {
  const s = G.deal({}, seeded(11));
  checkCards(s, 52);
  assert.equal(s.piles.stock.length, 16);
  const t = { ...s, piles: { ...s.piles } };
  G.TABLEAU.forEach((p) => (t.piles[p] = []));
  t.piles.t0 = [C(2, 0)];
  t.piles.t1 = [C(13, 1)];
  t.piles.waste = [C(1, 2)];
  t.piles.stock = [];
  assert.ok(G.canPlay(t, "t0"));
  assert.ok(!G.canPlay(t, "t1"), "pas de tour As → Roi");
  const n = G.apply(t, G.tap(t, "t0"));
  assert.ok(!G.isWon(n));
  assert.ok(G.stuck(n), "2 sur la défausse, Roi restant, talon vide : bloqué");
  const w = { ...n, piles: { ...n.piles, t1: [C(3, 1)] } };
  assert.ok(G.isWon(G.apply(w, { t: "play", from: "t1" })));
});

test("Golf : 300 parties aléatoires", () => {
  for (let seed = 1; seed <= 300; seed += 1) randomPlayout(G, {}, seed, 200, 52);
});

// ---------- Interface commune ----------
test("Tous les moteurs : interface complète + indice surlignable", () => {
  Object.entries(ENGINES).forEach(([id, e]) => {
    ["deal", "apply", "actions", "hint", "tap", "canSelect", "canDrag", "moveTo", "isWon", "autoComplete", "stuck"].forEach((fn) =>
      assert.equal(typeof e[fn], "function", `${id}.${fn}`)
    );
    const s = e.deal({}, seeded(5));
    const h = e.hint(s);
    const hl = actionHighlight(s, h);
    assert.ok(hl.cards.length + hl.piles.length > 0, `${id} : indice surlignable`);
    assert.ok(JSON.stringify(s).length < 2000, `${id} : sauvegarde compacte`);
  });
});

console.log(`✓ ${passed} tests réussis`);
