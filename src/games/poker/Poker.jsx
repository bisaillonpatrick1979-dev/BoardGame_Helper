// Poker Texas Hold'em contre des joueurs ordinateur
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import PlayingCard from "../../cards/PlayingCard.jsx";
import { recordGame, sfx, useLang, vibrate } from "../../lib/core.js";
import { HAND_NAMES, act, botDecision, legalActions, newTable, pot, startHand } from "./engine.js";

// Positions des adversaires autour de la table (en % de la table)
const SEATS = {
  1: [[50, 4]],
  2: [[24, 8], [76, 8]],
  3: [[13, 30], [50, 3], [87, 30]],
  4: [[11, 36], [30, 4], [70, 4], [89, 36]],
  5: [[10, 44], [19, 10], [50, 2], [81, 10], [90, 44]]
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

function Setup({ onStart }) {
  const { t } = useLang();
  const [bots, setBots] = useState(3);
  return (
    <div className="game yamsSetup">
      <div className="setupCard">
        <div className="setupIcon">♠️</div>
        <h2>Texas Hold'em</h2>
        <p className="muted">
          {t(
            "2 cartes à toi, 5 cartes communes. Fais la meilleure main de 5 cartes ou fais passer les autres! Les blindes doublent toutes les 8 mains.",
            "2 cards for you, 5 shared cards. Make the best 5-card hand or make everyone fold! Blinds double every 8 hands."
          )}
        </p>
        <div className="optionRow">
          <span>{t("Adversaires", "Opponents")}</span>
          <div className="stepper">
            <button onClick={() => setBots(Math.max(1, bots - 1))}>
              <Minus size={18} />
            </button>
            <strong>{bots}</strong>
            <button onClick={() => setBots(Math.min(5, bots + 1))}>
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="setupNames">1 000 {t("jetons chacun", "chips each")}</div>
        <button className="bigAction" onClick={() => onStart(bots)}>
          {t("S'asseoir à la table", "Take a seat")}
        </button>
      </div>
    </div>
  );
}

export default function Poker({ players }) {
  const { t, lang } = useLang();
  const [state, setState] = useState(null);
  const [raiseTo, setRaiseTo] = useState(0);
  const [raising, setRaising] = useState(false);

  const me = state?.players[0];
  const myTurn = state && state.stage !== "done" && state.stage !== "idle" && state.toAct === 0;
  const legal = myTurn ? legalActions(state) : null;
  const potSize = state ? pot(state) : 0;
  const opponents = state ? state.players.slice(1) : [];
  const seatPos = SEATS[opponents.length] || SEATS[3];
  const bustedOut = state && me.chips <= 0 && state.stage === "done";
  const champion = state && state.stage === "done" && state.players.slice(1).every((p) => p.chips <= 0);

  function start(bots) {
    const table = newTable({ playerName: players?.[0]?.name || t("Toi", "You"), bots });
    setState(startHand(table));
    sfx.flip();
  }

  // Tour des joueurs ordinateur
  useEffect(() => {
    if (!state || state.stage === "done" || state.toAct <= 0) return undefined;
    const timer = setTimeout(() => {
      setState((s) => (s && s.toAct > 0 && s.stage !== "done" ? act(s, botDecision(s)) : s));
      sfx.tap();
    }, 750);
    return () => clearTimeout(timer);
  }, [state]);

  // Fin de main : sons et statistiques
  useEffect(() => {
    if (!state || state.stage !== "done" || !state.winners) return;
    const mine = state.winners.find((w) => w.id === "me");
    if (mine) {
      sfx.win();
      vibrate([40, 40, 80]);
    } else if (!me.folded) sfx.lose();
    recordGame("poker", mine ? "win" : "loss");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.stage, state?.handNo]);

  // Montant de relance par défaut
  useEffect(() => {
    if (legal) {
      setRaiseTo(legal.minRaiseTo);
      setRaising(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTurn, state?.currentBet]);

  const winnerText = useMemo(() => {
    if (!state?.winners) return "";
    return state.winners
      .map((w) => {
        const p = state.players.find((x) => x.id === w.id);
        const who = w.id === "me" ? t("Tu gagnes", "You win") : `${p.name} ${t("gagne", "wins")}`;
        const hand = w.hand !== null && w.hand !== undefined ? ` — ${HAND_NAMES[lang][w.hand]}` : "";
        return `${who} ${w.amount}${hand}`;
      })
      .join(" • ");
  }, [state, lang, t]);

  if (!state) return <Setup onStart={start} />;

  const showCards = (p) => state.stage === "done" && state.winners?.some((w) => w.hand !== null) && p.inHand && !p.folded;

  function doAction(action) {
    setState((s) => act(s, action));
    if (action.type === "fold") sfx.bad();
    else sfx.deal();
  }

  const presets = legal
    ? [
        [t("Min", "Min"), legal.minRaiseTo],
        ["½ pot", state.currentBet + Math.round(potSize / 2 / 10) * 10],
        ["Pot", state.currentBet + Math.round(potSize / 10) * 10],
        [t("Tapis", "All-in"), legal.maxRaiseTo]
      ].map(([label, v]) => [label, Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, v))])
    : [];

  return (
    <div className="game poker">
      <div className="pokerInfo">
        <span>
          {t("Main", "Hand")} {state.handNo}
        </span>
        <span>
          {t("Blindes", "Blinds")} {state.smallBlind}/{state.bigBlind}
        </span>
        <button className="chipButton" onClick={() => setState(null)}>
          <RotateCcw size={14} /> {t("Table", "Table")}
        </button>
      </div>

      <div className="pokerTable">
        {opponents.map((p, k) => {
          const i = k + 1;
          const [x, y] = seatPos[k];
          const winner = state.winners?.some((w) => w.id === p.id);
          return (
            <div
              key={p.id}
              className={`pokerSeat ${state.toAct === i ? "acting" : ""} ${p.folded ? "folded" : ""} ${winner ? "winner" : ""} ${p.chips <= 0 && !p.inHand ? "out" : ""}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="seatCards">
                {p.hole.map((c, j) => (
                  <PlayingCard key={j} card={c} faceUp={showCards(p)} width={30} />
                ))}
              </div>
              <div className="seatName">
                {state.dealer === i && <b className="dealerBtn">D</b>}
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
              state.board[k] ? (
                <div key={`${state.handNo}-${k}`} className="dealIn" style={{ animationDelay: `${(k < 3 ? k : 0) * 90}ms` }}>
                  <PlayingCard card={state.board[k]} width={48} />
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

      <div className={`pokerMe ${myTurn ? "acting" : ""} ${state.winners?.some((w) => w.id === "me") ? "winner" : ""}`}>
        <div className="myCards">
          {me.hole.map((c, j) => (
            <div key={`${state.handNo}-${j}`} className="dealIn" style={{ animationDelay: `${j * 120}ms` }}>
              <PlayingCard card={c} width={64} faceUp={!me.folded || state.stage === "done"} />
            </div>
          ))}
        </div>
        <div className="myInfo">
          <strong>
            {state.dealer === 0 && <b className="dealerBtn">D</b>}
            {me.name}
          </strong>
          <span className="myChips">💰 {me.chips}</span>
          {me.bet > 0 && <span className="seatBet static">{t("Mise", "Bet")} {me.bet}</span>}
          {me.lastAction && !myTurn && <span className="muted">{actionLabel(me.lastAction, t)}</span>}
        </div>
      </div>

      {state.stage === "done" ? (
        <div className="pokerResult">
          <div className="resultLine">{winnerText}</div>
          {bustedOut ? (
            <button className="bigAction" onClick={() => setState(null)}>
              {t("Plus de jetons — nouvelle table", "Out of chips — new table")}
            </button>
          ) : champion ? (
            <button className="bigAction gold" onClick={() => setState(null)}>
              🏆 {t("Tu as gagné la table! Rejouer", "You won the table! Play again")}
            </button>
          ) : (
            <button className="bigAction" onClick={() => setState((s) => startHand(s))}>
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
            <input
              type="range"
              min={legal.minRaiseTo}
              max={legal.maxRaiseTo}
              step={10}
              value={raiseTo}
              onChange={(e) => setRaiseTo(Number(e.target.value))}
            />
            <div className="actionRow">
              <button className="bigAction secondary" onClick={() => setRaising(false)}>
                {t("Annuler", "Cancel")}
              </button>
              <button className="bigAction gold" onClick={() => doAction({ type: "raise", to: raiseTo })}>
                {raiseTo >= legal.maxRaiseTo ? t("Tapis", "All-in") : `${t("Relancer à", "Raise to")} ${raiseTo}`}
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
            {legal.maxRaiseTo > state.currentBet && legal.toCall < me.chips && (
              <button className="bigAction gold" onClick={() => setRaising(true)}>
                {t("Relancer", "Raise")}
              </button>
            )}
          </div>
        )
      ) : (
        <div className="pokerWaiting">{state.toAct > 0 ? `${state.players[state.toAct].name} ${t("réfléchit…", "is thinking…")}` : "…"}</div>
      )}
    </div>
  );
}
