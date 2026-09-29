// Puissance 4 à deux téléphones
import { useEffect, useRef } from "react";
import { sfx, useLang, vibrate } from "../../lib/core.js";

export default function NetConnect4({ view, send }) {
  const { t } = useLang();
  const { board, turn, result, mySeat, seatNames, score, last } = view;
  const myTurn = mySeat && turn === mySeat && !result;
  const lastKey = last ? `${last[0]}-${last[1]}` : null;
  const winCells = new Set((result?.line || []).map(([r, c]) => `${r}-${c}`));
  const prevLast = useRef(lastKey);

  // Pion qui tombe : son ; fin de partie : fanfare
  useEffect(() => {
    if (lastKey && lastKey !== prevLast.current) sfx.drop();
    prevLast.current = lastKey;
    if (myTurn) vibrate(25);
    if (result) {
      if (result.player && result.player === mySeat) sfx.win();
      else if (result.player) sfx.lose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastKey, result?.player]);

  const status = result
    ? result.player
      ? result.player === mySeat
        ? t("Tu gagnes! 🎉", "You win! 🎉")
        : `${seatNames[result.player - 1]} ${t("gagne!", "wins!")}`
      : t("Match nul!", "Draw!")
    : myTurn
      ? t("À toi de jouer!", "Your turn!")
      : `${t("Tour de", "Turn:")} ${seatNames[turn - 1]}`;

  return (
    <div className="game c4">
      <div className="scoreStrip">
        <span className="p1">● {seatNames[0]} · {score[1]}</span>
        <span>{t("Nuls", "Draws")} · {score[0]}</span>
        <span className="p2">● {seatNames[1]} · {score[2]}</span>
      </div>
      <div className="boardWrap">
        <div className="c4Board">
          {Array.from({ length: 7 }).map((_, c) => (
            <button key={c} className="c4Col" onClick={() => myTurn && send({ type: "drop", col: c })} aria-label={`${t("Colonne", "Column")} ${c + 1}`}>
              {Array.from({ length: 6 }).map((__, r) => {
                const v = board[r][c];
                const key = `${r}-${c}`;
                return (
                  <span key={r} className="c4Hole">
                    {v > 0 && <i className={`disc p${v} ${key === lastKey ? "falling" : ""} ${winCells.has(key) ? "win" : ""}`} style={{ "--fall": `${-(r + 1) * 100 - 20}%` }} />}
                  </span>
                );
              })}
            </button>
          ))}
        </div>
      </div>
      <div className={`gameStatus ${result ? "done" : ""} ${!result ? `turn${turn}` : ""}`}>{status}</div>
      {!mySeat && <div className="pokerWaiting">{t("Tu regardes la partie", "You're watching")}</div>}
      {result && mySeat > 0 && (
        <button className="bigAction" onClick={() => send({ type: "rematch" })}>
          {t("Revanche", "Rematch")}
        </button>
      )}
    </div>
  );
}
