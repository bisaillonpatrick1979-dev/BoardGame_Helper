// Ordre de jeu : qui commence (tirage animé) et à qui le tour
import { useState } from "react";
import { ChevronRight, Shuffle } from "lucide-react";
import { randomInt, sfx, shuffle, useLang, useStored, vibrate } from "../lib/core.js";

export default function TurnOrder({ players }) {
  const { t } = useLang();
  const names = players.map((p) => p.name);
  const [order, setOrder] = useStored("bgh2_turn_order", names);
  const [current, setCurrent] = useStored("bgh2_turn_current", 0);
  const [round, setRound] = useStored("bgh2_turn_round", 1);
  const [spinning, setSpinning] = useState(null);

  // Si la liste des joueurs a changé, on la reprend
  const list = order.length === names.length && order.every((n) => names.includes(n)) ? order : names;

  function pickFirst() {
    if (spinning !== null) return;
    const winner = randomInt(list.length);
    const steps = list.length * 3 + winner;
    let k = 0;
    const tick = () => {
      setSpinning(k % list.length);
      sfx.tap();
      k += 1;
      if (k <= steps) setTimeout(tick, 60 + k * 9);
      else {
        // Le gagnant commence, les autres suivent dans l'ordre de la table
        const rotated = [...list.slice(winner), ...list.slice(0, winner)];
        setOrder(rotated);
        setCurrent(0);
        setRound(1);
        setSpinning(null);
        sfx.win();
        vibrate([40, 40, 100]);
      }
    };
    tick();
  }

  function next() {
    const n = (current + 1) % list.length;
    if (n === 0) setRound(round + 1);
    setCurrent(n);
    sfx.good();
    vibrate(20);
  }

  return (
    <div className="tool">
      <div className="roundBadge">
        {t("Ronde", "Round")} <strong>{round}</strong>
      </div>
      <div className="turnList">
        {list.map((name, i) => (
          <div key={`${name}-${i}`} className={`turnRow ${spinning === null && i === current ? "current" : ""} ${spinning === i ? "spin" : ""}`}>
            <span className="turnNum">{i + 1}</span>
            <span className="turnName">{name}</span>
            {spinning === null && i === current && <span className="turnNow">{t("À toi!", "Your turn!")}</span>}
          </div>
        ))}
      </div>
      <div className="actionRow">
        <button className="bigAction secondary" onClick={pickFirst}>
          🎲 {t("Qui commence?", "Who starts?")}
        </button>
        <button className="iconButton soft" onClick={() => { setOrder(shuffle(list)); setCurrent(0); setRound(1); }} aria-label={t("Mélanger", "Shuffle")}>
          <Shuffle size={20} />
        </button>
      </div>
      <button className="bigAction" onClick={next} disabled={spinning !== null}>
        {t("Tour suivant", "Next turn")} <ChevronRight size={22} />
      </button>
    </div>
  );
}
