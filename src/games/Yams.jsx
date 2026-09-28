// Yam's (5 dés) : 3 lancers par tour, touche un dé pour le garder, puis choisis une case
import { useRef, useState } from "react";
import { Dice5, Minus, Plus, RotateCcw } from "lucide-react";
import Dice3D from "../dice/Dice3D.jsx";
import { sfx, useLang, vibrate, recordGame } from "../lib/core.js";
import { feltFor } from "../screens/SettingsSheet.jsx";
import { Confetti } from "./Hangman.jsx";

const count = (values, face) => values.filter((v) => v === face).length;
const sum = (values) => values.reduce((s, v) => s + v, 0);
const counts = (values) => [1, 2, 3, 4, 5, 6].map((f) => count(values, f));
const hasRun = (values, len) => {
  const set = new Set(values);
  const runs = len === 4 ? [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]] : [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6]];
  return runs.some((run) => run.every((v) => set.has(v)));
};

const CATEGORIES = [
  { id: "1", fr: "As (1)", en: "Ones", score: (v) => count(v, 1) * 1, upper: true },
  { id: "2", fr: "Deux", en: "Twos", score: (v) => count(v, 2) * 2, upper: true },
  { id: "3", fr: "Trois", en: "Threes", score: (v) => count(v, 3) * 3, upper: true },
  { id: "4", fr: "Quatre", en: "Fours", score: (v) => count(v, 4) * 4, upper: true },
  { id: "5", fr: "Cinq", en: "Fives", score: (v) => count(v, 5) * 5, upper: true },
  { id: "6", fr: "Six", en: "Sixes", score: (v) => count(v, 6) * 6, upper: true },
  { id: "brelan", fr: "Brelan", en: "3 of a kind", score: (v) => (Math.max(...counts(v)) >= 3 ? sum(v) : 0) },
  { id: "carre", fr: "Carré", en: "4 of a kind", score: (v) => (Math.max(...counts(v)) >= 4 ? sum(v) : 0) },
  {
    id: "full",
    fr: "Full",
    en: "Full house",
    score: (v) => {
      const c = counts(v).filter(Boolean).sort();
      return c.length === 2 && c[0] === 2 && c[1] === 3 ? 25 : 0;
    }
  },
  { id: "petite", fr: "Petite suite", en: "Small straight", score: (v) => (hasRun(v, 4) ? 30 : 0) },
  { id: "grande", fr: "Grande suite", en: "Large straight", score: (v) => (hasRun(v, 5) ? 40 : 0) },
  { id: "yams", fr: "Yam's", en: "Yahtzee", score: (v) => (Math.max(...counts(v)) === 5 ? 50 : 0) },
  { id: "chance", fr: "Chance", en: "Chance", score: (v) => sum(v) }
];

function totals(sheet) {
  const upper = CATEGORIES.filter((c) => c.upper).reduce((s, c) => s + (sheet[c.id] ?? 0), 0);
  const bonus = upper >= 63 ? 35 : 0;
  const lower = CATEGORIES.filter((c) => !c.upper).reduce((s, c) => s + (sheet[c.id] ?? 0), 0);
  return { upper, bonus, total: upper + bonus + lower };
}

export default function Yams({ players, theme, sound }) {
  const { t, lang } = useLang();
  const diceRef = useRef(null);
  const [setup, setSetup] = useState(true);
  const [nbPlayers, setNbPlayers] = useState(Math.min(4, Math.max(1, players.length)));
  const [sheets, setSheets] = useState([]);
  const [current, setCurrent] = useState(0);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [values, setValues] = useState([]);
  const [hasRolled, setHasRolled] = useState(false);
  const [rolling, setRolling] = useState(false);

  // Références pour les vérifications du moteur 3D (toujours à jour)
  const state = useRef({});
  state.current = { rollsLeft, hasRolled, rolling };

  const names = Array.from({ length: nbPlayers }, (_, i) => players[i]?.name || `${t("Joueur", "Player")} ${i + 1}`);
  const finished = sheets.length > 0 && sheets.every((s) => CATEGORIES.every((c) => s[c.id] !== undefined));

  function start() {
    setSheets(Array.from({ length: nbPlayers }, () => ({})));
    setCurrent(0);
    setRollsLeft(3);
    setHasRolled(false);
    setValues([]);
    setSetup(false);
  }

  function choose(cat) {
    if (!hasRolled || rolling || sheets[current][cat.id] !== undefined) return;
    const points = cat.score(values);
    const next = sheets.map((s, i) => (i === current ? { ...s, [cat.id]: points } : s));
    setSheets(next);
    if (points > 0) sfx.good();
    else sfx.bad();
    if (cat.id === "yams" && points) {
      sfx.win();
      vibrate([60, 40, 60, 40, 120]);
    }
    const done = next.every((s) => CATEGORIES.every((c) => s[c.id] !== undefined));
    if (done) {
      setTimeout(sfx.win, 400);
      const finalTotals = next.map((s) => totals(s).total);
      recordGame("yams", nbPlayers === 1 ? "win" : "played", Math.max(...finalTotals));
      return;
    }
    setCurrent((current + 1) % nbPlayers);
    setRollsLeft(3);
    setHasRolled(false);
    diceRef.current?.releaseAll();
  }

  if (setup) {
    return (
      <div className="game yamsSetup">
        <div className="setupCard">
          <div className="setupIcon">🎲</div>
          <h2>Yam's</h2>
          <p className="muted">
            {t(
              "3 lancers par tour. Touche un dé pour le garder, puis choisis une case. Le plus gros total gagne!",
              "3 rolls per turn. Tap a die to keep it, then pick a box. Highest total wins!"
            )}
          </p>
          <div className="optionRow">
            <span>{t("Joueurs", "Players")}</span>
            <div className="stepper">
              <button onClick={() => setNbPlayers(Math.max(1, nbPlayers - 1))}>
                <Minus size={18} />
              </button>
              <strong>{nbPlayers}</strong>
              <button onClick={() => setNbPlayers(Math.min(4, nbPlayers + 1))}>
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="setupNames">{names.join(" • ")}</div>
          <button className="bigAction" onClick={start}>
            {t("Commencer", "Start")}
          </button>
        </div>
      </div>
    );
  }

  const sheet = sheets[current] || {};
  const allTotals = sheets.map(totals);
  const winner = finished ? allTotals.reduce((best, tt, i) => (tt.total > allTotals[best].total ? i : best), 0) : -1;

  return (
    <div className="game yams">
      <Dice3D
        ref={diceRef}
        className="yamsTray"
        sides={6}
        count={5}
        paletteId="ivory"
        felt={feltFor(theme)}
        sound={sound}
        canRoll={() => state.current.rollsLeft > 0 && !finished}
        canHold={() => state.current.hasRolled && state.current.rollsLeft > 0}
        onRollStart={() => {
          setRolling(true);
          setRollsLeft((r) => r - 1);
        }}
        onResult={(r) => {
          if (r.silent) return;
          setRolling(false);
          setValues(r.values);
          setHasRolled(true);
        }}
      />

      <div className="yamsBar">
        <span className="yamsTurn">
          {finished ? t("Partie terminée", "Game over") : <>{t("Tour de", "Turn:")} <strong>{names[current]}</strong></>}
        </span>
        <span className="rollDots" aria-label={`${rollsLeft}`}>
          {[0, 1, 2].map((i) => (
            <i key={i} className={i < rollsLeft ? "on" : ""} />
          ))}
        </span>
        <button className="bigAction compact" onClick={() => diceRef.current?.roll()} disabled={rolling || rollsLeft === 0 || finished}>
          <Dice5 size={20} />
          {rollsLeft === 0 ? t("Choisis", "Pick") : t("Lancer", "Roll")}
        </button>
      </div>

      <div className="yamsSheet">
        <table>
          <thead>
            <tr>
              <th />
              {names.map((n, i) => (
                <th key={i} className={i === current && !finished ? "cur" : ""}>
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat, idx) => {
              const preview = hasRolled && !rolling && sheet[cat.id] === undefined && !finished;
              return [
                <tr key={cat.id} className={preview ? "pickable" : ""} onClick={() => preview && choose(cat)}>
                  <td className="catName">{cat[lang] || cat.fr}</td>
                  {sheets.map((s, i) => (
                    <td key={i} className={i === current && !finished ? "cur" : ""}>
                      {s[cat.id] !== undefined ? (
                        <b className={s[cat.id] === 0 ? "zero" : ""}>{s[cat.id]}</b>
                      ) : i === current && preview ? (
                        <span className="preview">{cat.score(values)}</span>
                      ) : (
                        ""
                      )}
                    </td>
                  ))}
                </tr>,
                idx === 5 && (
                  <tr key="bonus" className="subtotal">
                    <td className="catName">{t("Bonus (63+)", "Bonus (63+)")}</td>
                    {allTotals.map((tt, i) => (
                      <td key={i}>
                        {tt.bonus ? <b>35</b> : <small>{tt.upper}/63</small>}
                      </td>
                    ))}
                  </tr>
                )
              ];
            })}
            <tr className="grandTotal">
              <td className="catName">Total</td>
              {allTotals.map((tt, i) => (
                <td key={i} className={i === winner ? "winner" : ""}>
                  <b>{tt.total}</b>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {finished && (
        <div className="resultBanner win floating">
          <strong>
            🏆 {names[winner]} {t("gagne avec", "wins with")} {allTotals[winner].total}!
          </strong>
          <button className="bigAction" onClick={() => setSetup(true)}>
            <RotateCcw size={20} />
            {t("Nouvelle partie", "New game")}
          </button>
        </div>
      )}
      {finished && <Confetti />}
    </div>
  );
}
