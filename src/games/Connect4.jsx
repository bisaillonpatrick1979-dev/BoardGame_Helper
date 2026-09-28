// Puissance 4 : jetons qui tombent, à deux ou contre l'ordinateur
import { useEffect, useState } from "react";
import { Cpu, RotateCcw, Users } from "lucide-react";
import { sfx, useLang, vibrate, recordGame } from "../lib/core.js";

const COLS = 7;
const ROWS = 6;
const empty = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

function dropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r -= 1) if (!board[r][col]) return r;
  return -1;
}

// Cherche 4 jetons alignés ; renvoie les cases gagnantes
function findWin(board) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const p = board[r][c];
      if (!p) continue;
      for (const [dr, dc] of dirs) {
        const cells = [[r, c]];
        for (let k = 1; k < 4; k += 1) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== p) break;
          cells.push([rr, cc]);
        }
        if (cells.length === 4) return { player: p, cells };
      }
    }
  }
  return null;
}

// Évaluation d'une position pour l'ordinateur (joueur 2)
function scoreWindow(w) {
  const mine = w.filter((x) => x === 2).length;
  const theirs = w.filter((x) => x === 1).length;
  const blanks = w.filter((x) => x === 0).length;
  if (mine === 4) return 1000;
  if (mine === 3 && blanks === 1) return 6;
  if (mine === 2 && blanks === 2) return 2;
  if (theirs === 3 && blanks === 1) return -8;
  return 0;
}

function evaluate(board) {
  let score = 0;
  for (let r = 0; r < ROWS; r += 1) if (board[r][3] === 2) score += 3;
  for (let r = 0; r < ROWS; r += 1)
    for (let c = 0; c < COLS; c += 1) {
      if (c + 3 < COLS) score += scoreWindow([0, 1, 2, 3].map((k) => board[r][c + k]));
      if (r + 3 < ROWS) score += scoreWindow([0, 1, 2, 3].map((k) => board[r + k][c]));
      if (r + 3 < ROWS && c + 3 < COLS) score += scoreWindow([0, 1, 2, 3].map((k) => board[r + k][c + k]));
      if (r + 3 < ROWS && c - 3 >= 0) score += scoreWindow([0, 1, 2, 3].map((k) => board[r + k][c - k]));
    }
  return score;
}

function minimax(board, depth, alpha, beta, maximizing) {
  const win = findWin(board);
  if (win) return { score: win.player === 2 ? 100000 + depth : -100000 - depth };
  const cols = [3, 2, 4, 1, 5, 0, 6].filter((c) => dropRow(board, c) >= 0);
  if (depth === 0 || cols.length === 0) return { score: evaluate(board) };
  let best = { score: maximizing ? -Infinity : Infinity, col: cols[0] };
  for (const col of cols) {
    const r = dropRow(board, col);
    board[r][col] = maximizing ? 2 : 1;
    const { score } = minimax(board, depth - 1, alpha, beta, !maximizing);
    board[r][col] = 0;
    if (maximizing ? score > best.score : score < best.score) best = { score, col };
    if (maximizing) alpha = Math.max(alpha, score);
    else beta = Math.min(beta, score);
    if (alpha >= beta) break;
  }
  return best;
}

export default function Connect4() {
  const { t } = useLang();
  const [vsCpu, setVsCpu] = useState(true);
  const [board, setBoard] = useState(empty);
  const [turn, setTurn] = useState(1);
  const [last, setLast] = useState(null);
  const [score, setScore] = useState({ 1: 0, 2: 0 });
  const win = findWin(board);
  const full = board[0].every(Boolean);
  const over = Boolean(win) || full;

  function drop(col, player = turn) {
    if (over) return;
    const r = dropRow(board, col);
    if (r < 0) return;
    const next = board.map((row) => [...row]);
    next[r][col] = player;
    setBoard(next);
    setLast(`${r}-${col}`);
    setTurn(player === 1 ? 2 : 1);
    setTimeout(sfx.drop, 280);
    const w = findWin(next);
    if (w) {
      setScore((s) => ({ ...s, [w.player]: s[w.player] + 1 }));
      recordGame("connect4", !vsCpu ? "played" : w.player === 1 ? "win" : "loss");
      setTimeout(() => (vsCpu && w.player === 2 ? sfx.lose() : sfx.win()), 400);
      vibrate([40, 40, 100]);
    }
  }

  useEffect(() => {
    if (!vsCpu || turn !== 2 || over) return;
    const timer = setTimeout(() => {
      const copy = board.map((row) => [...row]);
      const { col } = minimax(copy, 5, -Infinity, Infinity, true);
      drop(col, 2);
    }, 550);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, vsCpu, over]);

  function reset() {
    setBoard(empty());
    setTurn(1);
    setLast(null);
  }

  const names = vsCpu ? { 1: t("Toi", "You"), 2: t("Ordi", "CPU") } : { 1: t("Rouge", "Red"), 2: t("Jaune", "Yellow") };
  const status = win
    ? `${names[win.player]} ${vsCpu && win.player === 1 ? t("gagnes! 🎉", "win! 🎉") : t("gagne!", "wins!")}`
    : full
      ? t("Match nul!", "Draw!")
      : vsCpu && turn === 2
        ? t("L'ordi réfléchit…", "Computer thinking…")
        : `${t("Tour de", "Turn:")} ${names[turn]}`;

  const winCells = new Set((win?.cells || []).map(([r, c]) => `${r}-${c}`));

  return (
    <div className="game c4">
      <div className="gameBar">
        <div className="segmented small">
          <button className={vsCpu ? "active" : ""} onClick={() => { setVsCpu(true); reset(); setScore({ 1: 0, 2: 0 }); }}>
            <Cpu size={15} /> {t("Vs ordi", "Vs CPU")}
          </button>
          <button className={!vsCpu ? "active" : ""} onClick={() => { setVsCpu(false); reset(); setScore({ 1: 0, 2: 0 }); }}>
            <Users size={15} /> {t("2 joueurs", "2 players")}
          </button>
        </div>
      </div>

      <div className="scoreStrip">
        <span className="p1">● {names[1]} · {score[1]}</span>
        <span className="p2">● {names[2]} · {score[2]}</span>
      </div>

      <div className="boardWrap">
      <div className="c4Board">
        {Array.from({ length: COLS }).map((_, c) => (
          <button key={c} className="c4Col" onClick={() => !(vsCpu && turn === 2) && drop(c)} aria-label={`${t("Colonne", "Column")} ${c + 1}`}>
            {Array.from({ length: ROWS }).map((__, r) => {
              const v = board[r][c];
              const key = `${r}-${c}`;
              return (
                <span key={r} className="c4Hole">
                  {v > 0 && (
                    <i
                      className={`disc p${v} ${key === last ? "falling" : ""} ${winCells.has(key) ? "win" : ""}`}
                      style={{ "--fall": `${-(r + 1) * 100 - 20}%` }}
                    />
                  )}
                </span>
              );
            })}
          </button>
        ))}
      </div>
      </div>

      <div className={`gameStatus ${over ? "done" : ""} turn${turn}`}>{status}</div>
      <button className="bigAction" onClick={reset}>
        <RotateCcw size={20} />
        {t("Nouvelle partie", "New game")}
      </button>
    </div>
  );
}
