import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import {
  farkleScore,
  hasFarkleScore,
  makeSudoku,
  sudokuSolutions,
  sudokuConflict,
  cribbageHand,
  peggingPoints,
  checkersMoves,
  initialCheckers,
  yamsScore,
  yamsTotal,
} from "./rules.js";
import yams from "../../net/games/yams.js";
import naval from "../../net/games/naval.js";
import { cribbageDeal, cribbageAction } from "./cribbageRules.js";
import { TALES } from "./tales.js";
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const card = (rank, suit = "hearts") => ({ rank: String(rank), suit });
test("Farkle scores singles, sets, straight and three pairs; rejects dead dice", () => {
  assert.equal(farkleScore([1, 5]), 150);
  assert.equal(farkleScore([2, 2, 2]), 200);
  assert.equal(farkleScore([1, 1, 1, 1]), 2000);
  assert.equal(farkleScore([1, 2, 3, 4, 5, 6]), 1500);
  assert.equal(farkleScore([2, 2, 3, 3, 6, 6]), 1500);
  assert.equal(farkleScore([1, 2]), 0);
  assert.equal(hasFarkleScore([2, 3, 4, 6]), false);
  assert.equal(hasFarkleScore([2, 2, 2, 6]), true);
});
test("Sudoku levels have one solution and valid givens", () => {
  let x = 123;
  const rand = () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
  for (const holes of [30, 38, 46]) {
    const p = makeSudoku(rand, holes);
    assert.equal(sudokuSolutions(p.puzzle), 1);
    assert.equal(p.solution.length, 81);
    assert.ok(p.solution.every((n, i) => !sudokuConflict(p.solution, i, n)));
    assert.ok(p.puzzle.every((n, i) => !n || n === p.solution[i]));
  }
});
test("Cribbage famous 29-point hand and crib flush rule", () => {
  assert.deepEqual(
    cribbageHand(
      [card(5, "clubs"), card(5, "diamonds"), card(5, "spades"), card("J")],
      card(5),
    ),
    { fifteens: 16, pairs: 12, runs: 0, flush: 0, nobs: 1, total: 29 },
  );
  const h = [card(2), card(4), card(6), card(8)];
  assert.equal(cribbageHand(h, card("K", "clubs")).flush, 4);
  assert.equal(cribbageHand(h, card("K", "clubs"), true).flush, 0);
  assert.equal(
    cribbageHand(
      [card(3), card(3, "clubs"), card(4), card(5)],
      card(9, "clubs"),
    ).runs,
    6,
  );
});
test("Pegging counts 15, pairs, triples, quads and trailing runs", () => {
  assert.equal(peggingPoints([card(7), card(8)]), 2);
  assert.equal(peggingPoints([card(4), card(4)]), 2);
  assert.equal(peggingPoints([card(4), card(4), card(4)]), 6);
  assert.equal(peggingPoints([card(4), card(4), card(4), card(4)]), 12);
  assert.equal(peggingPoints([card(7), card(3), card(5), card(4)]), 3);
});
test("Checkers enforces captures and supports a forced continuation", () => {
  assert.equal(initialCheckers().filter((v) => v === 1).length, 12);
  const b = Array(64).fill(0);
  b[42] = 1;
  b[33] = -1;
  b[17] = -1;
  assert.deepEqual(checkersMoves(b, 1), [{ from: 42, to: 24, capture: 33 }]);
  b[42] = 0;
  b[33] = 0;
  b[24] = 1;
  assert.deepEqual(checkersMoves(b, 1, 24, true), [
    { from: 24, to: 10, capture: 17 },
  ]);
});
test("Network Yam’s rejects invalid turns, duplicate scoring and holds", () => {
  let s = yams.setup({ seats: ["a", "b"] });
  assert.equal(yams.apply(s, "b", { type: "roll" }), null);
  assert.equal(yams.apply(s, "a", { type: "hold", index: 0 }), null);
  s = yams.apply(s, "a", { type: "roll" });
  assert.equal(s.dice.length, 5);
  assert.ok(s.dice.every((n) => n >= 1 && n <= 6));
  s = yams.apply(s, "a", { type: "score", category: "chance" });
  assert.equal(s.turn, 1);
  assert.equal(yams.apply(s, "a", { type: "score", category: "chance" }), null);
  assert.equal(yamsScore("petite", [1, 2, 3, 4, 4]), 30);
  assert.equal(yamsScore("full", [5, 5, 5, 5, 5]), 0);
  assert.equal(yamsTotal({ 1: 3, 2: 6, 3: 9, 4: 12, 5: 15, 6: 18 }), 98);
});
test("Network naval hides the opposing fleet and rejects repeat shots", () => {
  let s = naval.setup({ seats: ["a", "b"] });
  assert.equal(s.boards[0].filter(Boolean).length, 14);
  let v = naval.view(s, "a", { names: { a: "A", b: "B" } });
  assert.equal("boards" in v, false);
  assert.deepEqual(v.board, s.boards[0]);
  assert.equal(naval.apply(s, "b", { type: "fire", cell: 0 }), null);
  s = naval.apply(s, "a", { type: "fire", cell: 0 });
  assert.equal(naval.apply(s, "a", { type: "fire", cell: 0 }), null);
  s = naval.apply(s, "b", { type: "fire", cell: 1 });
  assert.equal(naval.apply(s, "a", { type: "fire", cell: 0 }), null);
  assert.deepEqual(naval.view(s, "spectator", { names: {} }).board, []);
});
test("Cribbage full simulated match reaches 121 without deadlock", () => {
  const deck = () =>
    Array.from({ length: 52 }, (_, i) =>
      card(
        ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][
          i % 13
        ],
        ["hearts", "clubs", "diamonds", "spades"][Math.floor(i / 13)],
      ),
    );
  let s = cribbageDeal(deck());
  let steps = 0;
  while (s.winner === null && steps++ < 10000) {
    let next;
    if (s.phase === "discard")
      next = cribbageAction(s, 0, { type: "discard", indices: [0, 1] });
    else if (s.phase === "peg") {
      const total = s.sequence.reduce(
        (n, c) =>
          n +
          Math.min(10, { A: 1, J: 11, Q: 12, K: 13 }[c.rank] || Number(c.rank)),
        0,
      );
      const i = s.hands[s.turn].findIndex(
        (c) =>
          total +
            Math.min(
              10,
              { A: 1, J: 11, Q: 12, K: 13 }[c.rank] || Number(c.rank),
            ) <=
          31,
      );
      next = cribbageAction(
        s,
        s.turn,
        i < 0 ? { type: "go" } : { type: "play", index: i },
      );
    } else if (s.phase === "count")
      next = cribbageAction(s, 0, { type: "count" });
    else if (s.phase === "round")
      next = cribbageDeal(deck(), 1 - s.dealer, s.scores);
    assert.ok(next, `Deadlock in ${s.phase}`);
    s = next;
  }
  assert.ok(steps < 10000);
  assert.ok(s.scores[s.winner] >= 121);
});
test("Every adventure choice has a real destination and reachable ending", () => {
  for (const tale of TALES) {
    const seen = new Set();
    function visit(id) {
      if (seen.has(id)) return;
      seen.add(id);
      const n = tale.nodes[id];
      assert.ok(n, id);
      assert.ok(n.text.fr && n.text.en);
      for (const c of n.choices || []) {
        visit(c.to);
        if (c.fail) visit(c.fail);
      }
    }
    visit("start");
    assert.ok([...seen].some((id) => tale.nodes[id].end));
    assert.equal(seen.size, Object.keys(tale.nodes).length);
  }
});
