// Dés partagés en réseau : je compose mes dés, je lance, tout le monde voit le résultat
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import PipDie from "../../components/PipDie.jsx";
import { SIDES } from "../games/dice.js";
import { sfx, useLang, vibrate } from "../../lib/core.js";

function DieFace({ sides, value, fresh }) {
  if (sides === 6) return <PipDie value={value} size={48} rolling={false} />;
  return (
    <span className={`nd-poly d${sides} ${fresh ? "fresh" : ""}`}>
      <b>{value}</b>
      <small>d{sides}</small>
    </span>
  );
}

export default function NetDice({ view, send, me }) {
  const { t } = useLang();
  const [pool, setPool] = useState([6, 6]);
  const [bonus, setBonus] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const lastN = useRef(0);
  const rolls = view.rolls || [];
  const latest = rolls[rolls.length - 1];

  // Nouveau lancer reçu : son et vibration
  useEffect(() => {
    if (!latest || latest.n === lastN.current) return;
    const first = lastN.current === 0;
    lastN.current = latest.n;
    setWaiting(false);
    if (!first) {
      sfx.drop();
      vibrate(latest.pid === me.id ? [20, 30, 20] : 20);
    }
  }, [latest, me.id]);

  function roll() {
    if (!pool.length) return;
    setWaiting(true);
    sfx.flip();
    send({ type: "roll", dice: pool, bonus });
    setTimeout(() => setWaiting(false), 4000);
  }

  return (
    <div className="game netDice">
      <div className="nd-latest">
        {latest ? (
          <>
            <div className="nd-who">
              <strong>{latest.pid === me.id ? t("Toi", "You") : latest.name}</strong>
              <span>
                {latest.dice.map((d) => `d${d.sides}`).join(" + ")}
                {latest.bonus ? ` ${latest.bonus > 0 ? "+" : "−"} ${Math.abs(latest.bonus)}` : ""}
              </span>
            </div>
            <div className="nd-faces" key={latest.n}>
              {latest.dice.map((d, i) => (
                <DieFace key={i} sides={d.sides} value={d.value} fresh />
              ))}
            </div>
            <div className="nd-total">
              {t("Total", "Total")} <b>{latest.total}</b>
            </div>
          </>
        ) : (
          <div className="muted">{t("Personne n'a encore lancé. À toi!", "Nobody has rolled yet. Your turn!")}</div>
        )}
      </div>

      <div className="nd-history">
        {rolls
          .slice(0, -1)
          .reverse()
          .map((r) => (
            <div key={r.n} className="nd-row">
              <strong>{r.pid === me.id ? t("Toi", "You") : r.name}</strong>
              <span>{r.dice.map((d) => d.value).join(" · ")}{r.bonus ? ` (${r.bonus > 0 ? "+" : ""}${r.bonus})` : ""}</span>
              <b>{r.total}</b>
            </div>
          ))}
      </div>

      <div className="nd-builder">
        <div className="nd-pool">
          {pool.map((s, i) => (
            <button key={i} className="chipButton" onClick={() => setPool(pool.filter((_, k) => k !== i))}>
              d{s} <X size={12} />
            </button>
          ))}
          {!pool.length && <span className="muted">{t("Ajoute des dés ↓", "Add dice ↓")}</span>}
        </div>
        <div className="nd-add">
          {SIDES.map((s) => (
            <button key={s} className="nd-addBtn" onClick={() => pool.length < 10 && setPool([...pool, s])}>
              +d{s}
            </button>
          ))}
        </div>
        <div className="nd-bottom">
          <div className="stepper small">
            <button onClick={() => setBonus(Math.max(-20, bonus - 1))} aria-label="−">
              <Minus size={16} />
            </button>
            <strong>{bonus >= 0 ? `+${bonus}` : bonus}</strong>
            <button onClick={() => setBonus(Math.min(20, bonus + 1))} aria-label="+">
              <Plus size={16} />
            </button>
          </div>
          <button className="bigAction" onClick={roll} disabled={!pool.length || waiting}>
            🎲 {t("Lancer", "Roll")}
          </button>
        </div>
      </div>
    </div>
  );
}
