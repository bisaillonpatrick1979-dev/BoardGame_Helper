import { useState } from "react";
import { randomInt, useLang, useStored, recordGame } from "../../lib/core.js";
import { farkleScore, hasFarkleScore } from "./rules.js";
import { GameFrame, playerNames } from "./shared.jsx";
const fresh = (n) => ({
  scores: Array(n).fill(0),
  turn: 0,
  bank: 0,
  dice: [],
  remaining: 6,
  selected: [],
  message: "",
  finalStarter: null,
  done: false,
});
export default function Farkle({ players }) {
  const { t } = useLang();
  const [n, setN] = useStored(
    "bgh2_farkle_n",
    Math.min(6, Math.max(1, players.length)),
  );
  const [g, setG] = useStored("bgh2_farkle", () => fresh(n));
  const names = playerNames(players, g.scores.length, t);
  const points = farkleScore(g.dice.filter((_, i) => g.selected.includes(i)));
  function finish(s, bust = false) {
    const scores = s.scores.map((v, i) =>
      i === s.turn ? v + (bust ? 0 : s.bank) : v,
    );
    const finalStarter =
      s.finalStarter ?? (scores[s.turn] >= 10000 ? s.turn : null);
    const turn = (s.turn + 1) % scores.length;
    const done = finalStarter !== null && turn === finalStarter;
    if (done) recordGame("farkle", "played", Math.max(...scores));
    setG({
      ...s,
      scores,
      turn,
      finalStarter,
      done,
      bank: 0,
      dice: [],
      selected: [],
      remaining: 6,
      message: bust ? "bust" : "bank",
    });
  }
  function roll() {
    if (g.done || g.dice.length) return;
    const dice = Array.from({ length: g.remaining }, () => randomInt(6) + 1);
    if (!hasFarkleScore(dice)) finish({ ...g, dice }, true);
    else setG({ ...g, dice, selected: [], message: "" });
  }
  function keep(bank) {
    if (!points) return;
    const remaining = g.dice.length - g.selected.length;
    const s = {
      ...g,
      bank: g.bank + points,
      remaining: remaining || 6,
      dice: [],
      selected: [],
    };
    if (bank) finish(s);
    else setG(s);
  }
  return (
    <GameFrame
      title="Farkle / 10 000"
      onNew={() => setG(fresh(n))}
      rules={t(
        "1 = 100, 5 = 50. Trois identiques : face × 100 (trois 1 = 1000); chaque dé identique supplémentaire double ces points. Suite 1–6 ou trois paires = 1500. Garde au moins un dé qui marque avant de relancer. Un lancer sans points perd les points du tour. À 10 000, chacun finit son dernier tour.",
        "1 = 100, 5 = 50. Triples: face × 100 (three 1s = 1000); each additional matching die doubles those points. Straight 1–6 or three pairs = 1500. Keep scoring dice before rolling again. No scoring dice loses this turn’s points. At 10,000 everyone gets their final turn.",
      )}
    >
      <label>
        {t("Joueurs pour la prochaine partie", "Players for the next game")}{" "}
        <select value={n} onChange={(e) => setN(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <div className="scoreStrip">
        {g.scores.map((v, i) => (
          <span key={i} className={i === g.turn ? "selected" : ""}>
            {names[i]}: <b>{v}</b>
          </span>
        ))}
      </div>
      <p role="status">
        {g.done
          ? `${t("Gagnant", "Winner")}: ${g.scores
              .map((v, i) => (v === Math.max(...g.scores) ? names[i] : null))
              .filter(Boolean)
              .join(", ")}`
          : `${names[g.turn]} · ${t("Points du tour", "Turn points")}: ${g.bank}`}
      </p>
      {g.finalStarter !== null && !g.done && (
        <p>{t("Dernier tour!", "Final round!")}</p>
      )}
      {g.message === "bust" && (
        <p>
          {t(
            "Farkle! Les points du tour sont perdus.",
            "Farkle! Turn points lost.",
          )}
        </p>
      )}
      <div className="diceButtons">
        {g.dice.map((v, i) => (
          <button
            key={i}
            aria-pressed={g.selected.includes(i)}
            className={g.selected.includes(i) ? "selected" : ""}
            onClick={() =>
              setG({
                ...g,
                selected: g.selected.includes(i)
                  ? g.selected.filter((k) => k !== i)
                  : [...g.selected, i],
              })
            }
          >
            {v}
          </button>
        ))}
      </div>
      <p>
        {t("Sélection", "Selected")}: {points}
      </p>
      <div className="actionRow">
        <button
          className="bigAction"
          disabled={g.done || !!g.dice.length}
          onClick={roll}
        >
          {t("Lancer", "Roll")} ({g.remaining})
        </button>
        <button
          className="chipButton"
          disabled={!points || g.done}
          onClick={() => keep(false)}
        >
          {t("Garder et continuer", "Keep and continue")}
        </button>
        <button
          className="chipButton"
          disabled={g.done || (g.dice.length ? !points : !g.bank)}
          onClick={() => (g.dice.length ? keep(true) : finish(g))}
        >
          {t("Encaisser", "Bank")}
        </button>
      </div>
    </GameFrame>
  );
}
