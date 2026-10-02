import { useLang } from "../../lib/core.js";
import { YAMS_CATEGORIES, yamsScore } from "../../games/additions/rules.js";
export const yamsLabels = {
  fr: [
    "As",
    "Deux",
    "Trois",
    "Quatre",
    "Cinq",
    "Six",
    "Brelan",
    "Carré",
    "Full",
    "Petite suite",
    "Grande suite",
    "Yam’s",
    "Chance",
  ],
  en: [
    "Ones",
    "Twos",
    "Threes",
    "Fours",
    "Fives",
    "Sixes",
    "3 of a kind",
    "4 of a kind",
    "Full house",
    "Small straight",
    "Large straight",
    "Yahtzee",
    "Chance",
  ],
};
export default function NetYams({ view: s, send }) {
  const { t, lang } = useLang();
  const mine = s.mySeat === s.turn && !s.done;
  return (
    <div className="newGame">
      <p role="status">
        {s.done
          ? t("Partie terminée", "Game over")
          : `${t("Tour de", "Turn:")} ${s.names[s.turn]} · ${s.rolls} ${t("lancers restants", "rolls left")}`}
      </p>
      <div className="diceButtons">
        {s.dice.map((d, i) => (
          <button
            key={i}
            aria-pressed={s.held[i]}
            className={s.held[i] ? "selected" : ""}
            disabled={!mine || !s.rolls}
            onClick={() => send({ type: "hold", index: i })}
          >
            {d}
            {s.held[i] ? " 🔒" : ""}
          </button>
        ))}
      </div>
      <button
        className="bigAction"
        disabled={!mine || !s.rolls || s.held.every(Boolean)}
        onClick={() => send({ type: "roll" })}
      >
        {t("Lancer", "Roll")}
      </button>
      <div className="tableScroll">
        <table className="newTable">
          <thead>
            <tr>
              <th>{t("Case", "Category")}</th>
              {s.names.map((n, i) => (
                <th key={i}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YAMS_CATEGORIES.map((id, k) => (
              <tr key={id}>
                <th>{yamsLabels[lang][k]}</th>
                {s.sheets.map((sheet, i) => (
                  <td key={i}>
                    {sheet[id] ??
                      (i === s.turn && s.dice.length ? (
                        <button
                          disabled={!mine}
                          onClick={() => send({ type: "score", category: id })}
                        >
                          {yamsScore(id, s.dice)}
                        </button>
                      ) : (
                        "—"
                      ))}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th>Total</th>
              {s.totals.map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted">
        {t(
          "Touche un dé pour le garder. Le bonus de 35 points est inclus à partir de 63 points en haut.",
          "Tap a die to hold it. The 35-point upper bonus is included at 63 points.",
        )}
      </p>
    </div>
  );
}
