// Tic-tac-toe (morpion) : à deux ou contre l'ordinateur
import { useEffect, useState } from "react";
import { Cpu, RotateCcw, Users } from "lucide-react";
import { randomInt, sfx, useLang, vibrate, recordGame } from "../lib/core.js";
import { seatName } from "../screens/PlayersSheet.jsx";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function winnerOf(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { player: board[a], line };
  }
  return board.every(Boolean) ? { player: "draw", line: [] } : null;
}

// Minimax : l'ordinateur joue parfaitement en mode difficile
function minimax(board, player) {
  const result = winnerOf(board);
  if (result) return { score: result.player === "O" ? 10 : result.player === "X" ? -10 : 0 };
  const moves = [];
  board.forEach((cell, i) => {
    if (cell) return;
    const next = [...board];
    next[i] = player;
    moves.push({ index: i, score: minimax(next, player === "O" ? "X" : "O").score });
  });
  return moves.reduce((best, m) => (player === "O" ? (m.score > best.score ? m : best) : m.score < best.score ? m : best));
}

function Mark({ value }) {
  if (value === "X")
    return (
      <svg viewBox="0 0 100 100" className="mark markX">
        <path d="M22 22 L78 78" pathLength="1" />
        <path d="M78 22 L22 78" pathLength="1" />
      </svg>
    );
  if (value === "O")
    return (
      <svg viewBox="0 0 100 100" className="mark markO">
        <circle cx="50" cy="50" r="30" pathLength="1" />
      </svg>
    );
  return null;
}

export default function TicTacToe({ players }) {
  const { t } = useLang();
  const [vsCpu, setVsCpu] = useState(true);
  const [hard, setHard] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X");
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  const result = winnerOf(board);
  // Noms : en mode 2 joueurs, les deux premiers joueurs à la table
  const nameOf = (mark) => (vsCpu ? (mark === "X" ? t("Toi", "You") : t("Ordi", "CPU")) : seatName(players, mark === "X" ? 0 : 1, t));

  function play(i) {
    if (board[i] || result) return;
    if (vsCpu && turn === "O") return;
    move(i, turn);
  }

  function move(i, player) {
    const next = [...board];
    next[i] = player;
    setBoard(next);
    setTurn(player === "X" ? "O" : "X");
    const r = winnerOf(next);
    if (r) {
      setScore((s) => ({ ...s, [r.player]: s[r.player] + 1 }));
      recordGame("tictactoe", r.player === "draw" ? "draw" : !vsCpu ? "played" : r.player === "X" ? "win" : "loss");
      if (r.player === "draw") sfx.bad();
      else if (vsCpu && r.player === "O") sfx.lose();
      else sfx.win();
      vibrate(r.player === "draw" ? 40 : [40, 40, 80]);
    } else sfx.tap();
  }

  // Tour de l'ordinateur
  useEffect(() => {
    if (!vsCpu || turn !== "O" || result) return;
    const timer = setTimeout(() => {
      const empty = board.map((c, i) => (c ? null : i)).filter((i) => i !== null);
      // Facile : parfois un coup au hasard
      const i = hard || Math.random() > 0.45 ? minimax(board, "O").index : empty[randomInt(empty.length)];
      move(i, "O");
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, vsCpu, board]);

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
  }

  const status = result
    ? result.player === "draw"
      ? t("Match nul!", "It's a draw!")
      : vsCpu
        ? result.player === "X"
          ? t("Tu gagnes! 🎉", "You win! 🎉")
          : t("L'ordi gagne!", "Computer wins!")
        : `${nameOf(result.player)} (${result.player}) ${t("gagne! 🎉", "wins! 🎉")}`
    : vsCpu
      ? turn === "X"
        ? t("À toi de jouer (X)", "Your turn (X)")
        : t("L'ordi réfléchit…", "Computer thinking…")
      : `${t("Tour de", "Turn:")} ${nameOf(turn)} (${turn})`;

  return (
    <div className="game ttt">
      <div className="gameBar">
        <div className="segmented small">
          <button className={vsCpu ? "active" : ""} onClick={() => { setVsCpu(true); reset(); setScore({ X: 0, O: 0, draw: 0 }); }}>
            <Cpu size={15} /> {t("Vs ordi", "Vs CPU")}
          </button>
          <button className={!vsCpu ? "active" : ""} onClick={() => { setVsCpu(false); reset(); setScore({ X: 0, O: 0, draw: 0 }); }}>
            <Users size={15} /> {t("2 joueurs", "2 players")}
          </button>
        </div>
        {vsCpu && (
          <button className={`chipButton ${hard ? "accent" : ""}`} onClick={() => setHard(!hard)}>
            {hard ? t("Imbattable", "Unbeatable") : t("Facile", "Easy")}
          </button>
        )}
      </div>

      <div className="scoreStrip">
        <span className="sx">{nameOf("X")} (X) · {score.X}</span>
        <span>{t("Nuls", "Draws")} · {score.draw}</span>
        <span className="so">{nameOf("O")} (O) · {score.O}</span>
      </div>

      <div className="boardWrap">
      <div className="tttBoard">
        {board.map((cell, i) => (
          <button key={i} className={`tttCell ${result?.line.includes(i) ? "win" : ""}`} onClick={() => play(i)} aria-label={`${i + 1}`}>
            <Mark value={cell} />
          </button>
        ))}
      </div>
      </div>

      <div className={`gameStatus ${result ? "done" : ""}`}>{status}</div>
      <button className="bigAction" onClick={reset}>
        <RotateCcw size={20} />
        {t("Nouvelle partie", "New game")}
      </button>
    </div>
  );
}
