// Puissance 4 à deux téléphones (les autres regardent la partie)
const ROWS = 6;
const COLS = 7;

function winner(board) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const v = board[r][c];
      if (!v) continue;
      for (const [dr, dc] of dirs) {
        const line = [[r, c]];
        for (let k = 1; k < 4; k += 1) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== v) break;
          line.push([rr, cc]);
        }
        if (line.length === 4) return { player: v, line };
      }
    }
  }
  return board.every((row) => row.every(Boolean)) ? { player: 0, line: [] } : null;
}

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export default {
  id: "connect4",
  emoji: "🔴",
  name: { fr: "Puissance 4", en: "Connect 4" },
  desc: { fr: "À deux téléphones, les autres regardent", en: "Two phones, the others watch" },
  min: 2,
  max: 2,
  defaultOpts: {},

  setup({ seats }) {
    return { board: emptyBoard(), seats: seats.slice(0, 2), turn: 1, result: null, score: [0, 0, 0], starter: 1, last: null };
  },

  apply(prev, pid, action) {
    const seat = prev.seats.indexOf(pid) + 1; // 1 ou 2
    if (!seat) return null;
    if (action?.type === "rematch") {
      if (!prev.result) return null;
      const starter = prev.starter === 1 ? 2 : 1;
      return { ...prev, board: emptyBoard(), turn: starter, starter, result: null, last: null };
    }
    if (action?.type !== "drop" || prev.result || prev.turn !== seat) return null;
    const col = Math.floor(Number(action.col));
    if (!(col >= 0 && col < COLS)) return null;
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r -= 1) {
      if (!prev.board[r][col]) {
        row = r;
        break;
      }
    }
    if (row < 0) return null;
    const board = prev.board.map((line) => [...line]);
    board[row][col] = seat;
    const result = winner(board);
    const score = [...prev.score];
    if (result) score[result.player] += 1;
    return { ...prev, board, turn: seat === 1 ? 2 : 1, result, score, last: [row, col] };
  },

  view(gs, pid, { names }) {
    return { ...gs, mySeat: gs.seats.indexOf(pid) + 1, seatNames: gs.seats.map((id) => names[id] || "?") };
  }
};
