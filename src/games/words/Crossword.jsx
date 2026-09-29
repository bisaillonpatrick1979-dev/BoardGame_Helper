// Mots croisés : grilles générées automatiquement, clavier à l'écran, sauvegarde de la partie
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Delete, Eye, List, RotateCcw, Sparkles, X } from "lucide-react";
import { recordGame, sfx, useLang, useStored, vibrate } from "../../lib/core.js";
import { Confetti } from "../Hangman.jsx";
import { CROSSWORD_BANK } from "./crosswordBank.js";
import { generateCrossword, wordCells } from "./engine.js";
import "./words.css";

const STORE_KEY = "bgh2_crossword";
const LEVELS = ["easy", "medium", "hard"];

// Rangées du clavier à l'écran (AZERTY en français, QWERTY en anglais)
const KEYBOARDS = {
  fr: ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"],
  en: ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]
};

// Crée une nouvelle partie (grille vide, sélection sur le premier mot)
function newGame(lang, level) {
  const puzzle = generateCrossword(CROSSWORD_BANK[lang] || CROSSWORD_BANK.fr, level);
  const first = puzzle.words[0];
  return {
    lang,
    level,
    puzzle,
    entries: Array(puzzle.size * puzzle.size).fill(""),
    revealed: [],
    wrong: [],
    won: false,
    sel: { cell: first.row * puzzle.size + first.col, dir: first.dir }
  };
}

// Garde-fou : une sauvegarde abîmée ou d'une autre version est ignorée
function isValidGame(game) {
  return Boolean(
    game && game.puzzle && Array.isArray(game.puzzle.words) && game.puzzle.words.length &&
    Array.isArray(game.entries) && game.entries.length === game.puzzle.size * game.puzzle.size && game.sel
  );
}

export default function Crossword() {
  const { t, lang } = useLang();
  const [game, setGame] = useStored(STORE_KEY, null);
  const [showList, setShowList] = useState(false);
  const [message, setMessage] = useState(null); // { text, kind: "good" | "bad" }
  const [confirmNew, setConfirmNew] = useState(false);
  const boardRef = useRef(null);
  const [side, setSide] = useState(300);

  // Première visite, sauvegarde invalide ou changement de langue : nouvelle grille
  const ready = isValidGame(game) && game.lang === lang;
  useEffect(() => {
    if (!ready) setGame(newGame(lang, isValidGame(game) ? game.level : "easy"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lang]);

  // La grille prend le plus grand carré possible dans l'espace libre
  useEffect(() => {
    const el = boardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSide(Math.max(160, Math.floor(Math.min(width, height))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  // Message temporaire (vérification, etc.)
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(() => setMessage(null), 2600);
    return () => clearTimeout(id);
  }, [message]);

  useEffect(() => {
    if (!confirmNew) return undefined;
    const id = setTimeout(() => setConfirmNew(false), 3000);
    return () => clearTimeout(id);
  }, [confirmNew]);

  const puzzle = ready ? game.puzzle : null;
  const size = puzzle ? puzzle.size : 0;

  // Pour chaque case : l'identifiant du mot horizontal (A) et vertical (D) qui la traversent
  const cellInfo = useMemo(() => {
    if (!puzzle) return [];
    const info = Array.from({ length: size * size }, () => ({ A: null, D: null, num: null }));
    for (const w of puzzle.words) {
      wordCells(w, size).forEach((cell, i) => {
        info[cell][w.dir] = w.id;
        if (i === 0) info[cell].num = w.num;
      });
    }
    return info;
  }, [puzzle, size]);

  const cellsOf = useMemo(() => (puzzle ? puzzle.words.map((w) => wordCells(w, size)) : []), [puzzle, size]);

  // Clavier physique : branché avant tout retour anticipé (règle des hooks)
  const keyHandler = useRef(null);
  useKeys((e) => keyHandler.current?.(e));

  if (!ready) return <div className="game xw" />;

  const { entries, sel, won } = game;
  const solutionAt = (cell) => puzzle.solution[Math.floor(cell / size)][cell % size];
  const currentId = cellInfo[sel.cell]?.[sel.dir] ?? cellInfo[sel.cell]?.A ?? cellInfo[sel.cell]?.D ?? 0;
  const current = puzzle.words[currentId];
  const currentCells = cellsOf[currentId] || [];
  const revealedSet = new Set(game.revealed);
  const wrongSet = new Set(game.wrong);
  const isFilled = (id) => cellsOf[id].every((c) => entries[c]);

  // Applique une modification et vérifie la victoire
  function update(changes) {
    const next = { ...game, ...changes };
    if (!game.won && next.entries.every((v, i) => solutionAt(i) === "." || v === solutionAt(i))) {
      next.won = true;
      sfx.win();
      vibrate([40, 40, 80]);
      recordGame("crossword", "win");
    }
    setGame(next);
  }

  function selectWord(id, cell) {
    const w = puzzle.words[id];
    const cells = cellsOf[id];
    const start = cell ?? cells.find((c) => !entries[c]) ?? cells[0];
    update({ sel: { cell: start, dir: w.dir } });
  }

  // Toucher une case : la sélectionne ; toucher encore : change de direction
  function tapCell(cell) {
    if (solutionAt(cell) === ".") return;
    sfx.tap();
    const info = cellInfo[cell];
    if (cell === sel.cell) {
      const other = sel.dir === "A" ? "D" : "A";
      if (info[other] !== null) update({ sel: { cell, dir: other } });
      return;
    }
    const dir = info[sel.dir] !== null ? sel.dir : sel.dir === "A" ? "D" : "A";
    update({ sel: { cell, dir } });
  }

  // Mot suivant/précédent dans l'ordre de la liste
  function stepWord(delta) {
    const n = puzzle.words.length;
    let id = currentId;
    for (let k = 0; k < n; k += 1) {
      id = (id + delta + n) % n;
      if (delta < 0 || !isFilled(id) || k === n - 1) break;
    }
    sfx.tap();
    selectWord(id);
  }

  function typeLetter(letter) {
    if (won) return;
    const next = [...entries];
    const pos = currentCells.indexOf(sel.cell);
    if (!revealedSet.has(sel.cell)) next[sel.cell] = letter;
    sfx.tap();
    // Case suivante : la prochaine case vide du mot, sinon la case d'à côté
    const after = currentCells.slice(pos + 1);
    let target = after.find((c) => !next[c]);
    if (target === undefined && currentCells.every((c) => next[c])) {
      // Mot complet : on saute au prochain mot inachevé
      const n = puzzle.words.length;
      for (let k = 1; k <= n; k += 1) {
        const id = (currentId + k) % n;
        const empty = cellsOf[id].find((c) => !next[c]);
        if (empty !== undefined) {
          update({ entries: next, wrong: game.wrong.filter((c) => c !== sel.cell), sel: { cell: empty, dir: puzzle.words[id].dir } });
          return;
        }
      }
      target = sel.cell;
    }
    if (target === undefined) target = after[0] ?? sel.cell;
    update({ entries: next, wrong: game.wrong.filter((c) => c !== sel.cell), sel: { ...sel, cell: target } });
  }

  function backspace() {
    if (won) return;
    sfx.tap();
    const next = [...entries];
    const pos = currentCells.indexOf(sel.cell);
    if (next[sel.cell] && !revealedSet.has(sel.cell)) {
      next[sel.cell] = "";
      update({ entries: next, wrong: game.wrong.filter((c) => c !== sel.cell) });
      return;
    }
    const prev = currentCells[pos - 1];
    if (prev === undefined) return;
    if (!revealedSet.has(prev)) next[prev] = "";
    update({ entries: next, wrong: game.wrong.filter((c) => c !== prev), sel: { ...sel, cell: prev } });
  }

  // Vérifier : les lettres fausses deviennent rouges
  function check() {
    const wrong = entries.map((v, i) => (v && v !== solutionAt(i) ? i : -1)).filter((i) => i >= 0);
    const empty = entries.filter((v, i) => !v && solutionAt(i) !== ".").length;
    update({ wrong });
    if (wrong.length) {
      sfx.bad();
      vibrate(40);
      setMessage({ kind: "bad", text: t(`${wrong.length} lettre${wrong.length > 1 ? "s" : ""} à corriger`, `${wrong.length} wrong letter${wrong.length > 1 ? "s" : ""}`) });
    } else {
      sfx.good();
      setMessage({ kind: "good", text: empty ? t(`Aucune erreur! Encore ${empty} case${empty > 1 ? "s" : ""}`, `No mistakes! ${empty} cell${empty > 1 ? "s" : ""} to go`) : t("Tout est bon!", "All correct!") });
    }
  }

  function reveal(cells) {
    const next = [...entries];
    const revealed = new Set(game.revealed);
    for (const c of cells) {
      if (next[c] !== solutionAt(c)) revealed.add(c);
      next[c] = solutionAt(c);
    }
    sfx.flip();
    update({ entries: next, revealed: [...revealed], wrong: game.wrong.filter((c) => !cells.includes(c)) });
  }

  // Nouvelle grille ; si une partie est entamée, un premier toucher demande confirmation
  function startNew(level = game.level) {
    const busy = !won && entries.some(Boolean);
    if (busy && confirmNew !== level) {
      setConfirmNew(level);
      return;
    }
    setConfirmNew(false);
    setShowList(false);
    setMessage(null);
    sfx.deal();
    setGame(newGame(lang, level));
  }

  // Clavier physique (tablette avec clavier, ordinateur)
  keyHandler.current = (e) => {
    if (showList) return;
    const k = e.key.toUpperCase();
    if (/^[A-Z]$/.test(k)) typeLetter(k);
    else if (e.key === "Backspace") backspace();
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); stepWord(e.shiftKey ? -1 : 1); }
    else if (e.key === " ") { e.preventDefault(); tapCell(sel.cell); }
  };

  const levelLabel = { easy: t("Facile", "Easy"), medium: t("Moyen", "Medium"), hard: t("Difficile", "Hard") };
  const dirLabel = (dir) => (dir === "A" ? t("Horizontal", "Across") : t("Vertical", "Down"));
  const cellPx = side / size;

  return (
    <div className="game xw">
      <div className="gameBar">
        <div className="segmented small">
          {LEVELS.map((lv) => (
            <button key={lv} className={game.level === lv ? "active" : ""} onClick={() => lv !== game.level && startNew(lv)}>
              {confirmNew === lv && lv !== game.level ? t("Sûr?", "Sure?") : levelLabel[lv]}
            </button>
          ))}
        </div>
        <button className={`chipButton ${confirmNew === game.level ? "accent" : ""}`} onClick={() => startNew()}>
          <RotateCcw size={15} /> {confirmNew === game.level ? t("Sûr?", "Sure?") : t("Nouvelle", "New")}
        </button>
      </div>

      <div className="xw-board" ref={boardRef}>
        <div
          className="xw-grid"
          style={{ width: side, height: side, gridTemplateColumns: `repeat(${size}, 1fr)`, "--cell": `${cellPx}px` }}
        >
          {entries.map((value, cell) => {
            const sol = solutionAt(cell);
            if (sol === ".") return <div key={cell} className="xw-block" />;
            const classes = ["xw-cell"];
            if (currentCells.includes(cell) && !won) classes.push("inWord");
            if (cell === sel.cell && !won) classes.push("active");
            if (wrongSet.has(cell)) classes.push("wrong");
            if (revealedSet.has(cell)) classes.push("revealed");
            if (won) classes.push("won");
            return (
              <button key={cell} className={classes.join(" ")} onClick={() => tapCell(cell)} tabIndex={-1}>
                {cellInfo[cell].num && <small>{cellInfo[cell].num}</small>}
                <span>{value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {won ? (
        <div className="xw-win">
          <strong>{t("Bravo! Grille complétée 🎉", "Well done! Puzzle solved 🎉")}</strong>
          <button className="bigAction compact" onClick={() => startNew()}>
            <Sparkles size={18} /> {t("Nouvelle grille", "New puzzle")}
          </button>
        </div>
      ) : (
        <>
          <div className="xw-clue">
            <button className="xw-arrow" onClick={() => stepWord(-1)} aria-label={t("Mot précédent", "Previous word")}>
              <ChevronLeft size={20} />
            </button>
            <button className="xw-clueText" onClick={() => setShowList(true)}>
              <b>
                {current.num}
                {current.dir === "A" ? "→" : "↓"}
              </b>
              <span>
                {message ? <em className={message.kind}>{message.text}</em> : current.clue}
                <i>
                  {" "}
                  ({current.len})
                </i>
              </span>
            </button>
            <button className="xw-arrow" onClick={() => stepWord(1)} aria-label={t("Mot suivant", "Next word")}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="xw-tools">
            <button onClick={check}>
              <Check size={16} /> {t("Vérifier", "Check")}
            </button>
            <button onClick={() => reveal([sel.cell])}>
              <Eye size={16} /> {t("Lettre", "Letter")}
            </button>
            <button onClick={() => reveal(currentCells)}>
              <Eye size={16} /> {t("Mot", "Word")}
            </button>
            <button onClick={() => setShowList(true)}>
              <List size={16} /> {t("Liste", "List")}
            </button>
          </div>

          <div className="xw-keyboard">
            {(KEYBOARDS[lang] || KEYBOARDS.fr).map((row, r) => (
              <div key={row} className="xw-keyRow">
                {row.split("").map((k) => (
                  <button key={k} onClick={() => typeLetter(k)}>
                    {k}
                  </button>
                ))}
                {r === 2 && (
                  <button className="xw-back" onClick={backspace} aria-label={t("Effacer", "Delete")}>
                    <Delete size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showList && (
        <div className="xw-sheet" onClick={() => setShowList(false)}>
          <div className="xw-sheetBody" onClick={(e) => e.stopPropagation()}>
            <div className="xw-sheetHead">
              <strong>{t("Définitions", "Clues")}</strong>
              <button className="iconButton" onClick={() => setShowList(false)} aria-label={t("Fermer", "Close")}>
                <X size={18} />
              </button>
            </div>
            <div className="xw-sheetScroll">
              {["A", "D"].map((dir) => (
                <section key={dir}>
                  <h3>{dirLabel(dir)}</h3>
                  {puzzle.words
                    .filter((w) => w.dir === dir)
                    .map((w) => (
                      <button
                        key={w.id}
                        className={`xw-clueRow ${w.id === currentId ? "current" : ""} ${isFilled(w.id) ? "filled" : ""}`}
                        onClick={() => {
                          selectWord(w.id);
                          setShowList(false);
                        }}
                      >
                        <b>{w.num}</b>
                        <span>
                          {w.clue} <i>({w.len})</i>
                        </span>
                      </button>
                    ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {won && <Confetti />}
    </div>
  );
}

// Écoute le clavier physique avec toujours la dernière version du gestionnaire
function useKeys(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      ref.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
