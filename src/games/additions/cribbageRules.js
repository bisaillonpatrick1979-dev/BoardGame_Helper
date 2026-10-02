import { cribbageHand, peggingPoints, pipValue } from "./rules.js";
export function cribbageDeal(deck, dealer = 0, scores = [0, 0]) {
  return {
    hands: [deck.slice(0, 6), deck.slice(6, 12)],
    original: null,
    starter: deck[12],
    crib: [],
    dealer,
    scores,
    turn: 1 - dealer,
    phase: "discard",
    sequence: [],
    passed: [false, false],
    last: null,
    countIndex: 0,
    winner: null,
    notice: null,
  };
}
function award(s, player, points, notice) {
  const scores = s.scores.map((v, i) => (i === player ? v + points : v));
  return {
    ...s,
    scores,
    winner: scores[player] >= 121 ? player : null,
    notice,
  };
}
function endPegging(s) {
  if (s.hands.every((h) => !h.length)) {
    if (
      s.last !== null &&
      s.sequence.reduce((n, c) => n + pipValue(c), 0) !== 31
    )
      s = award(s, s.last, 1, { kind: "last", player: s.last, points: 1 });
    return { ...s, phase: s.winner !== null ? "won" : "count", countIndex: 0 };
  }
  return s;
}
export function cribbageAction(s, player, action) {
  if (s.winner !== null) return null;
  if (s.phase === "discard") {
    if (
      s.crib.length ||
      player !== 0 ||
      action.type !== "discard" ||
      !Array.isArray(action.indices) ||
      action.indices.length !== 2 ||
      new Set(action.indices).size !== 2 ||
      action.indices.some((i) => !Number.isInteger(i) || i < 0 || i > 5)
    )
      return null;
    const botIndices = [4, 5];
    const hands = [
      s.hands[0].filter((_, i) => !action.indices.includes(i)),
      s.hands[1].filter((_, i) => !botIndices.includes(i)),
    ];
    let next = {
      ...s,
      hands,
      original: hands.map((h) => [...h]),
      crib: [
        ...action.indices.map((i) => s.hands[0][i]),
        ...botIndices.map((i) => s.hands[1][i]),
      ],
      phase: "peg",
    };
    if (s.starter.rank === "J")
      next = award(next, s.dealer, 2, {
        kind: "heels",
        player: s.dealer,
        points: 2,
      });
    return next;
  }
  if (s.phase === "count" && action.type === "count") {
    const seats = [1 - s.dealer, s.dealer, s.dealer];
    const owner = seats[s.countIndex];
    const result = cribbageHand(
      s.countIndex === 2 ? s.crib : s.original[owner],
      s.starter,
      s.countIndex === 2,
    );
    const next = award(s, owner, result.total, {
      kind: s.countIndex === 2 ? "crib" : "hand",
      player: owner,
      ...result,
    });
    return {
      ...next,
      countIndex: s.countIndex + 1,
      phase:
        next.winner !== null ? "won" : s.countIndex === 2 ? "round" : "count",
    };
  }
  if (s.phase !== "peg" || s.turn !== player) return null;
  const total = s.sequence.reduce((n, c) => n + pipValue(c), 0);
  const canPlay = (p) => s.hands[p].some((c) => pipValue(c) + total <= 31);
  if (action.type === "go") {
    if (canPlay(player)) return null;
    if (!canPlay(1 - player)) {
      let next =
        s.last === null
          ? s
          : award(s, s.last, 1, { kind: "go", player: s.last, points: 1 });
      next = endPegging(next);
      if (next.phase !== "peg" || next.winner !== null) return next;
      return {
        ...next,
        sequence: [],
        passed: [false, false],
        turn: s.last === null ? 1 - player : 1 - s.last,
        last: null,
      };
    }
    return {
      ...s,
      passed: s.passed.map((v, i) => (i === player ? true : v)),
      turn: 1 - player,
    };
  }
  if (
    action.type !== "play" ||
    !Number.isInteger(action.index) ||
    !s.hands[player][action.index]
  )
    return null;
  const card = s.hands[player][action.index];
  if (pipValue(card) + total > 31) return null;
  const sequence = [...s.sequence, card];
  const points = peggingPoints(sequence);
  let next = {
    ...s,
    hands: s.hands.map((h, i) =>
      i === player ? h.filter((_, j) => j !== action.index) : h,
    ),
    sequence,
    last: player,
    turn: s.passed[1 - player] ? player : 1 - player,
  };
  if (points)
    next = award(next, player, points, { kind: "peg", player, points });
  if (next.winner !== null) return { ...next, phase: "won" };
  next = endPegging(next);
  if (next.phase !== "peg") return next;
  if (total + pipValue(card) === 31)
    return {
      ...next,
      sequence: [],
      last: null,
      passed: [false, false],
      turn: 1 - player,
    };
  return next;
}
