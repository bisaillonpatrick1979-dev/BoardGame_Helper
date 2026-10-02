import { useEffect, useState } from "react";
import { useLang, useStored, shuffle, recordGame } from "../../lib/core.js";
import { GameFrame, PassDevice, playerNames } from "./shared.jsx";
const tiles = () =>
  Array.from({ length: 7 }, (_, a) =>
    Array.from({ length: 7 - a }, (_, i) => [a, a + i]),
  ).flat();
const fresh = () => {
  const d = shuffle(tiles());
  return {
    hands: [d.splice(0, 7), d.splice(0, 7)],
    stock: d,
    chain: [],
    turn: 0,
    passed: 0,
    result: null,
  };
};
export function dominoFit(tile, chain, side) {
  if (!chain.length) return [...tile];
  const edge = side === "left" ? chain[0][0] : chain.at(-1)[1];
  if (!tile.includes(edge)) return null;
  return side === "left"
    ? tile[1] === edge
      ? [...tile]
      : [tile[1], tile[0]]
    : tile[0] === edge
      ? [...tile]
      : [tile[1], tile[0]];
}
export default function Dominos({ players }) {
  const { t } = useLang();
  const [g, setG] = useStored("bgh2_dominos", fresh);
  const [cpu, setCpu] = useStored("bgh2_dominos_cpu", true);
  const [side, setSide] = useState("right");
  const [ready, setReady] = useState(cpu ? 0 : null);
  const names = cpu
    ? [t("Toi", "You"), t("Ordinateur", "Computer")]
    : playerNames(players, 2, t);
  const canPlay = (hand) =>
    hand.some(
      (tile) =>
        dominoFit(tile, g.chain, "left") || dominoFit(tile, g.chain, "right"),
    );
  function advance(next) {
    let result = null;
    if (!next.hands[next.turn].length) result = { winners: [next.turn] };
    else if (next.passed >= 2) {
      const sums = next.hands.map((h) => h.flat().reduce((a, b) => a + b, 0));
      result = {
        winners: sums
          .map((v, i) => (v === Math.min(...sums) ? i : null))
          .filter((v) => v !== null),
      };
    }
    if (result)
      recordGame(
        "dominos",
        cpu
          ? result.winners.length > 1
            ? "draw"
            : result.winners[0] === 0
              ? "win"
              : "loss"
          : "played",
      );
    setG({ ...next, turn: 1 - next.turn, result });
    if (!cpu) setReady(null);
  }
  function play(i, s = side) {
    const tile = dominoFit(g.hands[g.turn][i], g.chain, s);
    if (!tile) return;
    advance({
      ...g,
      hands: g.hands.map((h, k) =>
        k === g.turn ? h.filter((_, j) => j !== i) : h,
      ),
      chain: s === "left" ? [tile, ...g.chain] : [...g.chain, tile],
      passed: 0,
    });
  }
  function draw() {
    if (canPlay(g.hands[g.turn])) return;
    if (g.stock.length)
      setG({
        ...g,
        hands: g.hands.map((h, i) => (i === g.turn ? [...h, g.stock[0]] : h)),
        stock: g.stock.slice(1),
      });
    else advance({ ...g, passed: g.passed + 1 });
  }
  useEffect(() => {
    if (!cpu || g.turn !== 1 || g.result) return;
    const id = setTimeout(() => {
      const hand = g.hands[1];
      for (let i = 0; i < hand.length; i++)
        for (const s of ["left", "right"])
          if (dominoFit(hand[i], g.chain, s)) {
            play(i, s);
            return;
          }
      draw();
    }, 500);
    return () => clearTimeout(id);
  }, [g, cpu]);
  return (
    <GameFrame
      title={t("Dominos", "Dominoes")}
      onNew={() => {
        setG(fresh());
        setReady(cpu ? 0 : null);
      }}
      rules={t(
        "Double-six, 7 dominos chacun. Pose une extrémité identique à gauche ou à droite. Si aucun domino ne convient, pige jusqu’à pouvoir jouer. Quand la pioche est vide, passe. Une main vide gagne; deux passes consécutives donnent la victoire au plus petit total de points.",
        "Double-six, 7 tiles each. Match the left or right end. With no legal tile, draw until you can play. Pass only when the stock is empty. Empty your hand to win; after two passes, the lowest pip total wins.",
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
          }
        }}
      >
        {cpu
          ? t("Contre ordinateur", "Against computer")
          : t("Deux joueurs", "Two players")}
      </button>
      <p role="status">
        {g.result
          ? `${t("Gagnant", "Winner")}: ${g.result.winners.map((i) => names[i]).join(", ")}`
          : `${names[g.turn]} · ${g.stock.length} ${t("dans la pioche", "in stock")}`}
      </p>
      <div className="dominoChain">
        {g.chain.map((tile, i) => (
          <span key={i}>
            {tile[0]} | {tile[1]}
          </span>
        ))}
      </div>
      {!cpu && ready !== g.turn && !g.result ? (
        <PassDevice name={names[g.turn]} onReady={() => setReady(g.turn)} />
      ) : (
        <>
          <div className="segmented">
            <button
              className={side === "left" ? "active" : ""}
              onClick={() => setSide("left")}
            >
              {t("Gauche", "Left")}
            </button>
            <button
              className={side === "right" ? "active" : ""}
              onClick={() => setSide("right")}
            >
              {t("Droite", "Right")}
            </button>
          </div>
          <div className="diceButtons">
            {g.hands[cpu ? 0 : g.turn].map((tile, i) => (
              <button
                key={i}
                disabled={
                  !!g.result ||
                  (cpu && g.turn !== 0) ||
                  !dominoFit(tile, g.chain, side)
                }
                onClick={() => play(i)}
              >
                {tile[0]} | {tile[1]}
              </button>
            ))}
          </div>
          <button
            className="bigAction"
            disabled={
              !!g.result || (cpu && g.turn !== 0) || canPlay(g.hands[g.turn])
            }
            onClick={draw}
          >
            {g.stock.length ? t("Piger", "Draw") : t("Passer", "Pass")}
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
