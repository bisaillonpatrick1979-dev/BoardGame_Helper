// Pure rules shared by local games, multiplayer and tests.
export const YAMS_CATEGORIES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "brelan",
  "carre",
  "full",
  "petite",
  "grande",
  "yams",
  "chance",
];
export function yamsScore(id, dice) {
  const counts = [1, 2, 3, 4, 5, 6].map(
    (n) => dice.filter((v) => v === n).length,
  );
  const sum = dice.reduce((a, b) => a + b, 0);
  if (/^[1-6]$/.test(id)) return counts[Number(id) - 1] * Number(id);
  if (id === "brelan") return Math.max(...counts) >= 3 ? sum : 0;
  if (id === "carre") return Math.max(...counts) >= 4 ? sum : 0;
  if (id === "full") return counts.includes(3) && counts.includes(2) ? 25 : 0;
  if (id === "petite" || id === "grande") {
    const n = id === "petite" ? 4 : 5;
    for (let start = 1; start <= 7 - n; start++)
      if (
        Array.from({ length: n }, (_, i) => start + i).every((v) =>
          dice.includes(v),
        )
      )
        return n === 4 ? 30 : 40;
    return 0;
  }
  return id === "yams"
    ? Math.max(...counts) === 5
      ? 50
      : 0
    : id === "chance"
      ? sum
      : 0;
}
export function yamsTotal(sheet) {
  const upper = [1, 2, 3, 4, 5, 6].reduce((s, n) => s + (sheet[n] || 0), 0);
  return (
    Object.values(sheet).reduce((s, n) => s + n, 0) + (upper >= 63 ? 35 : 0)
  );
}
export function farkleScore(dice) {
  if (!dice.length) return 0;
  const c = [1, 2, 3, 4, 5, 6].map((n) => dice.filter((v) => v === n).length);
  if (dice.length === 6 && c.every((n) => n === 1)) return 1500;
  if (dice.length === 6 && c.filter((n) => n === 2).length === 3) return 1500;
  let score = 0;
  for (let i = 0; i < 6; i++) {
    let n = c[i];
    if (n >= 3) {
      score += (i === 0 ? 1000 : (i + 1) * 100) * 2 ** (n - 3);
      n = 0;
    }
    if (n && i !== 0 && i !== 4) return 0;
    score += n * (i === 0 ? 100 : 50);
  }
  return score;
}
export function hasFarkleScore(dice) {
  for (let mask = 1; mask < 1 << dice.length; mask++)
    if (farkleScore(dice.filter((_, i) => mask & (1 << i)))) return true;
  return false;
}
export function sudokuConflict(board, cell, n) {
  if (!n) return false;
  const r = Math.floor(cell / 9),
    c = cell % 9;
  return board.some(
    (v, i) =>
      i !== cell &&
      v === n &&
      (Math.floor(i / 9) === r ||
        i % 9 === c ||
        (Math.floor(i / 27) === Math.floor(r / 3) &&
          Math.floor((i % 9) / 3) === Math.floor(c / 3))),
  );
}
export function sudokuSolutions(puzzle, limit = 2) {
  const b = [...puzzle];
  let count = 0;
  function solve() {
    let at = -1,
      choices = null;
    for (let i = 0; i < 81; i++)
      if (!b[i]) {
        const opts = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
          (n) => !sudokuConflict(b, i, n),
        );
        if (!opts.length) return;
        if (!choices || opts.length < choices.length) {
          at = i;
          choices = opts;
        }
      }
    if (at === -1) {
      count++;
      return;
    }
    for (const n of choices) {
      b[at] = n;
      solve();
      if (count >= limit) break;
    }
    b[at] = 0;
  }
  solve();
  return count;
}
export function makeSudoku(random = Math.random, holes = 38) {
  const shuffle = (a) => [...a]; // Fisher–Yates below, no sort-based randomness.
  const mix = (a) => {
    const b = shuffle(a);
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const order = () =>
    mix([0, 1, 2]).flatMap((g) => mix([0, 1, 2]).map((i) => g * 3 + i));
  const rows = order(),
    cols = order(),
    digits = mix([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const solution = rows.flatMap((r) =>
    cols.map((c) => digits[(r * 3 + Math.floor(r / 3) + c) % 9]),
  );
  const puzzle = [...solution];
  let removed = 0;
  for (const i of mix(Array.from({ length: 81 }, (_, i) => i))) {
    const v = puzzle[i];
    puzzle[i] = 0;
    if (sudokuSolutions(puzzle) !== 1) puzzle[i] = v;
    else removed++;
    if (removed >= holes) break;
  }
  return { solution, puzzle, entries: [...puzzle], hints: 0, won: false };
}
export const rankValue = (c) =>
  ({ A: 1, J: 11, Q: 12, K: 13 })[c.rank] || Number(c.rank);
export const pipValue = (c) => Math.min(10, rankValue(c));
export function cribbageHand(hand, starter, crib = false) {
  const cards = [...hand, starter];
  let fifteens = 0,
    pairs = 0,
    runs = 0,
    flush = 0,
    nobs = 0;
  for (let mask = 1; mask < 32; mask++) {
    const selected = cards.filter((_, i) => mask & (1 << i));
    if (selected.reduce((s, c) => s + pipValue(c), 0) === 15) fifteens += 2;
  }
  for (let i = 0; i < 5; i++)
    for (let j = i + 1; j < 5; j++)
      if (cards[i].rank === cards[j].rank) pairs += 2;
  for (let size = 5; size >= 3; size--) {
    for (let mask = 1; mask < 32; mask++) {
      const values = cards
        .filter((_, i) => mask & (1 << i))
        .map(rankValue)
        .sort((a, b) => a - b);
      if (
        values.length === size &&
        values.every((v, i) => !i || v === values[i - 1] + 1)
      )
        runs += size;
    }
    if (runs) break;
  }
  if (hand.every((c) => c.suit === hand[0].suit))
    flush = starter.suit === hand[0].suit ? 5 : crib ? 0 : 4;
  nobs = hand.some((c) => c.rank === "J" && c.suit === starter.suit) ? 1 : 0;
  return {
    fifteens,
    pairs,
    runs,
    flush,
    nobs,
    total: fifteens + pairs + runs + flush + nobs,
  };
}
export function peggingPoints(sequence) {
  const total = sequence.reduce((s, c) => s + pipValue(c), 0);
  let points = total === 15 || total === 31 ? 2 : 0;
  let same = 1;
  for (
    let i = sequence.length - 2;
    i >= 0 && sequence[i].rank === sequence.at(-1).rank;
    i--
  )
    same++;
  points += same === 2 ? 2 : same === 3 ? 6 : same >= 4 ? 12 : 0;
  for (let n = sequence.length; n >= 3; n--) {
    const v = sequence
      .slice(-n)
      .map(rankValue)
      .sort((a, b) => a - b);
    if (v.every((x, i) => !i || x === v[i - 1] + 1)) {
      points += n;
      break;
    }
  }
  return points;
}
export function checkersMoves(
  board,
  player,
  from = null,
  capturesOnly = false,
) {
  const moves = [];
  board.forEach((piece, i) => {
    if (Math.sign(piece) !== player || (from !== null && from !== i)) return;
    const r = Math.floor(i / 8),
      c = i % 8;
    const dirs = Math.abs(piece) === 2 ? [-1, 1] : [player === 1 ? -1 : 1];
    for (const dr of dirs)
      for (const dc of [-1, 1]) {
        const rr = r + dr,
          cc = c + dc;
        if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        const to = rr * 8 + cc;
        if (!board[to] && !capturesOnly)
          moves.push({ from: i, to, capture: null });
        const jr = r + dr * 2,
          jc = c + dc * 2;
        if (
          Math.sign(board[to]) === -player &&
          jr >= 0 &&
          jr < 8 &&
          jc >= 0 &&
          jc < 8 &&
          !board[jr * 8 + jc]
        )
          moves.push({ from: i, to: jr * 8 + jc, capture: to });
      }
  });
  const jumps = moves.filter((m) => m.capture !== null);
  return jumps.length ? jumps : moves;
}
export function initialCheckers() {
  return Array.from({ length: 64 }, (_, i) =>
    (Math.floor(i / 8) + (i % 8)) % 2 ? (i < 24 ? -1 : i >= 40 ? 1 : 0) : 0,
  );
}
