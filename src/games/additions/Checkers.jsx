import { useEffect, useState } from "react";
import { useLang, useStored, recordGame, randomInt } from "../../lib/core.js";
import { checkersMoves, initialCheckers } from "./rules.js";
import { GameFrame, playerNames } from "./shared.jsx";
const fresh = () => ({
  board: initialCheckers(),
  turn: 1,
  forced: null,
  winner: null,
});
export default function Checkers({ players }) {
  const { t } = useLang();
  const [g, setG] = useStored("bgh2_checkers", fresh);
  const [cpu, setCpu] = useStored("bgh2_checkers_cpu", true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const names = cpu
    ? [t("Toi", "You"), t("Ordinateur", "Computer")]
    : playerNames(players, 2, t);
  const moves = checkersMoves(g.board, g.turn, g.forced, g.forced !== null);
  function move(m) {
    const board = [...g.board];
    let piece = board[m.from];
    board[m.from] = 0;
    board[m.to] = piece;
    if (m.capture !== null) board[m.capture] = 0;
    const crowned =
      Math.abs(piece) === 1 &&
      ((piece > 0 && m.to < 8) || (piece < 0 && m.to >= 56));
    if (crowned) board[m.to] = piece * 2;
    const continuation =
      m.capture !== null && !crowned
        ? checkersMoves(board, g.turn, m.to, true)
        : [];
    const turn = continuation.length ? g.turn : -g.turn;
    const winner =
      !continuation.length && !checkersMoves(board, turn).length
        ? g.turn
        : null;
    if (winner)
      recordGame("checkers", cpu ? (winner === 1 ? "win" : "loss") : "played");
    setHistory((h) => [...h.slice(-29), g]);
    setG({ board, turn, forced: continuation.length ? m.to : null, winner });
    setSelected(continuation.length ? m.to : null);
  }
  useEffect(() => {
    if (!cpu || g.turn !== -1 || g.winner) return;
    const id = setTimeout(() => {
      const best = moves.filter((m) => m.capture !== null);
      const pool = best.length ? best : moves;
      if (pool.length) move(pool[randomInt(pool.length)]);
    }, 500);
    return () => clearTimeout(id);
  }, [g, cpu]);
  return (
    <GameFrame
      title={t("Dames", "Checkers")}
      onNew={() => {
        setG(fresh());
        setHistory([]);
        setSelected(null);
      }}
      rules={t(
        "Dames anglaises sur 8 × 8. Les pions avancent et capturent en diagonale vers l’avant. Les dames vont dans les deux sens, d’une case. Les prises sont obligatoires, avec prises multiples. Atteindre la dernière rangée termine le tour et crée une dame.",
        "English checkers on 8 × 8. Men move and capture diagonally forward; kings move one step in either direction. Captures and multiple jumps are mandatory. Crowning ends the turn.",
      )}
    >
      <button
        className="chipButton"
        aria-pressed={cpu}
        onClick={() => {
          if (
            window.confirm(
              t("Changer de mode et recommencer?", "Change mode and restart?"),
            )
          ) {
            setCpu(!cpu);
            setG(fresh());
            setHistory([]);
            setSelected(null);
          }
        }}
      >
        {cpu
          ? t("Contre ordinateur", "Against computer")
          : t("Deux joueurs", "Two players")}
      </button>
      <p role="status">
        {g.winner
          ? `${t("Gagnant", "Winner")}: ${names[g.winner === 1 ? 0 : 1]}`
          : `${t("Tour de", "Turn:")} ${names[g.turn === 1 ? 0 : 1]}`}
      </p>
      <div className="checkerBoard">
        {g.board.map((v, i) => (
          <button
            key={i}
            className={`${(Math.floor(i / 8) + (i % 8)) % 2 ? "darkSquare" : "lightSquare"} ${selected === i ? "selected" : ""} ${moves.some((m) => m.from === selected && m.to === i) ? "target" : ""}`}
            aria-label={`${i + 1}: ${v ? (v > 0 ? names[0] : names[1]) + " " + (Math.abs(v) === 2 ? t("dame", "king") : t("pion", "man")) : t("vide", "empty")}`}
            disabled={!!g.winner || (cpu && g.turn === -1)}
            onClick={() => {
              const m = moves.find((m) => m.from === selected && m.to === i);
              if (m) move(m);
              else if (moves.some((m) => m.from === i)) setSelected(i);
            }}
          >
            {v ? (
              <span className={`checkerPiece ${v > 0 ? "red" : "white"}`}>
                {Math.abs(v) === 2 ? "♛" : "●"}
              </span>
            ) : (
              ""
            )}
          </button>
        ))}
      </div>
      <button
        className="chipButton"
        disabled={!history.length || (cpu && g.turn === -1)}
        onClick={() => {
          let at = history.length - 1;
          if (cpu) while (at > 0 && history[at].turn !== 1) at--;
          setG(history[at]);
          setHistory(history.slice(0, at));
          setSelected(null);
        }}
      >
        {t("Annuler", "Undo")}
      </button>
    </GameFrame>
  );
}
