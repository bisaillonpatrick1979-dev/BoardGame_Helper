// Compteurs : points de vie, armées, ressources… n'importe quel jeton manquant
import { useState } from "react";
import { Minus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { sfx, useLang, useStored } from "../lib/core.js";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

const TEMPLATES = [
  { icon: "❤️", fr: "Points de vie", en: "Life points", start: 20 },
  { icon: "⚔️", fr: "Armées", en: "Armies", start: 3 },
  { icon: "🪙", fr: "Pièces d'or", en: "Gold coins", start: 0 },
  { icon: "🌾", fr: "Ressources", en: "Resources", start: 0 },
  { icon: "⭐", fr: "Points de victoire", en: "Victory points", start: 0 },
  { icon: "🔢", fr: "Compteur", en: "Counter", start: 0 }
];

export default function Counters({ players }) {
  const { t, lang } = useLang();
  const [counters, setCounters] = useStored("bgh2_counters", () => [
    { id: 1, name: `${players?.[0]?.name || "Joueur 1"} ❤️`, value: 20, start: 20, color: COLORS[0] },
    { id: 2, name: `${players?.[1]?.name || "Joueur 2"} ❤️`, value: 20, start: 20, color: COLORS[5] }
  ]);
  const [step, setStep] = useState(1);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState(0);
  const [flash, setFlash] = useState({});

  function change(id, delta) {
    setCounters(counters.map((c) => (c.id === id ? { ...c, value: c.value + delta } : c)));
    setFlash({ id, delta, key: Date.now() });
    sfx.tap();
  }

  function add(tpl) {
    const n = tpl ? `${tpl[lang]} ${tpl.icon}` : name.trim();
    if (!n) return;
    const s = tpl ? tpl.start : Number(start) || 0;
    setCounters([...counters, { id: Date.now(), name: n, value: s, start: s, color: COLORS[counters.length % COLORS.length] }]);
    setName("");
    setAdding(false);
  }

  return (
    <div className="tool">
      <div className="optionRow">
        <span className="muted">{t("Pas", "Step")}</span>
        <div className="segmented small">
          {[1, 5, 10, 100].map((s) => (
            <button key={s} className={step === s ? "active" : ""} onClick={() => setStep(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={`counterGrid n${Math.min(counters.length, 6)}`}>
        {counters.map((c) => (
          <div key={c.id} className="counterCard" style={{ "--c": c.color }}>
            <input
              className="counterName"
              value={c.name}
              onChange={(e) => setCounters(counters.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
            />
            <div className="counterBody">
              <button className="counterBtn" onClick={() => change(c.id, -step)} aria-label="-">
                <Minus size={26} />
              </button>
              <div className="counterValue">
                <strong key={flash.id === c.id ? `v${flash.key}` : "v"} className={flash.id === c.id ? "pop" : ""}>
                  {c.value}
                </strong>
                {flash.id === c.id && (
                  <span key={flash.key} className={`counterDelta ${flash.delta > 0 ? "up" : "down"}`}>
                    {flash.delta > 0 ? `+${flash.delta}` : flash.delta}
                  </span>
                )}
              </div>
              <button className="counterBtn plus" onClick={() => change(c.id, step)} aria-label="+">
                <Plus size={26} />
              </button>
            </div>
            <div className="counterFoot">
              <button onClick={() => setCounters(counters.map((x) => (x.id === c.id ? { ...x, value: x.start } : x)))} aria-label={t("Remettre", "Reset")}>
                <RotateCcw size={14} />
              </button>
              <span className="colorDots">
                {COLORS.slice(0, 6).map((col) => (
                  <i key={col} style={{ background: col }} onClick={() => setCounters(counters.map((x) => (x.id === c.id ? { ...x, color: col } : x)))} />
                ))}
              </span>
              <button onClick={() => setCounters(counters.filter((x) => x.id !== c.id))} aria-label={t("Retirer", "Remove")}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="bigAction" onClick={() => setAdding(true)}>
        <Plus size={20} />
        {t("Ajouter un compteur", "Add a counter")}
      </button>

      {adding && (
        <div className="sheetBackdrop" onClick={() => setAdding(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>{t("Nouveau compteur", "New counter")}</h2>
              <button className="iconButton" onClick={() => setAdding(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="templateGrid">
              {TEMPLATES.map((tpl) => (
                <button key={tpl.fr} onClick={() => add(tpl)}>
                  <span>{tpl.icon}</span>
                  {tpl[lang]}
                  <small>{tpl.start}</small>
                </button>
              ))}
            </div>
            <h3 className="sheetLabel">{t("Ou sur mesure", "Or custom")}</h3>
            <form
              className="addRow"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Nom (ex. : Bois)", "Name (e.g. Wood)")} />
              <input className="smallNum" type="number" inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} aria-label={t("Départ", "Start")} />
              <button className="iconButton accentBg" type="submit">
                <Plus size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
