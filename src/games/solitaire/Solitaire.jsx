// Solitaires : Klondike, FreeCell, Araignée, Pyramide et Golf
// Un écran de choix de variante, puis un tapis commun (toucher, glisser, annuler, indice, chrono, sauvegarde).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Hand, RotateCcw, Sparkles, Undo2 } from "lucide-react";
import { recordGame, sfx, useLang, useStored, vibrate, writeStored } from "../../lib/core.js";
import { Confetti } from "../Hangman.jsx";
import Board, { SolCard } from "./Board.jsx";
import { card } from "./engines/cards.js";
import { DEFAULT_OPTS, ENGINES, VARIANT_IDS, actionHighlight } from "./engines/index.js";
import "./solitaire.css";

const HISTORY_MAX = 50;

// Sons et vibrations seulement après un premier geste (sinon le navigateur proteste en console)
const userActive = () => typeof navigator === "undefined" || !navigator.userActivation || navigator.userActivation.hasBeenActive;
const play = (fn) => userActive() && fn();
const saveKey = (variant) => `bgh2_sol_game_${variant}`;

// Textes de chaque variante
function variantInfo(t) {
  return {
    klondike: { name: "Klondike", desc: t("Le classique : 7 colonnes, 4 fondations.", "The classic: 7 columns, 4 foundations.") },
    freecell: { name: "FreeCell", desc: t("4 cellules libres, presque toujours gagnable.", "4 free cells, almost always winnable.") },
    spider: { name: t("Araignée", "Spider"), desc: t("104 cartes : suites du Roi à l'As.", "104 cards: runs from King to Ace.") },
    pyramid: { name: t("Pyramide", "Pyramid"), desc: t("Retire les paires qui font 13.", "Remove pairs that add up to 13.") },
    golf: { name: "Golf", desc: t("Monte ou descends de 1 pour tout vider.", "Go up or down by 1 to clear it all.") }
  };
}

function optionLabel(state, t) {
  if (state.v === "klondike") return state.draw === 3 ? t("Pioche 3", "Draw 3") : t("Pioche 1", "Draw 1");
  if (state.v === "spider") return state.suits === 1 ? t("1 couleur", "1 suit") : t(`${state.suits} couleurs`, `${state.suits} suits`);
  return "";
}

export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function newGame(variant, opts) {
  return { state: ENGINES[variant].deal(opts || DEFAULT_OPTS[variant]), history: [], elapsed: 0, result: null };
}

// ---------- Écran principal ----------
export default function Solitaire() {
  const [variant, setVariant] = useStored("bgh2_sol_variant", null);
  if (variant && ENGINES[variant]) return <GameView key={variant} variant={variant} onBack={() => setVariant(null)} />;
  return <VariantMenu onPick={setVariant} />;
}

// Mini-illustration de chaque variante (vraies cartes miniatures)
const C = (r, s) => card(s * 13 + r - 1, true);
const PREVIEWS = {
  klondike: [
    [C(13, 0), 0, 0],
    [C(12, 1), 12, 13],
    [C(11, 3), 24, 26]
  ],
  freecell: [
    [C(1, 2), 0, 8],
    [C(2, 2), 18, 8],
    [C(10, 3), 36, 8]
  ],
  spider: [
    [C(13, 0), 6, 0],
    [C(12, 0), 6, 10],
    [C(11, 0), 6, 20],
    [C(10, 0), 6, 30]
  ],
  pyramid: [
    [C(8, 1), 18, 2],
    [C(5, 0), 6, 18],
    [C(13, 3), 30, 18]
  ],
  golf: [
    [C(7, 2), 4, 8],
    [C(8, 0), 20, 12],
    [C(9, 1), 36, 16]
  ]
};

function Preview({ variant, lang }) {
  return (
    <div className="sol-preview" aria-hidden="true">
      {PREVIEWS[variant].map(([v, x, y], i) => (
        <SolCard key={i} v={v} x={x} y={y} z={i} w={30} h={42} pile="" index={i} lang={lang} />
      ))}
    </div>
  );
}

function VariantMenu({ onPick }) {
  const { t, lang } = useLang();
  const [best] = useStored("bgh2_sol_best", {});
  const info = variantInfo(t);
  // Parties en cours (lecture seule)
  const saves = useMemo(() => {
    const out = {};
    VARIANT_IDS.forEach((id) => {
      try {
        const raw = localStorage.getItem(saveKey(id));
        const g = raw && JSON.parse(raw);
        if (g && g.state && !g.result && g.state.moves > 0) out[id] = g;
      } catch {
        // ignoré
      }
    });
    return out;
  }, []);

  return (
    <div className="game sol-menu">
      <div className="sol-menuHead">
        <h2>{t("Solitaires", "Solitaire")}</h2>
        <p>{t("Choisis ta variante", "Pick a variant")}</p>
      </div>
      <div className="sol-menuList">
        {VARIANT_IDS.map((id) => (
          <button key={id} className={`sol-tile sol-tile-${id}`} onClick={() => (sfx.tap(), onPick(id))}>
            <Preview variant={id} lang={lang} />
            <span className="sol-tileText">
              <strong>{info[id].name}</strong>
              <small>{info[id].desc}</small>
              <span className="sol-tileMeta">
                {best[id] != null && <em>🏆 {formatTime(best[id])}</em>}
                {saves[id] && (
                  <em className="sol-resume">
                    ▶ {t("En cours", "In progress")} · {saves[id].state.moves} {t("coups", "moves")}
                  </em>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Chrono autonome : se redessine seul chaque seconde sans toucher au tapis
function Clock({ getElapsed }) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="sol-clock">⏱ {formatTime(getElapsed())}</span>;
}

// ---------- Une partie ----------
function GameView({ variant, onBack }) {
  const { t } = useLang();
  const engine = ENGINES[variant];
  const info = variantInfo(t)[variant];
  const [allOpts, setAllOpts] = useStored("bgh2_sol_opts", DEFAULT_OPTS);
  const opts = { ...DEFAULT_OPTS[variant], ...(allOpts && allOpts[variant]) };
  const [stored, setStored] = useStored(saveKey(variant), () => newGame(variant, opts));
  // Sauvegarde abîmée ou d'un autre format : on repart d'une donne neuve
  const fallback = useRef(null);
  const valid = stored && stored.state && stored.state.piles && stored.state.v === variant && Array.isArray(stored.history);
  if (!valid && !fallback.current) fallback.current = newGame(variant, opts);
  const game = valid ? stored : fallback.current;
  const setGame = useCallback(
    (next) =>
      setStored((g) => {
        const ok = g && g.state && g.state.piles && g.state.v === variant && Array.isArray(g.history);
        const base = ok ? g : fallback.current || newGame(variant);
        return typeof next === "function" ? next(base) : next;
      }),
    [setStored, variant]
  );
  const [best, setBest] = useStored("bgh2_sol_best", {});
  const [tapMode, setTapMode] = useStored("bgh2_sol_tapmode", "auto");
  const [selection, setSelection] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [sheetOpts, setSheetOpts] = useState(opts);

  const state = game.state;
  const won = game.result === "win";
  const stuck = !won && engine.stuck(state);

  // ---------- Chrono : base sauvegardée + temps écoulé depuis la reprise ----------
  const clock = useRef({ base: game.elapsed || 0, since: null });
  const elapsedNow = useCallback(() => {
    const c = clock.current;
    return c.base + (c.since ? (Date.now() - c.since) / 1000 : 0);
  }, []);
  const running = state.moves > 0 && !won && !stuck;
  const pause = useCallback(() => {
    const c = clock.current;
    if (c.since) {
      c.base += (Date.now() - c.since) / 1000;
      c.since = null;
    }
  }, []);
  useEffect(() => {
    if (running && !clock.current.since && document.visibilityState !== "hidden") clock.current.since = Date.now();
    if (!running) pause();
  }, [running, pause]);

  // Sauvegarde du temps quand on quitte ou que l'appli passe en arrière-plan
  const gameRef = useRef(game);
  gameRef.current = game;
  useEffect(() => {
    const persist = () => {
      const g = gameRef.current;
      if (g && g.state.moves > 0 && !g.result) writeStored(saveKey(variant), { ...g, elapsed: Math.round(elapsedNow()) });
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        pause();
        persist();
      } else if (gameRef.current.state.moves > 0 && !gameRef.current.result && !clock.current.since) {
        clock.current.since = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      persist();
    };
  }, [variant, elapsedNow, pause]);

  // ---------- Messages et effets visuels ----------
  const flash = useCallback((text) => setToast({ text, key: Date.now() }), []);
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  function shake(pile, index) {
    const p = state.piles[pile];
    if (p && p[index] !== undefined) {
      setShakeId(p[index] >> 1);
      setTimeout(() => setShakeId(null), 380);
    }
    sfx.bad();
  }

  // ---------- Jouer une action ----------
  function commit(action, { record = true } = {}) {
    const next = engine.apply(state, action);
    if (!next) return false;
    const toFoundation = action.to && action.to[0] === "f";
    const removal = action.t === "pair" || action.t === "king" || action.t === "play";
    if (next.piles.done && state.piles.done && next.piles.done.length - state.piles.done.length >= 13) play(sfx.good);
    else if (toFoundation || removal) play(sfx.tap);
    else play(sfx.deal);
    if (!clock.current.since && !won) clock.current.since = Date.now();
    setGame((g) => ({
      ...g,
      state: next,
      history: record ? [...g.history, g.state].slice(-HISTORY_MAX) : g.history,
      elapsed: Math.round(elapsedNow())
    }));
    setSelection(null);
    setHighlight(null);
    return true;
  }

  function explainRefusal(pile) {
    if (variant === "spider" && pile === "stock" && state.piles.stock.length) flash(t("Remplis d'abord les colonnes vides", "Fill the empty columns first"));
    else if (pile === "stock") flash(t("Le talon est épuisé", "The stock is empty"));
  }

  // Toucher une carte ou une case
  function onTap(pile, index) {
    if (won) return;
    if (pile == null) {
      setSelection(null);
      return;
    }
    if (selection) {
      const sel = selection;
      if (sel.pile === pile && sel.index === index) {
        // Deuxième toucher sur la carte choisie : envoi automatique
        setSelection(null);
        const a = engine.tap(state, pile, index);
        if (!a || !commit(a)) shake(pile, index);
        return;
      }
      const a = engine.moveTo(state, sel, pile, index);
      if (a && commit(a)) return;
      setSelection(null);
    }
    if (pile === "stock") {
      const a = engine.tap(state, "stock", index);
      if (!a || !commit(a)) {
        sfx.bad();
        explainRefusal("stock");
      }
      return;
    }
    if (index < 0) return;
    if (tapMode === "auto" || !engine.canSelect(state, pile, index)) {
      const a = engine.tap(state, pile, index);
      if (a && commit(a)) return;
      // Pyramide : on garde la carte choisie pour la jumeler ensuite
      if (variant === "pyramid" && engine.canSelect(state, pile, index)) {
        setSelection({ pile, index });
        sfx.tap();
        return;
      }
      shake(pile, index);
      return;
    }
    setSelection({ pile, index });
    sfx.tap();
  }

  // Dépôt après un glisser : première pile candidate qui accepte le coup
  function onDrop(sel, candidates) {
    for (const pile of candidates) {
      const a = engine.moveTo(state, sel, pile, -1);
      if (a && commit(a)) return;
    }
    if (candidates.length) sfx.bad();
  }

  function undo() {
    if (!game.history.length || won) return;
    sfx.tap();
    setGame((g) => ({ ...g, state: g.history[g.history.length - 1], history: g.history.slice(0, -1) }));
    setSelection(null);
    setHighlight(null);
  }

  function showHint() {
    const a = engine.hint(state);
    if (!a) {
      flash(t("Aucun coup trouvé", "No move found"));
      sfx.bad();
      return;
    }
    const hl = actionHighlight(state, a);
    setHighlight(hl);
    sfx.tap();
    if (a.t === "deal" || a.t === "draw") flash(variant === "spider" ? t("Distribue une rangée", "Deal a new row") : t("Pioche une carte", "Draw a card"));
  }
  useEffect(() => {
    if (!highlight) return undefined;
    const id = setTimeout(() => setHighlight(null), 2200);
    return () => clearTimeout(id);
  }, [highlight]);

  // ---------- Victoire ----------
  useEffect(() => {
    if (game.result || !engine.isWon(state)) return;
    pause();
    const secs = Math.round(elapsedNow());
    const prev = best && best[variant];
    const record = prev == null || secs < prev;
    if (record) setBest((b) => ({ ...(b || {}), [variant]: secs }));
    recordGame(`solitaire-${variant}`, "win");
    setGame((g) => ({ ...g, result: "win", elapsed: secs, record }));
    setTimeout(() => play(sfx.win), 250);
    play(() => vibrate([60, 40, 60, 40, 120]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ---------- Fin automatique (toutes les cartes visibles) ----------
  useEffect(() => {
    if (game.result) return undefined;
    const a = engine.autoComplete(state);
    if (!a) return undefined;
    const id = setTimeout(() => commit(a, { record: false }), 140);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, game.result]);

  // ---------- Nouvelle partie ----------
  function deal(newOpts) {
    if (game.state.moves > 0 && !game.result) recordGame(`solitaire-${variant}`, "loss");
    if (newOpts) setAllOpts((o) => ({ ...(o || {}), [variant]: newOpts }));
    clock.current = { base: 0, since: null };
    setGame(newGame(variant, newOpts || opts));
    setSelection(null);
    setHighlight(null);
    setSheet(false);
    sfx.deal();
  }

  function askNewGame() {
    const hasOptions = variant === "klondike" || variant === "spider";
    if (!hasOptions && (state.moves === 0 || won)) {
      deal();
      return;
    }
    setSheetOpts(opts);
    setSheet(true);
  }

  const optLabel = optionLabel(state, t);
  const bestTime = best && best[variant];

  // Golf et Pyramide : cartes qui restent à dégager (sert de score quand on est bloqué)
  const remaining =
    variant === "golf"
      ? Object.keys(state.piles).filter((p) => p[0] === "t").reduce((n, p) => n + state.piles[p].length, 0)
      : variant === "pyramid"
      ? Object.keys(state.piles).filter((p) => p[0] === "p").reduce((n, p) => n + state.piles[p].length, 0)
      : null;

  let overlay = null;
  if (won) {
    overlay = (
      <div className="sol-overlay">
        <div className="sol-panel sol-panelWin">
          <div className="sol-trophy">🏆</div>
          <strong>{t("Bravo, c'est gagné!", "You won!")}</strong>
          <span>
            ⏱ {formatTime(game.elapsed)} · {state.moves} {t("coups", "moves")}
          </span>
          {game.record && <span className="sol-record">✨ {t("Nouveau record!", "New best time!")}</span>}
          <div className="sol-panelBtns">
            <button className="bigAction compact secondary" onClick={onBack}>
              {t("Variantes", "Variants")}
            </button>
            <button className="bigAction compact" onClick={askNewGame}>
              {t("Rejouer", "Play again")}
            </button>
          </div>
        </div>
      </div>
    );
  } else if (stuck) {
    overlay = (
      <div className="sol-overlay sol-overlaySoft">
        <div className="sol-panel">
          <strong>{t("Plus aucun coup possible", "No moves left")}</strong>
          {remaining != null && (
            <span className="sol-record">
              {remaining} {remaining > 1 ? t("cartes restantes", "cards left") : t("carte restante", "card left")}
            </span>
          )}
          <span>{t("Annule quelques coups ou recommence.", "Undo a few moves or start over.")}</span>
          <div className="sol-panelBtns">
            <button className="bigAction compact secondary" onClick={undo} disabled={!game.history.length}>
              {t("Annuler", "Undo")}
            </button>
            <button className="bigAction compact" onClick={askNewGame}>
              {t("Nouvelle", "New game")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`game sol-game sol-${variant}`}>
      <div className="sol-top">
        <button className="iconButton soft sol-backBtn" onClick={onBack} aria-label={t("Variantes", "Variants")}>
          <ChevronLeft size={20} />
        </button>
        <div className="sol-title">
          <strong>{info.name}</strong>
          <small>
            {optLabel}
            {optLabel && bestTime != null ? " · " : ""}
            {bestTime != null ? `🏆 ${formatTime(bestTime)}` : ""}
          </small>
        </div>
        <div className="sol-stats">
          {won ? <span className="sol-clock">⏱ {formatTime(game.elapsed)}</span> : <Clock getElapsed={elapsedNow} />}
          <span className="sol-moves">
            {state.moves} {t("coups", "moves")}
          </span>
        </div>
      </div>

      <Board
        state={state}
        selection={selection}
        highlight={highlight}
        shakeId={shakeId}
        onTap={onTap}
        onDrop={onDrop}
        canDrag={(pile, index) => !won && engine.canDrag(state, pile, index)}
        overlay={overlay}
      >
        {toast && (
          <div key={toast.key} className="sol-toast">
            {toast.text}
          </div>
        )}
      </Board>

      <div className="sol-tools">
        <button className="sol-tool" onClick={undo} disabled={!game.history.length || won}>
          <Undo2 size={20} />
          <span>{t("Annuler", "Undo")}</span>
        </button>
        <button className="sol-tool" onClick={showHint} disabled={won}>
          <Sparkles size={20} />
          <span>{t("Indice", "Hint")}</span>
        </button>
        <button className="sol-tool" onClick={askNewGame}>
          <RotateCcw size={20} />
          <span>{t("Nouvelle", "New")}</span>
        </button>
        {variant !== "golf" && (
          <button
            className={`sol-tool ${tapMode === "auto" ? "sol-toolOn" : ""}`}
            onClick={() => {
              setTapMode(tapMode === "auto" ? "pick" : "auto");
              setSelection(null);
              flash(
                tapMode === "auto"
                  ? t("Toucher : choisir la carte puis sa destination", "Tap: pick a card, then its destination")
                  : t("Toucher : la carte part toute seule", "Tap: the card moves by itself")
              );
            }}
          >
            <Hand size={20} />
            <span>{tapMode === "auto" ? t("Auto", "Auto") : t("Choix", "Pick")}</span>
          </button>
        )}
      </div>

      {won && <Confetti />}

      {sheet && (
        <div className="sheetBackdrop" onClick={() => setSheet(false)}>
          <div className="sheet sol-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>{t("Nouvelle partie", "New game")}</h2>
            {variant === "klondike" && (
              <div className="segmented">
                {[1, 3].map((n) => (
                  <button key={n} className={sheetOpts.draw === n ? "active" : ""} onClick={() => setSheetOpts({ ...sheetOpts, draw: n })}>
                    {n === 1 ? t("Pioche 1 carte", "Draw 1 card") : t("Pioche 3 cartes", "Draw 3 cards")}
                  </button>
                ))}
              </div>
            )}
            {variant === "spider" && (
              <div className="segmented">
                {[1, 2, 4].map((n) => (
                  <button key={n} className={sheetOpts.suits === n ? "active" : ""} onClick={() => setSheetOpts({ ...sheetOpts, suits: n })}>
                    {n === 1 ? t("1 couleur", "1 suit") : t(`${n} couleurs`, `${n} suits`)}
                  </button>
                ))}
              </div>
            )}
            {variant === "spider" && (
              <p className="sol-sheetNote">
                {sheetOpts.suits === 1
                  ? t("Facile : toutes les cartes sont des piques.", "Easy: every card is a spade.")
                  : sheetOpts.suits === 2
                  ? t("Moyen : piques et cœurs.", "Medium: spades and hearts.")
                  : t("Difficile : les 4 couleurs.", "Hard: all 4 suits.")}
              </p>
            )}
            {state.moves > 0 && !won && (
              <p className="sol-sheetNote">{t("La partie en cours comptera comme une défaite.", "The current game will count as a loss.")}</p>
            )}
            <div className="actionRow">
              <button className="bigAction secondary" onClick={() => setSheet(false)}>
                {t("Annuler", "Cancel")}
              </button>
              <button className="bigAction" onClick={() => deal(variant === "klondike" || variant === "spider" ? sheetOpts : null)}>
                {t("Distribuer", "Deal")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
