import { useEffect, useState } from "react";
import { useLang, useStored, recordGame } from "../../lib/core.js";
import { shuffledDeck, cardName } from "../../cards/deck.js";
import PlayingCard from "../../cards/PlayingCard.jsx";
import { GameFrame, PassDevice, playerNames } from "./shared.jsx";
const suits = ["spades", "hearts", "diamonds", "clubs"];
const fresh = () => {
  const deck = shuffledDeck();
  const hands = [deck.splice(0, 7), deck.splice(0, 7)];
  const at = deck.findIndex((c) => c.rank !== "8");
  const top = deck.splice(at, 1)[0];
  return {
    hands,
    deck,
    discard: [top],
    suit: top.suit,
    turn: 0,
    passed: 0,
    winner: null,
    drawn: false,
  };
};
export const canPlayEight = (c, g) =>
  c.rank === "8" || c.suit === g.suit || c.rank === g.discard.at(-1).rank;
export default function CrazyEights({ players }) {
  const { t, lang } = useLang();
  const [g, setG] = useStored("bgh2_eights", fresh);
  const [cpu, setCpu] = useStored("bgh2_eights_cpu", true);
  const [ready, setReady] = useState(null);
  const [eight, setEight] = useState(null);
  const names = cpu
    ? [t("Toi", "You"), t("Ordinateur", "Computer")]
    : playerNames(players, 2, t);
  function play(i, suit) {
    const card = g.hands[g.turn][i];
    if (!canPlayEight(card, g) || !suits.includes(suit || card.suit)) return;
    const hands = g.hands.map((h, k) =>
      k === g.turn ? h.filter((_, j) => j !== i) : h,
    );
    const winner = hands[g.turn].length ? null : g.turn;
    if (winner !== null)
      recordGame("eights", cpu ? (winner === 0 ? "win" : "loss") : "played");
    setG({
      ...g,
      hands,
      discard: [...g.discard, card],
      suit: card.rank === "8" ? suit : card.suit,
      turn: 1 - g.turn,
      drawn: false,
      passed: 0,
      winner,
    });
    setEight(null);
    if (!cpu) setReady(null);
  }
  function draw() {
    let deck = [...g.deck],
      discard = [...g.discard];
    if (!deck.length && discard.length > 1) {
      deck = shuffledDeck().filter((c) =>
        discard.slice(0, -1).some((d) => d.id === c.id),
      );
      discard = discard.slice(-1);
    }
    if (deck.length) {
      setG({
        ...g,
        deck: deck.slice(1),
        discard,
        hands: g.hands.map((h, i) => (i === g.turn ? [...h, deck[0]] : h)),
        drawn: true,
      });
    } else pass();
  }
  function pass() {
    const passed = g.passed + 1;
    setG({
      ...g,
      turn: 1 - g.turn,
      drawn: false,
      passed,
      winner: passed >= 2 ? "draw" : null,
    });
    if (passed >= 2) recordGame("eights", "draw");
    if (!cpu) setReady(null);
  }
  useEffect(() => {
    if (!cpu || g.turn !== 1 || g.winner !== null) return;
    const id = setTimeout(() => {
      const at = g.hands[1].findIndex((c) => canPlayEight(c, g));
      if (at >= 0) {
        const counts = suits.map(
          (s) => g.hands[1].filter((c) => c.suit === s).length,
        );
        play(at, suits[counts.indexOf(Math.max(...counts))]);
      } else if (!g.drawn) draw();
      else pass();
    }, 550);
    return () => clearTimeout(id);
  }, [g, cpu]);
  const privateHand = cpu ? g.hands[0] : g.hands[g.turn];
  return (
    <GameFrame
      title={t("Huit américain", "Crazy Eights")}
      onNew={() => {
        setG(fresh());
        setReady(null);
        setEight(null);
      }}
      rules={t(
        "Deux joueurs, 7 cartes chacun. Joue la même couleur ou valeur; un 8 change la couleur. Sans carte jouable, pige une carte puis joue ou passe. La défausse est remélangée au besoin. Deux passes sans pioche terminent la partie nulle. Vide ta main pour gagner.",
        "Two players, 7 cards each. Match suit or rank; an 8 changes the suit. With no playable card, draw one then play or pass. Recycle the discard pile when needed. Two passes with no stock end in a draw. Empty your hand to win.",
      )}
    >
      <button
        className="chipButton"
        onClick={() => {
          if (
            window.confirm(
              t("Changer de mode et recommencer?", "Change mode and restart?"),
            )
          ) {
            setCpu(!cpu);
            setG(fresh());
            setReady(null);
            setEight(null);
          }
        }}
      >
        {cpu
          ? t("Contre ordinateur", "Against computer")
          : t("Deux joueurs", "Two players")}
      </button>
      <p role="status">
        {g.winner !== null
          ? g.winner === "draw"
            ? t("Partie nulle", "Draw")
            : `${t("Gagnant", "Winner")}: ${names[g.winner]}`
          : `${t("Tour de", "Turn:")} ${names[g.turn]}`}
      </p>
      <div className="cardCenter">
        <PlayingCard card={g.discard.at(-1)} width={88} />
        <b>
          {suits.indexOf(g.suit) >= 0
            ? ["♠", "♥", "♦", "♣"][suits.indexOf(g.suit)]
            : ""}
        </b>
      </div>
      {!cpu && ready !== g.turn && g.winner === null ? (
        <PassDevice name={names[g.turn]} onReady={() => setReady(g.turn)} />
      ) : (
        <>
          <div className="cardHand">
            {privateHand.map((c, i) => (
              <button
                key={c.id}
                disabled={
                  g.winner !== null ||
                  (cpu && g.turn !== 0) ||
                  !canPlayEight(c, g)
                }
                aria-label={cardName(c, lang)}
                onClick={() => (c.rank === "8" ? setEight(i) : play(i))}
              >
                <PlayingCard card={c} width={64} />
              </button>
            ))}
          </div>
          {eight !== null && (
            <div className="actionRow">
              {suits.map((s, i) => (
                <button
                  className="chipButton"
                  key={s}
                  onClick={() => play(eight, s)}
                >
                  {["♠", "♥", "♦", "♣"][i]}
                </button>
              ))}
              <button className="chipButton" onClick={() => setEight(null)}>
                {t("Annuler", "Cancel")}
              </button>
            </div>
          )}
          <button
            className="bigAction"
            disabled={
              g.winner !== null ||
              (cpu && g.turn !== 0) ||
              (!g.drawn && g.hands[g.turn].some((c) => canPlayEight(c, g)))
            }
            onClick={() => (g.drawn ? pass() : draw())}
          >
            {g.drawn ? t("Passer", "Pass") : t("Piger", "Draw")}
          </button>
          <p>
            {t("Autre main", "Other hand")}:{" "}
            {g.hands[cpu ? 1 : 1 - g.turn].length}
          </p>
        </>
      )}
    </GameFrame>
  );
}
