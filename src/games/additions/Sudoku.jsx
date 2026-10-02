import { useState } from "react";
import { useLang, useStored, recordGame } from "../../lib/core.js";
import { makeSudoku, sudokuConflict } from "./rules.js";
import { GameFrame } from "./shared.jsx";
function daySeed() {
  const key = new Date().toLocaleDateString("en-CA");
  let x = 0;
  for (const c of key) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
export default function Sudoku() {
  const { t } = useLang();
  const [game, setGame] = useStored("bgh2_sudoku", () => makeSudoku());
  const [cell, setCell] = useState(0);
  const [history, setHistory] = useState([]);
  const [level, setLevel] = useStored("bgh2_sudoku_level", 38);
  function change(n, hint = false) {
    if (game.puzzle[cell] || game.won) return;
    setHistory((h) => [...h.slice(-49), game]);
    const entries = game.entries.map((v, i) => (i === cell ? n : v));
    const won = entries.every((v, i) => v === game.solution[i]);
    if (won && !game.won) recordGame("sudoku", "win");
    setGame({ ...game, entries, hints: game.hints + (hint ? 1 : 0), won });
  }
  return (
    <GameFrame
      title="Sudoku"
      onNew={() => {
        setGame(makeSudoku(Math.random, level));
        setHistory([]);
      }}
      rules={t(
        "Chaque ligne, colonne et carré de 3 × 3 contient les chiffres de 1 à 9 une seule fois. Les cases données sont verrouillées. Les conflits sont signalés.",
        "Each row, column and 3 × 3 box contains 1 to 9 once. Given cells are locked; conflicts are marked.",
      )}
    >
      <div className="actionRow">
        <label>
          {t("Niveau", "Level")}{" "}
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          >
            <option value={30}>{t("Facile", "Easy")}</option>
            <option value={38}>{t("Moyen", "Medium")}</option>
            <option value={46}>{t("Difficile", "Hard")}</option>
          </select>
        </label>
        <button
          className="chipButton"
          onClick={() => {
            if (
              window.confirm(
                t("Ouvrir le défi du jour?", "Open today’s challenge?"),
              )
            ) {
              setGame(makeSudoku(daySeed(), 38));
              setHistory([]);
            }
          }}
        >
          {t("Défi du jour", "Daily challenge")}
        </button>
      </div>
      <div className="sudokuBoard" role="group" aria-label="Sudoku">
        {game.entries.map((v, i) => (
          <button
            key={i}
            style={{
              borderRightWidth: i % 9 === 2 || i % 9 === 5 ? 3 : 1,
              borderBottomWidth:
                Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5 ? 3 : 1,
            }}
            className={`${i === cell ? "selected" : ""} ${game.puzzle[i] ? "given" : ""} ${sudokuConflict(game.entries, i, v) ? "conflict" : ""}`}
            aria-label={`${t("Ligne", "Row")} ${Math.floor(i / 9) + 1}, ${t("colonne", "column")} ${(i % 9) + 1}: ${v || t("vide", "empty")}`}
            aria-pressed={i === cell}
            onClick={() => setCell(i)}
          >
            {v || ""}
          </button>
        ))}
      </div>
      <div className="numberPad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            disabled={!!game.puzzle[cell] || game.won}
            onClick={() => change(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="actionRow">
        <button
          className="chipButton"
          onClick={() => change(0)}
          disabled={!!game.puzzle[cell] || game.won}
        >
          {t("Effacer", "Erase")}
        </button>
        <button
          className="chipButton"
          disabled={!history.length}
          onClick={() => {
            setGame(history.at(-1));
            setHistory((h) => h.slice(0, -1));
          }}
        >
          {t("Annuler", "Undo")}
        </button>
        <button
          className="chipButton"
          disabled={!!game.puzzle[cell] || game.won}
          onClick={() => change(game.solution[cell], true)}
        >
          {t("Indice", "Hint")}
        </button>
      </div>
      <p role="status">
        {game.won
          ? t("Bravo! Grille terminée.", "Well done! Puzzle complete.")
          : `${game.hints} ${t("indices utilisés", "hints used")}`}
      </p>
    </GameFrame>
  );
}
