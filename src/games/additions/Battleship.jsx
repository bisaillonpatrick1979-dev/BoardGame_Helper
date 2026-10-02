import { useEffect } from "react";
import { useLang, useStored, randomInt, recordGame } from "../../lib/core.js";
import { newNaval, fireNaval, navalView } from "./navalRules.js";
import { GameFrame } from "./shared.jsx";
import NetNaval from "../../net/views/NetNaval.jsx";
export default function Battleship() {
  const { t } = useLang();
  const [g, setG] = useStored("bgh2_naval", () => newNaval(["you", "cpu"]));
  function shoot(cell) {
    const next = fireNaval(g, g.turn, cell);
    if (!next) return;
    if (next.winner !== null)
      recordGame("naval", next.winner === 0 ? "win" : "loss");
    setG(next);
  }
  useEffect(() => {
    if (g.turn !== 1 || g.winner !== null) return;
    const timer = setTimeout(() => {
      const candidates = g.shots[1]
        .map((v, i) => (v === null ? i : null))
        .filter((v) => v !== null);
      const neighbors = [];
      g.shots[1].forEach((v, i) => {
        if (!v) return;
        for (const k of [
          i - 8,
          i + 8,
          i % 8 > 0 ? i - 1 : -1,
          i % 8 < 7 ? i + 1 : -1,
        ])
          if (k >= 0 && k < 64 && g.shots[1][k] === null) neighbors.push(k);
      });
      const pool = neighbors.length ? neighbors : candidates;
      shoot(pool[randomInt(pool.length)]);
    }, 500);
    return () => clearTimeout(timer);
  }, [g]);
  return (
    <GameFrame
      title={t("Bataille navale", "Battleship")}
      onNew={() => setG(newNaval(["you", "cpu"]))}
      rules={t(
        "Grille 8 × 8, cinq navires de 4, 3, 3, 2 et 2 cases placés au hasard. Chaque joueur tire une fois par tour, même après une touche. Coule les cinq navires pour gagner. Le mode deux téléphones se trouve dans Jouer ensemble.",
        "8 × 8 grid, five randomly placed ships of 4, 3, 3, 2 and 2 cells. One shot per turn, even after a hit. Sink all five ships to win. Two-phone mode is in Play together.",
      )}
    >
      <NetNaval
        view={{
          ...navalView(g, 0),
          names: [t("Toi", "You"), t("Ordinateur", "Computer")],
        }}
        send={(a) => shoot(a.cell)}
      />
    </GameFrame>
  );
}
