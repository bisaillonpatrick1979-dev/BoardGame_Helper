// Poker 5 cartes fermé contre 1 à 5 joueurs ordinateur :
// 1er tour de mise, échange de 0 à 3 cartes (4 en gardant un as), 2e tour de mise, abattage.
import { useEffect, useMemo, useState, useRef } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import PlayingCard from "../../cards/PlayingCard.jsx";
import {
  recordGame,
  sfx,
  useLang,
  useStored,
  vibrate,
} from "../../lib/core.js";
import {
  HAND_NAMES,
  act,
  botDecision,
  evaluate,
  legalActions,
  pot,
  startHand,
} from "./engine.js";
import { botDiscard, canDiscard, drawCards, newDrawTable } from "./draw.js";
import "./poker.css";

// Positions des adversaires autour de la table (en % de la table)
const SEATS = {
  1: [[50, 5]],
  2: [
    [26, 8],
    [74, 8],
  ],
  3: [
    [14, 30],
    [50, 4],
    [86, 30],
  ],
  4: [
    [12, 38],
    [30, 5],
    [70, 5],
    [88, 38],
  ],
  5: [
    [11, 46],
    [20, 11],
    [50, 3],
    [80, 11],
    [89, 46],
  ],
};

function actionLabel(action, t) {
  if (action?.startsWith("draw")) {
    const n = Number(action.slice(4));
    return n === 0 ? t("Servi", "Stands pat") : t(`Prend ${n}`, `Draws ${n}`);
  }
  return (
    {
      fold: t("Passe", "Fold"),
      check: t("Parole", "Check"),
      call: t("Suit", "Call"),
      raise: t("Relance", "Raise"),
      allin: t("Tapis!", "All-in!"),
      SB: t("Petite blinde", "Small blind"),
      BB: t("Grosse blinde", "Big blind"),
    }[action] || ""
  );
}

function Setup({ onStart }) {
  const { t } = useLang();
  const [bots, setBots] = useStored("bgh2_drawpoker_bots", 3);
  const [limit, setLimit] = useStored("bgh2_drawpoker_limit", "nl");
  return (
    <div className="game yamsSetup">
      <div className="setupCard pk-setup">
        <div className="setupIcon">🃏</div>
        <h2>{t("Poker 5 cartes fermé", "Five-card draw")}</h2>
        <p className="muted">
          {t(
            "5 cartes cachées. Mise, échange jusqu'à 3 cartes (4 si tu gardes un as), mise encore, puis abattage!",
            "5 hidden cards. Bet, swap up to 3 cards (4 if you keep an ace), bet again, then showdown!",
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
        <div className="segmented small">
          <button
            className={limit === "nl" ? "active" : ""}
            onClick={() => setLimit("nl")}
          >
            {t("Sans limite", "No-limit")}
          </button>
          <button
            className={limit === "pl" ? "active" : ""}
            onClick={() => setLimit("pl")}
          >
            Pot-limit
          </button>
        </div>
        <div className="setupNames">
          1 000 {t("jetons chacun", "chips each")}
        </div>
        <button className="bigAction" onClick={() => onStart(bots, limit)}>
          {t("S'asseoir à la table", "Take a seat")}
        </button>
      </div>
    </div>
  );
}

export default function DrawPoker({ players }) {
  const { t, lang } = useLang();
  const recorded = useRef(null);
  const [state, setState] = useStored("bgh2_save_poker_drawpoker_state", null);
  const [raiseTo, setRaiseTo] = useState(0);
  const [raising, setRaising] = useState(false);
  const [toss, setToss] = useStored("bgh2_save_poker_drawpoker_toss", []); // indices des cartes que je veux jeter

  const me = state?.players[0];
  const betting =
    state && (state.stage === "predraw" || state.stage === "postdraw");
  const myTurn = state && betting && state.toAct === 0;
  const myDraw = state && state.stage === "draw" && state.toAct === 0;
  const legal = myTurn ? legalActions(state) : null;
  const potSize = state ? pot(state) : 0;
  const opponents = state ? state.players.slice(1) : [];
  const seatPos = SEATS[opponents.length] || SEATS[3];
  const bustedOut = state && me.chips <= 0 && state.stage === "done";
  const champion =
    state &&
    state.stage === "done" &&
    state.players.slice(1).every((p) => p.chips <= 0);

  function start(bots, limit) {
    recorded.current = null;
    const table = newDrawTable({
      playerName: players?.[0]?.name || t("Toi", "You"),
      bots,
      limit,
    });
    setState(startHand(table));
    setToss([]);
    sfx.flip();
  }

  // Tour des joueurs ordinateur (mises et échanges)
  useEffect(() => {
    if (!state || state.stage === "done" || state.toAct <= 0) return undefined;
    const timer = setTimeout(
      () => {
        setState((s) => {
          if (!s || s.toAct <= 0 || s.stage === "done") return s;
          if (s.stage === "draw")
            return drawCards(s, botDiscard(s.players[s.toAct].hole));
          return act(s, botDecision(s));
        });
        if (state.stage === "draw") sfx.deal();
        else sfx.tap();
      },
      state.stage === "draw" ? 650 : 750,
    );
    return () => clearTimeout(timer);
  }, [state]);

  // Fin de main : sons et statistiques
  useEffect(() => {
    if (
      !state ||
      state.stage !== "done" ||
      !state.winners ||
      state.statsRecordedHand === state.handNo ||
      recorded.current === state.handNo
    )
      return;
    recorded.current = state.handNo;
    setState((s) => ({ ...s, statsRecordedHand: s.handNo }));
    const mine = state.winners.find((w) => w.id === "me");
    if (mine) {
      sfx.win();
      vibrate([40, 40, 80]);
    } else if (!me.folded) sfx.lose();
    recordGame("drawpoker", mine ? "win" : "loss");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.stage, state?.handNo]);

  // Montant de relance par défaut
  useEffect(() => {
    if (legal) {
      setRaiseTo(legal.minRaiseTo);
      setRaising(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTurn, state?.currentBet, state?.stage]);

  // Nouvelle main : on vide la sélection
  useEffect(() => setToss([]), [state?.handNo]);

  const winnerText = useMemo(() => {
    if (!state?.winners) return "";
    return state.winners
      .map((w) => {
        const p = state.players.find((x) => x.id === w.id);
        const who =
          w.id === "me"
            ? t("Tu gagnes", "You win")
            : `${p.name} ${t("gagne", "wins")}`;
        const hand =
          w.hand !== null && w.hand !== undefined
            ? ` — ${HAND_NAMES[lang][w.hand]}`
            : "";
        return `${who} ${w.amount}${hand}`;
      })
      .join(" • ");
  }, [state, lang, t]);

  if (!state) return <Setup onStart={start} />;

  const showCards = (p) =>
    state.stage === "done" &&
    state.winners?.some((w) => w.hand !== null) &&
    p.inHand &&
    !p.folded;
  const myHandName =
    me.hole.length === 5 && !me.folded
      ? HAND_NAMES[lang][evaluate(me.hole)[0]]
      : "";
  const tossOk = canDiscard(me.hole, toss);
  const stageLabel =
    {
      predraw: t("1er tour de mise", "1st betting round"),
      draw: t("Échange", "Draw"),
      postdraw: t("2e tour de mise", "2nd betting round"),
      done: t("Abattage", "Showdown"),
    }[state.stage] || "";

  function doAction(action) {
    setState((s) => act(s, action));
    if (action.type === "fold") sfx.bad();
    else sfx.deal();
  }

  function toggleToss(i) {
    if (!myDraw) return;
    sfx.tap();
    setToss((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]));
  }

  function confirmDraw() {
    if (!myDraw || !tossOk) return;
    setState((s) => drawCards(s, toss));
    setToss([]);
    if (toss.length) sfx.deal();
    else sfx.tap();
  }

  const presets = legal
    ? [
        [t("Min", "Min"), legal.minRaiseTo],
        ["½ pot", state.currentBet + Math.round(potSize / 2 / 10) * 10],
        [
          "Pot",
          state.limit === "pl"
            ? legal.maxRaiseTo
            : state.currentBet + Math.round(potSize / 10) * 10,
        ],
        [t("Tapis", "All-in"), legal.maxRaiseTo],
      ]
        .filter(
          ([label]) => state.limit !== "pl" || label !== t("Tapis", "All-in"),
        )
        .map(([label, v]) => [
          label,
          Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, v)),
        ])
    : [];

  let controls;
  if (state.stage === "done") {
    controls = (
      <div className="pokerResult">
        <div className="resultLine">{winnerText}</div>
        {bustedOut ? (
          <button className="bigAction" onClick={() => setState(null)}>
            {t("Plus de jetons — nouvelle table", "Out of chips — new table")}
          </button>
        ) : champion ? (
          <button className="bigAction gold" onClick={() => setState(null)}>
            🏆{" "}
            {t(
              "Tu as gagné la table! Rejouer",
              "You won the table! Play again",
            )}
          </button>
        ) : (
          <button
            className="bigAction"
            onClick={() => setState((s) => startHand(s))}
          >
            {t("Main suivante", "Next hand")}
          </button>
        )}
      </div>
    );
  } else if (myDraw) {
    controls = (
      <div className="actionRow">
        <button
          className="bigAction secondary"
          onClick={() => setToss([])}
          disabled={!toss.length}
        >
          {t("Tout garder", "Keep all")}
        </button>
        <button
          className="bigAction gold"
          onClick={confirmDraw}
          disabled={!tossOk}
        >
          {toss.length
            ? t(`Échanger ${toss.length}`, `Draw ${toss.length}`)
            : t("Servi", "Stand pat")}
        </button>
      </div>
    );
  } else if (myTurn) {
    controls = raising ? (
      <div className="raisePanel">
        <div className="raisePresets">
          {presets.map(([label, v]) => (
            <button
              key={label}
              className={raiseTo === v ? "active" : ""}
              onClick={() => setRaiseTo(v)}
            >
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
          <button
            className="bigAction secondary"
            onClick={() => setRaising(false)}
          >
            {t("Annuler", "Cancel")}
          </button>
          <button
            className="bigAction gold"
            onClick={() => doAction({ type: "raise", to: raiseTo })}
          >
            {raiseTo >= legal.maxRaiseTo &&
            legal.maxRaiseTo === me.bet + me.chips
              ? t("Tapis", "All-in")
              : `${t("Relancer à", "Raise to")} ${raiseTo}`}
          </button>
        </div>
      </div>
    ) : (
      <div className="actionRow">
        <button
          className="bigAction secondary"
          onClick={() => doAction({ type: "fold" })}
        >
          {t("Passer", "Fold")}
        </button>
        <button
          className="bigAction"
          onClick={() => doAction({ type: legal.canCheck ? "check" : "call" })}
        >
          {legal.canCheck
            ? t("Parole", "Check")
            : `${t("Suivre", "Call")} ${legal.toCall}`}
        </button>
        {legal.maxRaiseTo > state.currentBet && legal.toCall < me.chips && (
          <button className="bigAction gold" onClick={() => setRaising(true)}>
            {t("Relancer", "Raise")}
          </button>
        )}
      </div>
    );
  } else {
    controls = (
      <div className="pokerWaiting">
        {state.toAct > 0
          ? state.stage === "draw"
            ? `${state.players[state.toAct].name} ${t("échange…", "is drawing…")}`
            : `${state.players[state.toAct].name} ${t("réfléchit…", "is thinking…")}`
          : "…"}
      </div>
    );
  }

  return (
    <div className="game poker dp">
      <div className="pokerInfo">
        <span>
          {state.limit === "pl" && <b className="pk-tag">PL</b>}
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
                  <PlayingCard
                    key={c.id}
                    card={c}
                    faceUp={showCards(p)}
                    width={26}
                  />
                ))}
              </div>
              <div className="seatName">
                {state.dealer === i && <b className="dealerBtn">D</b>}
                {p.name}
              </div>
              <div className="seatChips">{p.chips}</div>
              {showCards(p) ? (
                <div className="seatAction">
                  {HAND_NAMES[lang][evaluate(p.hole)[0]]}
                </div>
              ) : (
                p.lastAction && (
                  <div className="seatAction">
                    {actionLabel(p.lastAction, t)}
                  </div>
                )
              )}
              {p.bet > 0 && <div className="seatBet">{p.bet}</div>}
            </div>
          );
        })}

        <div className="pokerCenter dp-center">
          <div className="dp-stage">{stageLabel}</div>
          <div className="dp-deck">
            <PlayingCard card={null} faceUp={false} width={34} />
            <div className="pokerPot">
              Pot <strong>{potSize}</strong>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`dp-me ${myTurn || myDraw ? "acting" : ""} ${state.winners?.some((w) => w.id === "me") ? "winner" : ""}`}
      >
        <div className="dp-meHead">
          <strong>
            {state.dealer === 0 && <b className="dealerBtn">D</b>}
            {me.name}
          </strong>
          <span className="myChips">💰 {me.chips}</span>
          {me.bet > 0 && (
            <span className="seatBet static">
              {t("Mise", "Bet")} {me.bet}
            </span>
          )}
          {me.lastAction && !myTurn && !myDraw && (
            <span className="muted">{actionLabel(me.lastAction, t)}</span>
          )}
          {myHandName && <span className="pk-handName">{myHandName}</span>}
        </div>
        <div className="dp-cards">
          {me.hole.map((c, j) => {
            const tossed = toss.includes(j);
            return (
              <div
                key={c.id}
                className={`dp-card dealIn ${myDraw ? (tossed ? "toss" : "keep") : ""}`}
                style={{
                  animationDelay: `${state.stage === "draw" || state.stage === "postdraw" ? 0 : j * 90}ms`,
                }}
              >
                <PlayingCard
                  card={c}
                  width={60}
                  faceUp={!me.folded || state.stage === "done"}
                  onClick={myDraw ? () => toggleToss(j) : undefined}
                />
                {tossed && <span className="dp-mark">✕</span>}
              </div>
            );
          })}
        </div>
        {myDraw && (
          <div className={`dp-hint ${tossOk ? "" : "bad"}`}>
            {tossOk
              ? t(
                  "Touche pour jeter · max 3 (4 avec un as)",
                  "Tap to discard · max 3 (4 with an ace)",
                )
              : t(
                  "Trop de cartes : max 3 (4 si tu gardes un as)",
                  "Too many: max 3 (4 if you keep an ace)",
                )}
          </div>
        )}
      </div>

      {controls}
    </div>
  );
}
