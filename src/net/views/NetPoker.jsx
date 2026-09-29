// Table de poker en réseau : je vois mes cartes, les autres voient les leurs
import { useEffect, useMemo, useState } from "react";
import PlayingCard from "../../cards/PlayingCard.jsx";
import { HAND_NAMES, evaluateOmaha } from "../../games/poker/engine.js";
import { recordGame, sfx, useLang, vibrate } from "../../lib/core.js";
import "../../games/poker/poker.css";

// Places des adversaires autour de la table (en % de la table), selon leur nombre
const SEATS = {
  1: [[50, 4]],
  2: [[24, 8], [76, 8]],
  3: [[13, 30], [50, 3], [87, 30]],
  4: [[11, 36], [30, 4], [70, 4], [89, 36]],
  5: [[10, 44], [19, 10], [50, 2], [81, 10], [90, 44]],
  6: [[9, 50], [12, 16], [35, 3], [65, 3], [88, 16], [91, 50]],
  7: [[8, 56], [9, 24], [27, 3], [50, 1], [73, 3], [91, 24], [92, 56]]
};

function actionLabel(action, t) {
  return (
    {
      fold: t("Passe", "Fold"),
      check: t("Parole", "Check"),
      call: t("Suit", "Call"),
      raise: t("Relance", "Raise"),
      allin: t("Tapis!", "All-in!"),
      SB: t("Petite blinde", "Small blind"),
      BB: t("Grosse blinde", "Big blind")
    }[action] || ""
  );
}

export default function NetPoker({ view, send, online, isHost, onNewTable }) {
  const { t, lang } = useLang();
  const [raising, setRaising] = useState(false);
  const [raiseTo, setRaiseTo] = useState(0);

  const s = view;
  const meIndex = s.me;
  const spectator = meIndex < 0;
  const me = spectator ? null : s.players[meIndex];
  const legal = s.legal;
  const myTurn = Boolean(legal);
  const omaha = s.variant === "omaha";
  const potSize = s.players.reduce((sum, p) => sum + (p.total || 0), 0);
  const onlineSet = new Set(online);

  // Les adversaires dans l'ordre de la table, en commençant par celui à ma gauche
  const n = s.players.length;
  const start = spectator ? 0 : meIndex + 1;
  const others = Array.from({ length: spectator ? n : n - 1 }, (_, k) => (start + k) % n);
  const seatPos = SEATS[others.length] || SEATS[7];

  useEffect(() => {
    if (legal) {
      setRaiseTo(legal.minRaiseTo);
      setRaising(false);
      vibrate(30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTurn, s.currentBet, s.handNo]);

  // Fin de main : son + statistiques
  useEffect(() => {
    if (s.stage !== "done" || !s.winners || spectator) return;
    const mine = s.winners.some((w) => w.id === me.id);
    if (mine) {
      sfx.win();
      vibrate([40, 40, 80]);
    } else if (!me.folded) sfx.lose();
    recordGame("poker-online", mine ? "win" : "loss");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.stage, s.handNo]);

  const winnerText = useMemo(() => {
    if (!s.winners) return "";
    return s.winners
      .map((w) => {
        const p = s.players.find((x) => x.id === w.id);
        const who = me && w.id === me.id ? t("Tu gagnes", "You win") : `${p?.name} ${t("gagne", "wins")}`;
        const hand = w.hand !== null && w.hand !== undefined ? ` — ${HAND_NAMES[lang][w.hand]}` : "";
        return `${who} ${w.amount}${hand}`;
      })
      .join(" • ");
  }, [s, lang, t, me]);

  const showCards = (p) => p.hole.some(Boolean);
  const inBest = (p, card) => !p?.best || !card || p.best.includes(card.id);
  const showdownWinner = omaha && s.stage === "done" ? s.players.find((p) => p.best && s.winners?.some((w) => w.id === p.id)) : null;
  const myOmahaHand = omaha && me && s.board.length >= 3 && !me.folded && me.hole.length === 4 && me.hole[0] ? HAND_NAMES[lang][evaluateOmaha(me.hole, s.board)[0]] : null;
  const withChips = s.players.filter((p) => p.chips > 0).length;
  const tableOver = s.stage === "done" && withChips < 2;

  function doAction(action) {
    send(action);
    setRaising(false);
    if (action.type === "fold") sfx.bad();
    else sfx.deal();
  }

  const presets = legal
    ? [
        [t("Min", "Min"), legal.minRaiseTo],
        ["½ pot", s.currentBet + Math.round(potSize / 2 / 10) * 10],
        ["Pot", s.limit === "pl" ? legal.maxRaiseTo : s.currentBet + Math.round(potSize / 10) * 10],
        [t("Tapis", "All-in"), legal.maxRaiseTo]
      ]
        .filter(([label]) => s.limit !== "pl" || label !== t("Tapis", "All-in"))
        .map(([label, v]) => [label, Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, v))])
    : [];

  const acting = s.toAct >= 0 ? s.players[s.toAct] : null;

  return (
    <div className={`game poker netPoker ${omaha ? "pk-omaha" : ""}`}>
      <div className="pokerInfo">
        <span>
          {omaha && <b className="pk-tag">Omaha{s.limit === "pl" ? " PL" : ""}</b>}
          {!omaha && s.limit === "pl" && <b className="pk-tag">PL</b>}
          {t("Main", "Hand")} {s.handNo}
        </span>
        <span>
          {t("Blindes", "Blinds")} {s.smallBlind}/{s.bigBlind}
        </span>
      </div>

      <div className="pokerTable">
        {others.map((i, k) => {
          const p = s.players[i];
          const [x, y] = seatPos[k] || [50, 50];
          const winner = s.winners?.some((w) => w.id === p.id);
          const away = !p.isBot && !onlineSet.has(p.id);
          return (
            <div
              key={p.id}
              className={`pokerSeat ${s.toAct === i ? "acting" : ""} ${p.folded ? "folded" : ""} ${winner ? "winner" : ""} ${p.chips <= 0 && !p.inHand ? "out" : ""}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="seatCards">
                {p.hole.map((c, j) => (
                  <PlayingCard key={j} card={c} faceUp={showCards(p)} width={omaha ? 25 : 28} className={omaha && p.best && !inBest(p, c) ? "pk-unused" : ""} />
                ))}
              </div>
              <div className="seatName">
                {s.dealer === i && <b className="dealerBtn">D</b>}
                {away && <span title={t("Déconnecté", "Offline")}>📵 </span>}
                {p.name}
              </div>
              <div className="seatChips">{p.chips}</div>
              {p.lastAction && <div className="seatAction">{actionLabel(p.lastAction, t)}</div>}
              {p.bet > 0 && <div className="seatBet">{p.bet}</div>}
            </div>
          );
        })}

        <div className="pokerCenter">
          <div className="pokerBoard">
            {Array.from({ length: 5 }).map((_, k) =>
              s.board[k] ? (
                <div key={`${s.handNo}-${k}`} className={`dealIn ${showdownWinner && !inBest(showdownWinner, s.board[k]) ? "dim" : ""}`} style={{ animationDelay: `${(k < 3 ? k : 0) * 90}ms` }}>
                  <PlayingCard card={s.board[k]} width={46} />
                </div>
              ) : (
                <div key={k} className="boardSlot" />
              )
            )}
          </div>
          <div className="pokerPot">
            Pot <strong>{potSize}</strong>
          </div>
        </div>
      </div>

      {me && (
        <div className={`pokerMe ${myTurn ? "acting" : ""} ${s.winners?.some((w) => w.id === me.id) ? "winner" : ""}`}>
          <div className="myCards">
            {me.hole.map((c, j) => (
              <div key={`${s.handNo}-${j}`} className={`dealIn ${omaha && me.best && s.stage === "done" && !inBest(me, c) ? "dim" : ""}`} style={{ animationDelay: `${j * 120}ms` }}>
                <PlayingCard card={c} width={omaha ? 50 : 64} faceUp={Boolean(c) && (!me.folded || s.stage === "done")} />
              </div>
            ))}
          </div>
          <div className="myInfo">
            <strong>
              {s.dealer === meIndex && <b className="dealerBtn">D</b>}
              {me.name}
            </strong>
            <span className="myChips">💰 {me.chips}</span>
            {me.bet > 0 && <span className="seatBet static">{t("Mise", "Bet")} {me.bet}</span>}
            {me.lastAction && !myTurn && <span className="muted">{actionLabel(me.lastAction, t)}</span>}
            {myOmahaHand && <span className="pk-handName">{myOmahaHand}</span>}
          </div>
        </div>
      )}

      {s.stage === "done" ? (
        <div className="pokerResult">
          <div className="resultLine">{winnerText}</div>
          {tableOver ? (
            isHost ? (
              <button className="bigAction gold" onClick={onNewTable}>
                🏆 {t("Table terminée — nouvelle table", "Table over — new table")}
              </button>
            ) : (
              <div className="pokerWaiting">🏆 {t("Table terminée! L'hôte peut relancer.", "Table over! The host can restart.")}</div>
            )
          ) : spectator ? (
            <div className="pokerWaiting">{t("Main terminée", "Hand over")}</div>
          ) : (
            <button className="bigAction" onClick={() => send({ type: "next" })}>
              {t("Main suivante", "Next hand")}
            </button>
          )}
        </div>
      ) : myTurn ? (
        raising ? (
          <div className="raisePanel">
            <div className="raisePresets">
              {presets.map(([label, v]) => (
                <button key={label} className={raiseTo === v ? "active" : ""} onClick={() => setRaiseTo(v)}>
                  {label}
                </button>
              ))}
            </div>
            <input type="range" min={legal.minRaiseTo} max={legal.maxRaiseTo} step={10} value={raiseTo} onChange={(e) => setRaiseTo(Number(e.target.value))} />
            <div className="actionRow">
              <button className="bigAction secondary" onClick={() => setRaising(false)}>
                {t("Annuler", "Cancel")}
              </button>
              <button className="bigAction gold" onClick={() => doAction({ type: "raise", to: raiseTo })}>
                {raiseTo >= legal.maxRaiseTo && legal.maxRaiseTo === me.bet + me.chips ? t("Tapis", "All-in") : `${t("Relancer à", "Raise to")} ${raiseTo}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="actionRow">
            <button className="bigAction secondary" onClick={() => doAction({ type: "fold" })}>
              {t("Passer", "Fold")}
            </button>
            <button className="bigAction" onClick={() => doAction({ type: legal.canCheck ? "check" : "call" })}>
              {legal.canCheck ? t("Parole", "Check") : `${t("Suivre", "Call")} ${legal.toCall}`}
            </button>
            {legal.maxRaiseTo > s.currentBet && legal.toCall < me.chips && (
              <button className="bigAction gold" onClick={() => setRaising(true)}>
                {t("Relancer", "Raise")}
              </button>
            )}
          </div>
        )
      ) : (
        <div className="pokerWaiting">
          {acting
            ? !acting.isBot && !onlineSet.has(acting.id)
              ? `📵 ${acting.name} ${t("est déconnecté — il passera son tour dans quelques secondes", "is offline — auto-play in a few seconds")}`
              : `${acting.name} ${t("réfléchit…", "is thinking…")}`
            : "…"}
        </div>
      )}
    </div>
  );
}
