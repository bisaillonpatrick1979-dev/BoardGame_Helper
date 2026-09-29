// Poker vidéo solo : « Jacks or Better » (table 9/6) ou « Deuces Wild » (les 2 sont des jokers)
import { useEffect, useRef, useState } from "react";
import PlayingCard from "../../cards/PlayingCard.jsx";
import { recordGame, sfx, useLang, useStored, vibrate } from "../../lib/core.js";
import { Confetti } from "../Hangman.jsx";
import { PAYTABLES, dealVideo, drawVideo, evaluateVideo, payout } from "./videoPoker.js";
import "./poker.css";

const START_CREDITS = 100;
const STEP_MS = 110; // délai entre deux cartes qui se retournent
// Grosses mains : confettis
const BIG = ["royal", "naturalRoyal", "fourDeuces", "wildRoyal", "fiveKind", "straightFlush", "fourKind"];

export default function VideoPoker() {
  const { t, lang } = useLang();
  const [game, setGame] = useStored("bgh2_videopoker_game", "jacks");
  const [credits, setCredits] = useStored("bgh2_videopoker_credits", START_CREDITS);
  const [bet, setBet] = useStored("bgh2_videopoker_bet", 5);
  const [hand, setHand] = useState(null); // état pur de videoPoker.js
  const [shown, setShown] = useState([true, true, true, true, true]); // cartes face visible
  const [busy, setBusy] = useState(false);
  const timers = useRef([]);
  // Largeur des cartes adaptée à l'écran (téléphone ≈ 64 px, tablette plus grand)
  const cardsRef = useRef(null);
  const [cardW, setCardW] = useState(64);
  useEffect(() => {
    const el = cardsRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => setCardW(Math.max(52, Math.min(104, Math.floor((el.clientWidth - 24) / 5)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const table = PAYTABLES[game] || PAYTABLES.jacks;
  const stage = hand?.stage || "idle";
  const holding = stage === "hold";
  // Main actuelle (indice pendant qu'on choisit ses cartes)
  const liveKey = hand && holding && !busy ? evaluateVideo(game, hand.hand) : null;
  const resultKey = stage === "result" && !busy ? hand.result : null;
  const activeBet = hand ? hand.bet : Math.min(bet, Math.max(1, credits));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Retourne les cartes indiquées une à une, puis appelle done()
  function reveal(indices, done) {
    timers.current.forEach(clearTimeout);
    setBusy(true);
    setShown((s) => s.map((v, i) => (indices.includes(i) ? false : v)));
    indices.forEach((idx, k) => {
      timers.current.push(
        setTimeout(() => {
          setShown((s) => s.map((v, i) => (i === idx ? true : v)));
          sfx.flip();
        }, 260 + k * STEP_MS)
      );
    });
    timers.current.push(
      setTimeout(() => {
        setBusy(false);
        done?.();
      }, 320 + indices.length * STEP_MS + 180)
    );
  }

  function deal() {
    if (busy) return;
    const b = Math.min(bet, credits);
    if (b < 1) return;
    setCredits((c) => c - b);
    const h = dealVideo(b);
    setHand(h);
    sfx.deal();
    reveal([0, 1, 2, 3, 4]);
  }

  function draw() {
    if (busy || !holding) return;
    const next = drawVideo(hand, game);
    const replaced = hand.held.map((keep, i) => (keep ? -1 : i)).filter((i) => i >= 0);
    setHand(next);
    if (replaced.length) sfx.deal();
    reveal(replaced, () => {
      if (next.win > 0) {
        setCredits((c) => c + next.win);
        if (BIG.includes(next.result)) {
          sfx.win();
          vibrate([40, 40, 120]);
        } else sfx.good();
      } else sfx.lose();
      recordGame("videopoker", next.win > next.bet ? "win" : next.win === next.bet ? "draw" : "loss", credits + next.win);
    });
  }

  function toggleHold(i) {
    if (!holding || busy) return;
    sfx.tap();
    setHand((h) => ({ ...h, held: h.held.map((v, k) => (k === i ? !v : v)) }));
  }

  function betOne() {
    if (holding || busy) return;
    sfx.tap();
    setBet((b) => (b >= 5 || b >= credits ? 1 : b + 1));
  }

  function betMax() {
    if (holding || busy) return;
    const b = Math.max(1, Math.min(5, credits));
    setBet(b);
    if (credits >= 1) {
      // « Mise max » donne tout de suite, comme sur une vraie machine
      const h = dealVideo(b);
      setCredits((c) => c - b);
      setHand(h);
      sfx.deal();
      reveal([0, 1, 2, 3, 4]);
    }
  }

  function switchGame(g) {
    if (holding || busy || g === game) return;
    setGame(g);
    setHand(null);
    setShown([true, true, true, true, true]);
  }

  const broke = !holding && !busy && credits <= 0;
  const rowName = (r) => (lang === "fr" ? r.fr : r.en);
  const resultRow = resultKey ? table.find((r) => r.key === resultKey) : null;

  let banner;
  if (stage === "idle") banner = <div className="vp-banner muted">{t("Choisis ta mise puis donne", "Pick your bet, then deal")}</div>;
  else if (busy) banner = <div className="vp-banner muted">…</div>;
  else if (holding)
    banner = (
      <div className="vp-banner muted">
        {liveKey ? `${rowName(table.find((r) => r.key === liveKey))} — ` : ""}
        {t("Touche les cartes à garder", "Tap the cards to hold")}
      </div>
    );
  else if (resultRow)
    banner = (
      <div className="vp-banner win">
        {rowName(resultRow)} — {t("gagné", "won")} {hand.win}!
      </div>
    );
  else banner = <div className="vp-banner">{t("Pas de chance… Rejoue!", "No luck… Play again!")}</div>;

  return (
    <div className="game vp">
      {resultRow && BIG.includes(resultKey) && <Confetti key={hand.hand.map((c) => c.id).join()} />}
      <div className="vp-top">
        <div className="segmented small">
          <button className={game === "jacks" ? "active" : ""} disabled={holding || busy} onClick={() => switchGame("jacks")}>
            Jacks or Better
          </button>
          <button className={game === "deuces" ? "active" : ""} disabled={holding || busy} onClick={() => switchGame("deuces")}>
            Deuces Wild
          </button>
        </div>
      </div>

      <div className="vp-machine">
        <table className="vp-pay">
          <tbody>
            {table.map((r) => (
              <tr key={r.key} className={resultKey === r.key ? "hit" : liveKey === r.key ? "hint" : ""}>
                <td>{rowName(r)}</td>
                {[1, 2, 3, 4, 5].map((b) => (
                  <td key={b} className={b === activeBet && resultKey !== r.key ? "col" : ""}>
                    {payout(game, r.key, b)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {banner}

        <div className="vp-cards" ref={cardsRef}>
          {[0, 1, 2, 3, 4].map((i) => {
            const card = hand?.hand[i];
            const held = hand?.held[i] && stage !== "idle";
            return (
              <div key={i} className={`vp-slot ${held ? "held" : ""}`}>
                <div key={card ? card.id : `vide-${i}`} className={card ? "dealIn" : ""} style={{ animationDelay: `${i * 60}ms` }}>
                  <PlayingCard card={card || null} faceUp={!!card && shown[i]} width={cardW} back="red" onClick={holding ? () => toggleHold(i) : undefined} />
                </div>
                {game === "deuces" && card?.rank === "2" && shown[i] && <span className="vp-wild">WILD</span>}
                <button className="vp-held" onClick={() => toggleHold(i)} disabled={!holding || busy}>
                  {held ? t("GARDÉE", "HELD") : holding ? t("garder", "hold") : " "}
                </button>
              </div>
            );
          })}
        </div>

        <div className="vp-meters">
          <div>
            {t("CRÉDITS", "CREDITS")}
            <b>{credits}</b>
          </div>
          <div>
            {t("MISE", "BET")}
            <b>{activeBet}</b>
          </div>
          <div>
            {t("GAIN", "WIN")}
            <b>{resultKey ? hand.win : 0}</b>
          </div>
        </div>
      </div>

      {broke ? (
        <button
          className="bigAction gold"
          onClick={() => {
            setCredits(START_CREDITS);
            setHand(null);
            sfx.good();
          }}
        >
          {t(`Plus de crédits — recharger ${START_CREDITS}`, `Out of credits — reload ${START_CREDITS}`)}
        </button>
      ) : (
        <div className="vp-controls">
          <button className="bigAction secondary" onClick={betOne} disabled={holding || busy}>
            {t("Mise +1", "Bet +1")}
          </button>
          <button className="bigAction secondary" onClick={betMax} disabled={holding || busy}>
            {t("Mise max", "Max bet")}
          </button>
          {holding ? (
            <button className="bigAction gold" onClick={draw} disabled={busy}>
              {t("Tirer", "Draw")}
            </button>
          ) : (
            <button className="bigAction" onClick={deal} disabled={busy}>
              {t("Donner", "Deal")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
