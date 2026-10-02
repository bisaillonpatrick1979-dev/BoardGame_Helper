import { useLang } from "../../lib/core.js";
export default function NetNaval({ view: s, send }) {
  const { t } = useLang();
  const mine = s.mySeat === s.turn;
  return (
    <div className="newGame">
      <p role="status">
        {s.winner !== null
          ? `${t("Gagnant", "Winner")}: ${s.names[s.winner]}`
          : `${t("Tour de", "Turn:")} ${s.names[s.turn]}`}
      </p>
      {s.mySeat < 0 ? (
        <p>
          {t(
            "Spectateur : les grilles restent privées.",
            "Spectator: grids remain private.",
          )}
        </p>
      ) : (
        <>
          <h3>{t("Tire sur la flotte adverse", "Target the enemy fleet")}</h3>
          <div className="navalBoard">
            {s.shots.map((v, i) => (
              <button
                key={i}
                disabled={!mine || s.winner !== null || v !== null}
                aria-label={`${String.fromCharCode(65 + (i % 8))}${Math.floor(i / 8) + 1}: ${v === null ? t("inconnu", "unknown") : v ? t("touché", "hit") : t("raté", "miss")}`}
                className={v === true ? "hit" : v === false ? "miss" : ""}
                onClick={() => send({ type: "fire", cell: i })}
              >
                {v === null ? "·" : v ? "✕" : "○"}
              </button>
            ))}
          </div>
          <p>
            {s.sunk.length} / 5 {t("navires coulés", "ships sunk")}
          </p>
          <h3>{t("Ta flotte", "Your fleet")}</h3>
          <div className="navalBoard ownFleet">
            {s.board.map((v, i) => (
              <span
                key={i}
                className={s.incoming[i] === true ? "hit" : v ? "ship" : ""}
              >
                {s.incoming[i] === true
                  ? "✕"
                  : s.incoming[i] === false
                    ? "○"
                    : v
                      ? "■"
                      : "·"}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
