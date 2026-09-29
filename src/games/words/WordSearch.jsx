// Mots cachés : glisser le doigt sur un mot (ou toucher sa première puis sa dernière lettre)
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Sparkles, Timer } from "lucide-react";
import { recordGame, sfx, useLang, useStored, vibrate, writeStored } from "../../lib/core.js";
import { Confetti } from "../Hangman.jsx";
import { WORD_THEMES } from "./themes.js";
import { generateWordSearch, lineCells, matchSelection, snapLine } from "./engine.js";
import "./words.css";

const STORE_KEY = "bgh2_wordsearch";
const LEVELS = ["easy", "medium", "hard"];
// Couleurs des surlignages (une par mot trouvé)
const COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#14b8a6", "#ef4444", "#eab308", "#6366f1", "#84cc16", "#f97316", "#06b6d4", "#d946ef", "#10b981"];

function themesFor(lang) {
  return WORD_THEMES[lang] || WORD_THEMES.fr;
}

// Nouvelle partie : choice = identifiant de thème ou « random »
function newGame(lang, level, choice, previousTheme) {
  const themes = themesFor(lang);
  let theme = themes.find((th) => th.id === choice);
  if (!theme) {
    const others = themes.filter((th) => th.id !== previousTheme);
    theme = others[Math.floor(Math.random() * others.length)];
  }
  return {
    lang,
    level,
    choice: theme && choice === theme.id ? choice : "random",
    themeId: theme.id,
    puzzle: generateWordSearch(theme.words, level, { lang }),
    found: [],
    elapsed: 0,
    won: false
  };
}

function isValidGame(g) {
  return Boolean(g && g.puzzle && Array.isArray(g.puzzle.grid) && Array.isArray(g.found) && g.puzzle.words?.length);
}

const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function WordSearch() {
  const { t, lang } = useLang();
  const [game, setGame] = useStored(STORE_KEY, null);
  const [elapsed, setElapsed] = useState(() => (isValidGame(game) ? game.elapsed || 0 : 0));
  const [sel, setSel] = useState(null); // sélection en cours { row, col, dr, dc, len }
  const [pending, setPending] = useState(null); // mode toucher : première lettre [r, c]
  const [flash, setFlash] = useState(null); // mauvaise sélection (petit effet)
  const [lastFound, setLastFound] = useState(-1);
  const [confirmNew, setConfirmNew] = useState(false); // niveau en attente de confirmation
  const wrapRef = useRef(null);
  const boardRef = useRef(null);
  const drag = useRef(null);
  const [side, setSide] = useState(300);

  const ready = isValidGame(game) && game.lang === lang;

  // Première visite, sauvegarde invalide ou changement de langue
  useEffect(() => {
    if (!ready) {
      const g = newGame(lang, isValidGame(game) ? game.level : "easy", "random");
      setGame(g);
      setElapsed(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lang]);

  // Carré le plus grand possible dans l'espace libre
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

  // Chrono : avance chaque seconde tant que la partie n'est pas gagnée et que l'écran est visible
  const running = ready && !game.won;
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Sauvegarde du chrono : toutes les 10 s et en quittant l'écran
  const latest = useRef({ game, elapsed });
  latest.current = { game, elapsed };
  useEffect(() => {
    if (running && elapsed > 0 && elapsed % 10 === 0) setGame((g) => (g ? { ...g, elapsed } : g));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);
  useEffect(
    () => () => {
      const { game: g, elapsed: e } = latest.current;
      if (isValidGame(g) && !g.won && g.elapsed !== e) writeStored(STORE_KEY, { ...g, elapsed: e });
    },
    []
  );

  useEffect(() => {
    if (!confirmNew) return undefined;
    const id = setTimeout(() => setConfirmNew(false), 3000);
    return () => clearTimeout(id);
  }, [confirmNew]);

  useEffect(() => {
    if (!flash) return undefined;
    const id = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(id);
  }, [flash]);

  const puzzle = ready ? game.puzzle : null;
  const size = puzzle ? puzzle.size : 10;
  const themes = themesFor(lang);
  const theme = ready ? themes.find((th) => th.id === game.themeId) : null;

  const foundIds = ready ? game.found.map((f) => f.i) : [];
  const foundCells = useMemo(() => {
    const set = new Set();
    if (ready) for (const f of game.found) for (const [r, c] of lineCells(f.row, f.col, f.dr, f.dc, f.len)) set.add(r * size + c);
    return set;
  }, [ready, game, size]);

  if (!ready) return <div className="game ws" />;

  // Case sous le doigt
  function cellAt(e) {
    const rect = wrapRef.current.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * size);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * size);
    return [Math.min(size - 1, Math.max(0, r)), Math.min(size - 1, Math.max(0, c))];
  }

  // Essaie de valider une sélection
  function submit(selection) {
    const i = matchSelection(puzzle, selection, foundIds);
    if (i < 0) {
      if (selection.len > 1) {
        setFlash(selection);
        vibrate(25);
      }
      return false;
    }
    const found = [...game.found, { i, row: selection.row, col: selection.col, dr: selection.dr, dc: selection.dc, len: selection.len }];
    const won = found.length === puzzle.words.length;
    setLastFound(found.length - 1);
    setGame({ ...game, found, won, elapsed });
    if (won) {
      sfx.win();
      vibrate([40, 40, 80]);
      recordGame("wordsearch", "win");
    } else {
      sfx.good();
      vibrate(30);
    }
    return true;
  }

  function onPointerDown(e) {
    if (game.won) return;
    e.preventDefault();
    wrapRef.current.setPointerCapture?.(e.pointerId);
    const [r, c] = cellAt(e);
    drag.current = { r, c, moved: false };
    setSel({ row: r, col: c, dr: 0, dc: 0, len: 1 });
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const [r, c] = cellAt(e);
    if (r !== d.r || c !== d.c) d.moved = true;
    if (d.moved) setSel(snapLine(d.r, d.c, r, c, size));
  }

  function onPointerUp(e) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const [r, c] = cellAt(e);
    setSel(null);
    if (d.moved) {
      // Mode glisser
      setPending(null);
      submit(snapLine(d.r, d.c, r, c, size));
      return;
    }
    // Mode toucher début → toucher fin
    if (!pending) {
      sfx.tap();
      setPending([r, c]);
      return;
    }
    const [pr, pc] = pending;
    if (pr === r && pc === c) {
      setPending(null);
      return;
    }
    const dr = r - pr;
    const dc = c - pc;
    const straight = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
    if (!straight) {
      // Pas en ligne droite : cette case devient le nouveau début
      sfx.tap();
      setPending([r, c]);
      return;
    }
    setPending(null);
    submit(snapLine(pr, pc, r, c, size));
  }

  function onPointerCancel() {
    drag.current = null;
    setSel(null);
  }

  // Nouvelle grille ; si des mots sont déjà trouvés, un premier toucher demande confirmation
  function restart(level = game.level, choice = game.choice, force = false) {
    const busy = !game.won && game.found.length > 0;
    if (busy && !force && confirmNew !== level) {
      setConfirmNew(level);
      return;
    }
    setConfirmNew(false);
    sfx.deal();
    setPending(null);
    setSel(null);
    setLastFound(-1);
    setElapsed(0);
    setGame(newGame(lang, level, choice, game.themeId));
  }

  const levelLabel = { easy: t("Facile", "Easy"), medium: t("Moyen", "Medium"), hard: t("Difficile", "Hard") };
  const cellPx = side / size;
  const center = (r, c) => [c + 0.5, r + 0.5];
  const lineFor = (s) => {
    const [x1, y1] = center(s.row, s.col);
    const [x2, y2] = center(s.row + s.dr * (s.len - 1), s.col + s.dc * (s.len - 1));
    return { x1, y1, x2, y2 };
  };
  const selCells = new Set(sel ? lineCells(sel.row, sel.col, sel.dr, sel.dc, sel.len).map(([r, c]) => r * size + c) : []);

  return (
    <div className="game ws">
      <div className="gameBar">
        <div className="segmented small">
          {LEVELS.map((lv) => (
            <button key={lv} className={game.level === lv ? "active" : ""} onClick={() => lv !== game.level && restart(lv)}>
              {confirmNew === lv && lv !== game.level ? t("Sûr?", "Sure?") : levelLabel[lv]}
            </button>
          ))}
        </div>
        <button className={`chipButton ${confirmNew === game.level ? "accent" : ""}`} onClick={() => restart()}>
          <RotateCcw size={15} /> {confirmNew === game.level ? t("Sûr?", "Sure?") : t("Nouvelle", "New")}
        </button>
      </div>

      <div className="ws-bar2">
        <select
          className="ws-theme"
          value={game.choice === "random" ? "random" : game.themeId}
          onChange={(e) => restart(game.level, e.target.value, true)}
          aria-label={t("Thème", "Theme")}
        >
          <option value="random">
            {game.choice === "random" && theme ? `🎲 ${theme.emoji} ${theme.name}` : `🎲 ${t("Au hasard", "Random")}`}
          </option>
          {themes.map((th) => (
            <option key={th.id} value={th.id}>
              {th.emoji} {th.name}
            </option>
          ))}
        </select>
        <span className="ws-stat">
          {game.found.length}/{puzzle.words.length}
        </span>
        <span className="ws-stat">
          <Timer size={14} /> {formatTime(elapsed)}
        </span>
      </div>

      <div className="ws-board" ref={boardRef}>
        <div
          className="ws-gridWrap"
          ref={wrapRef}
          style={{ width: side, height: side, "--cell": `${cellPx}px` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <svg className="ws-lines" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            {game.found.map((f, k) => (
              <line
                key={`${f.i}`}
                className={k === lastFound ? "new" : ""}
                {...lineFor(f)}
                stroke={COLORS[f.i % COLORS.length]}
                strokeOpacity="0.5"
                strokeWidth="0.78"
              />
            ))}
            {sel && <line {...lineFor(sel)} stroke="var(--primary)" strokeOpacity="0.45" strokeWidth="0.82" />}
            {flash && <line {...lineFor(flash)} stroke="#ef4444" strokeOpacity="0.35" strokeWidth="0.78" />}
          </svg>
          <div className="ws-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
            {puzzle.grid.flatMap((row, r) =>
              row.split("").map((ch, c) => {
                const idx = r * size + c;
                const cls = [foundCells.has(idx) || selCells.has(idx) ? "found" : "", pending && pending[0] === r && pending[1] === c ? "pending" : ""].join(" ");
                return (
                  <span key={idx} className={cls}>
                    {ch}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>

      {game.won ? (
        <div className="ws-win">
          <strong>
            {t("Tous trouvés! 🎉", "All found! 🎉")} {formatTime(game.elapsed ?? elapsed)}
          </strong>
          <button className="bigAction compact" onClick={() => restart(game.level, game.choice, true)}>
            <Sparkles size={18} /> {t("Rejouer", "Play again")}
          </button>
        </div>
      ) : (
        <p className="ws-hint">
          {pending
            ? t("Touche maintenant la dernière lettre du mot", "Now tap the last letter of the word")
            : t("Glisse sur un mot, ou touche sa 1re puis sa dernière lettre", "Swipe across a word, or tap its first then last letter")}
        </p>
      )}

      <div className="ws-words">
        {puzzle.words.map((w, i) => {
          const done = foundIds.includes(i);
          return (
            <span key={w.key} className={done ? "found" : ""} style={{ "--wc": COLORS[i % COLORS.length] }}>
              {done && <i />}
              {w.word.toUpperCase()}
            </span>
          );
        })}
      </div>

      {game.won && <Confetti />}
    </div>
  );
}
