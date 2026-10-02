// Plus haut ou plus bas : devine si la prochaine carte sera plus forte
import { useState } from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { cardName, orderValue, shuffledDeck } from "../cards/deck.js";
import { sfx, useLang, useStored, vibrate, recordGame } from "../lib/core.js";
import { DealtCard, DeckPile } from "../screens/CardsScreen.jsx";

export default function HigherLower() {
  const { t, lang } = useLang();
  const [initial] = useStored("bgh2_save_higherlower_initial", () =>
    shuffledDeck(),
  );
  const [deck, setDeck] = useStored("bgh2_save_higherlower_deck", () =>
    initial.slice(1),
  );
  const [current, setCurrent] = useStored(
    "bgh2_save_higherlower_current",
    () => initial[0],
  );
  const [streak, setStreak] = useStored("bgh2_save_higherlower_streak", 0);
  const [best, setBest] = useStored("bgh2_hl_best", 0);
  const [state, setState] = useStored("bgh2_save_higherlower_state", "idle"); // idle | ok | tie | lost
  const [previous, setPrevious] = useStored(
    "bgh2_save_higherlower_previous",
    null,
  );

  function guess(dir) {
    if (state === "lost") return;
    let pool = deck;
    if (!pool.length) pool = shuffledDeck();
    const [next, ...rest] = pool;
    setDeck(rest);
    setPrevious(current);
    setCurrent(next);
    const a = orderValue(current);
    const b = orderValue(next);
    sfx.deal();
    if (a === b) {
      setState("tie");
      return;
    }
    const right = dir === "up" ? b > a : b < a;
    if (right) {
      const s = streak + 1;
      setStreak(s);
      if (s > best) setBest(s);
      setState("ok");
      setTimeout(sfx.good, 300);
    } else {
      setState("lost");
      recordGame("higherlower", "loss", streak);
      setTimeout(sfx.lose, 300);
      vibrate([120, 60, 120]);
    }
  }

  function restart() {
    const fresh = shuffledDeck();
    setCurrent(fresh[0]);
    setDeck(fresh.slice(1));
    setPrevious(null);
    setStreak(0);
    setState("idle");
  }

  const message = {
    idle: t("La prochaine carte sera…", "The next card will be…"),
    ok: t("Oui! Continue…", "Yes! Keep going…"),
    tie: t("Égalité — on continue", "Same value — keep going"),
    lost: t("Raté!", "Missed!"),
  }[state];

  return (
    <div className="game hilo">
      <div className="scoreStrip">
        <span>
          🔥 {t("Série", "Streak")} · {streak}
        </span>
        <span>
          🏆 {t("Record", "Best")} · {best}
        </span>
      </div>

      <div className="feltTable hiloTable">
        <div className="hiloRow">
          <DeckPile count={deck.length} width={70} />
          {current && <DealtCard key={current.id} card={current} width={150} />}
          <div className="hiloPrev">
            {previous && (
              <DealtCard
                key={`p-${previous.id}`}
                card={previous}
                width={60}
                className="dim"
              />
            )}
          </div>
        </div>
        <div className="drawnName">
          {current ? cardName(current, lang) : ""}
        </div>
        <div
          className={`gameStatus ${state === "lost" ? "done bad" : state === "ok" ? "done" : ""}`}
        >
          {message}
        </div>
      </div>

      {state === "lost" ? (
        <button className="bigAction" onClick={restart}>
          <RotateCcw size={20} />
          {t("Rejouer", "Play again")}
        </button>
      ) : (
        <div className="actionRow">
          <button className="bigAction secondary" onClick={() => guess("down")}>
            <ArrowDown size={22} /> {t("Plus bas", "Lower")}
          </button>
          <button className="bigAction" onClick={() => guess("up")}>
            <ArrowUp size={22} /> {t("Plus haut", "Higher")}
          </button>
        </div>
      )}
    </div>
  );
}
