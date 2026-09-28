// Blackjack (21) contre le croupier, avec jetons virtuels
import { useEffect, useRef, useState } from "react";
import { shuffledDeck } from "../cards/deck.js";
import { sfx, useLang, useStored, vibrate } from "../lib/core.js";
import { DealtCard } from "../screens/CardsScreen.jsx";

const CHIPS = [5, 25, 100, 500];

function cardPoints(card) {
  if (card.rank === "A") return 11;
  if (["K", "Q", "J"].includes(card.rank)) return 10;
  return Number(card.rank);
}

export function handValue(cards) {
  let total = cards.reduce((sum, c) => sum + cardPoints(c), 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

const isBlackjack = (cards) => cards.length === 2 && handValue(cards) === 21;

export default function Blackjack() {
  const { t } = useLang();
  const [chips, setChips] = useStored("bgh2_bj_chips", 1000);
  const [bet, setBet] = useState(0);
  const [phase, setPhase] = useState("bet"); // bet | player | dealer | done
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [message, setMessage] = useState("");
  const [outcome, setOutcome] = useState(null);
  const shoe = useRef(shuffledDeck({ decks: 6 }));
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function draw() {
    if (shoe.current.length < 40) shoe.current = shuffledDeck({ decks: 6 });
    return shoe.current.shift();
  }

  function later(fn, ms) {
    timers.current.push(setTimeout(fn, ms));
  }

  function addChip(value) {
    if (phase !== "bet" && phase !== "done") return;
    if (phase === "done") newRound();
    if (bet + value > chips) return;
    setBet((b) => b + value);
    sfx.tap();
  }

  function newRound() {
    setPlayer([]);
    setDealer([]);
    setMessage("");
    setOutcome(null);
    setPhase("bet");
  }

  function deal() {
    if (bet <= 0 || bet > chips) return;
    setChips((c) => c - bet);
    const p = [draw(), draw()];
    const d = [draw(), draw()];
    setPlayer(p);
    setDealer(d);
    setMessage("");
    setOutcome(null);
    sfx.deal();
    if (isBlackjack(p) || isBlackjack(d)) {
      setPhase("dealer");
      later(() => settle(p, d, bet), 900);
    } else {
      setPhase("player");
    }
  }

  function hit() {
    const p = [...player, draw()];
    setPlayer(p);
    sfx.deal();
    if (handValue(p) > 21) {
      setPhase("dealer");
      later(() => settle(p, dealer, bet), 700);
    } else if (handValue(p) === 21) {
      stand(p);
    }
  }

  function doubleDown() {
    if (chips < bet) return;
    setChips((c) => c - bet);
    const newBet = bet * 2;
    setBet(newBet);
    const p = [...player, draw()];
    setPlayer(p);
    sfx.deal();
    if (handValue(p) > 21) {
      setPhase("dealer");
      later(() => settle(p, dealer, newBet), 700);
    } else stand(p, newBet);
  }

  // Le croupier retourne sa carte et tire jusqu'à 17
  function stand(p = player, currentBet = bet) {
    setPhase("dealer");
    let d = [...dealer];
    const step = () => {
      if (handValue(d) < 17) {
        d = [...d, draw()];
        setDealer(d);
        sfx.deal();
        later(step, 650);
      } else {
        later(() => settle(p, d, currentBet), 400);
      }
    };
    later(step, 650);
  }

  function settle(p, d, currentBet) {
    const pv = handValue(p);
    const dv = handValue(d);
    let win = 0;
    let msg;
    let result;
    if (pv > 21) {
      msg = t("Tu dépasses 21 — perdu", "Bust — you lose");
      result = "lose";
    } else if (isBlackjack(p) && !isBlackjack(d)) {
      win = Math.floor(currentBet * 2.5);
      msg = t("BLACKJACK! 🎉", "BLACKJACK! 🎉");
      result = "win";
    } else if (isBlackjack(d) && !isBlackjack(p)) {
      msg = t("Blackjack du croupier", "Dealer blackjack");
      result = "lose";
    } else if (dv > 21) {
      win = currentBet * 2;
      msg = t("Le croupier dépasse — gagné!", "Dealer busts — you win!");
      result = "win";
    } else if (pv > dv) {
      win = currentBet * 2;
      msg = t("Gagné!", "You win!");
      result = "win";
    } else if (pv < dv) {
      msg = t("Le croupier gagne", "Dealer wins");
      result = "lose";
    } else {
      win = currentBet;
      msg = t("Égalité — mise remise", "Push — bet returned");
      result = "push";
    }
    setChips((c) => c + win);
    setMessage(msg);
    setOutcome(result);
    setPhase("done");
    if (result === "win") {
      sfx.win();
      vibrate([40, 40, 80]);
    } else if (result === "lose") sfx.lose();
    else sfx.tap();
  }

  const hideHole = phase === "player";
  const dealerShown = hideHole ? [dealer[0]] : dealer;
  const cardWidth = Math.max(player.length, dealer.length) > 4 ? 62 : 76;
  const broke = chips <= 0 && bet === 0 && phase !== "player" && phase !== "dealer";

  return (
    <div className="game blackjack">
      <div className="bjTable">
        <div className="bjSide">
          <span className="bjLabel">
            {t("Croupier", "Dealer")} {dealer.length > 0 && <b>{handValue(dealerShown.filter(Boolean))}</b>}
          </span>
          <div className="bjHand">
            {dealer.map((card, i) => (
              <DealtCard key={card.id + i} card={card} width={cardWidth} faceUp={!(hideHole && i === 1)} delay={i < 2 ? i * 160 + 80 : 0} />
            ))}
          </div>
        </div>

        <div className={`bjMessage ${outcome || ""}`}>{message || (phase === "bet" ? t("Place ta mise", "Place your bet") : " ")}</div>

        <div className="bjSide">
          <div className="bjHand">
            {player.map((card, i) => (
              <DealtCard key={card.id + i} card={card} width={cardWidth} delay={i < 2 ? i * 160 : 0} />
            ))}
          </div>
          <span className="bjLabel">
            {t("Toi", "You")} {player.length > 0 && <b>{handValue(player)}</b>}
          </span>
        </div>
      </div>

      <div className="bjBank">
        <span>
          💰 <strong>{chips}</strong>
        </span>
        <span>
          {t("Mise", "Bet")} <strong>{bet}</strong>
        </span>
      </div>

      {(phase === "bet" || phase === "done") && (
        <div className="chipRow">
          {CHIPS.map((v) => (
            <button key={v} className={`casinoChip c${v}`} onClick={() => addChip(v)} disabled={v + (phase === "done" ? 0 : bet) > chips}>
              {v}
            </button>
          ))}
          <button className="chipButton" onClick={() => { setBet(0); if (phase === "done") newRound(); }}>
            {t("Effacer", "Clear")}
          </button>
        </div>
      )}

      {phase === "player" && (
        <div className="actionRow">
          <button className="bigAction secondary" onClick={hit}>
            {t("Carte", "Hit")}
          </button>
          <button className="bigAction" onClick={() => stand()}>
            {t("Rester", "Stand")}
          </button>
          {player.length === 2 && chips >= bet && (
            <button className="bigAction gold" onClick={doubleDown}>
              ×2
            </button>
          )}
        </div>
      )}

      {phase === "bet" && (
        <button className="bigAction" onClick={deal} disabled={bet <= 0}>
          {t("Distribuer", "Deal")}
        </button>
      )}
      {phase === "done" && (
        <button
          className="bigAction"
          onClick={() => {
            const same = bet <= chips ? bet : 0;
            newRound();
            setBet(same);
          }}
        >
          {t("Nouvelle main", "Next hand")}
        </button>
      )}
      {broke && (
        <button className="chipButton accent center" onClick={() => setChips(1000)}>
          {t("Recharger 1000 jetons", "Refill 1000 chips")}
        </button>
      )}
    </div>
  );
}
