// Outils de partie : scores, minuteur, banque et roue de hasard
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Minus, Pause, Play, Plus, RotateCcw, Trash2, UserPlus, X } from "lucide-react";
import { randomInt, sfx, useLang, useStored, vibrate } from "../lib/core.js";
import Hourglass from "../tools/Hourglass.jsx";
import Counters from "../tools/Counters.jsx";
import CustomDice from "../tools/CustomDice.jsx";
import TurnOrder from "../tools/TurnOrder.jsx";
import LetterTiles from "../tools/LetterTiles.jsx";
import PropertyKit from "../tools/PropertyKit.jsx";

// ---------- Scores ----------
function Scores({ players, setPlayers }) {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const leader = Math.max(...players.map((p) => p.score));

  const update = (id, patch) => setPlayers(players.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="tool">
      <div className="optionRow">
        <span className="muted">{t("Pas", "Step")}</span>
        <div className="segmented small">
          {[1, 5, 10, 50].map((s) => (
            <button key={s} className={step === s ? "active" : ""} onClick={() => setStep(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="scoreList">
        {players.map((p, i) => (
          <div key={p.id} className={`scoreRow ${p.score === leader && leader > 0 ? "leader" : ""}`} style={{ "--hue": (i * 57) % 360 }}>
            <span className="avatar">{(p.name || "?").slice(0, 1).toUpperCase()}</span>
            <input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} aria-label={t("Nom", "Name")} />
            <button className="roundBtn" onClick={() => update(p.id, { score: p.score - step })}>
              <Minus size={18} />
            </button>
            <strong className="scoreValue">{p.score}</strong>
            <button className="roundBtn plus" onClick={() => update(p.id, { score: p.score + step })}>
              <Plus size={18} />
            </button>
            {players.length > 1 && (
              <button className="removeBtn" onClick={() => setPlayers(players.filter((x) => x.id !== p.id))} aria-label={t("Retirer", "Remove")}>
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="actionRow">
        <button
          className="bigAction secondary"
          onClick={() => setPlayers(players.map((p) => ({ ...p, score: 0 })))}
        >
          <RotateCcw size={18} />
          {t("Zéro", "Reset")}
        </button>
        <button
          className="bigAction"
          disabled={players.length >= 8}
          onClick={() => setPlayers([...players, { id: Date.now(), name: `${t("Joueur", "Player")} ${players.length + 1}`, score: 0, money: 1500 }])}
        >
          <UserPlus size={18} />
          {t("Joueur", "Player")}
        </button>
      </div>
    </div>
  );
}

// ---------- Minuteur ----------
function TimerTool() {
  const { t } = useLang();
  const [duration, setDuration] = useStored("bgh2_timer_duration", 60);
  const [left, setLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return undefined;
    endAt.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 5 && remaining > 0) sfx.tap();
      if (remaining === 0) {
        setRunning(false);
        sfx.win();
        vibrate([300, 120, 300, 120, 300]);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function preset(s) {
    setDuration(s);
    setLeft(s);
    setRunning(false);
  }

  const ratio = duration ? left / duration : 0;
  const r = 110;
  const circ = 2 * Math.PI * r;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="tool timerTool">
      <div className={`timerRing ${left === 0 ? "ringing" : ""} ${left <= 10 && left > 0 ? "urgent" : ""}`}>
        <svg viewBox="0 0 260 260">
          <circle cx="130" cy="130" r={r} className="track" />
          <circle cx="130" cy="130" r={r} className="progress" strokeDasharray={circ} strokeDashoffset={circ * (1 - ratio)} />
        </svg>
        <div className="timerText">
          <strong>
            {mm}:{ss}
          </strong>
          <small>{left === 0 ? t("Temps écoulé!", "Time's up!") : running ? t("En cours", "Running") : t("Prêt", "Ready")}</small>
        </div>
      </div>

      <div className="presetRow">
        {[15, 30, 60, 120, 180, 300].map((s) => (
          <button key={s} className={duration === s ? "active" : ""} onClick={() => preset(s)}>
            {s < 60 ? `${s}s` : s % 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s / 60} min`}
          </button>
        ))}
      </div>

      <div className="actionRow">
        <button className="bigAction secondary" onClick={() => preset(duration)}>
          <RotateCcw size={20} />
        </button>
        <button
          className="bigAction"
          onClick={() => {
            if (left === 0) setLeft(duration);
            setRunning(!running);
            sfx.tap();
          }}
        >
          {running ? <Pause size={22} /> : <Play size={22} />}
          {running ? t("Pause", "Pause") : t("Démarrer", "Start")}
        </button>
      </div>
    </div>
  );
}

// ---------- Banque ----------
function Bank({ players, setPlayers }) {
  const { t, lang } = useLang();
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState("bank");
  const [to, setTo] = useState(players[0]?.id ?? "bank");
  const [log, setLog] = useStored("bgh2_bank_log", []);
  const nameOf = (id) => (id === "bank" ? t("Banque", "Bank") : players.find((p) => String(p.id) === String(id))?.name || "?");

  function transfer() {
    const value = Number(amount);
    if (!value || value <= 0 || String(from) === String(to)) return;
    const payer = players.find((p) => String(p.id) === String(from));
    if (payer && (payer.money ?? 0) < value) {
      sfx.bad();
      vibrate(80);
      return;
    }
    setPlayers(
      players.map((p) => {
        let money = p.money ?? 0;
        if (String(p.id) === String(from)) money -= value;
        if (String(p.id) === String(to)) money += value;
        return { ...p, money };
      })
    );
    setLog([{ id: Date.now(), text: `${nameOf(from)} → ${nameOf(to)} : ${value} $` }, ...log].slice(0, 30));
    sfx.good();
    vibrate(20);
  }

  const parties = [{ id: "bank", name: t("Banque", "Bank") }, ...players];

  return (
    <div className="tool">
      <div className="bankGrid">
        {players.map((p, i) => (
          <button
            key={p.id}
            className={`bankCard ${String(to) === String(p.id) ? "to" : ""} ${String(from) === String(p.id) ? "from" : ""}`}
            style={{ "--hue": (i * 57) % 360 }}
            onClick={() => {
              if (String(from) === String(p.id)) return;
              setTo(p.id);
            }}
          >
            <small>{p.name}</small>
            <strong>{(p.money ?? 0).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $</strong>
          </button>
        ))}
      </div>

      <div className="transferCard">
        <div className="transferRow">
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ArrowRight size={20} />
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="amountRow">
          {[10, 50, 100, 200, 500].map((v) => (
            <button key={v} className={Number(amount) === v ? "active" : ""} onClick={() => setAmount(v)}>
              {v}
            </button>
          ))}
          <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label={t("Montant", "Amount")} />
        </div>
        <button className="bigAction" onClick={transfer}>
          {t("Payer", "Pay")} {amount} $
        </button>
      </div>

      <div className="bankLog">
        {log.slice(0, 4).map((item) => (
          <div key={item.id}>{item.text}</div>
        ))}
        {log.length === 0 && <div className="muted">{t("Aucune transaction.", "No transactions yet.")}</div>}
      </div>

      <button
        className="linkButton"
        onClick={() => {
          setPlayers(players.map((p) => ({ ...p, money: 1500 })));
          setLog([]);
        }}
      >
        {t("Remettre tout le monde à 1500 $", "Reset everyone to $1500")}
      </button>
    </div>
  );
}

// ---------- Roue ----------
const WHEEL_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

function Wheel({ players }) {
  const { t } = useLang();
  const [items, setItems] = useStored("bgh2_wheel", () => players.map((p) => p.name));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const n = Math.max(items.length, 1);
  const seg = 360 / n;

  function spin() {
    if (spinning || items.length < 2) return;
    const pick = randomInt(items.length);
    // Le haut de la roue (aiguille) doit arriver au centre du segment choisi
    const target = 360 - (pick * seg + seg / 2);
    const base = rotation - (rotation % 360);
    setRotation(base + 360 * 6 + target);
    setSpinning(true);
    setResult(null);
    sfx.tap();
    setTimeout(() => {
      setSpinning(false);
      setResult(items[pick]);
      sfx.win();
      vibrate([60, 40, 120]);
    }, 5200);
  }

  const polar = (angle, radius) => {
    const a = ((angle - 90) * Math.PI) / 180;
    return [150 + radius * Math.cos(a), 150 + radius * Math.sin(a)];
  };

  return (
    <div className="tool wheelTool">
      <div className="wheelWrap">
        <div className="wheelPointer" />
        <svg viewBox="0 0 300 300" className="wheelSvg" style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 5.2s cubic-bezier(0.12, 0.8, 0.1, 1)" : "none" }}>
          {items.map((item, i) => {
            const [x1, y1] = polar(i * seg, 140);
            const [x2, y2] = polar((i + 1) * seg, 140);
            const large = seg > 180 ? 1 : 0;
            const [tx, ty] = polar(i * seg + seg / 2, 92);
            return (
              <g key={`${item}-${i}`}>
                <path d={`M150 150 L${x1} ${y1} A140 140 0 ${large} 1 ${x2} ${y2} Z`} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
                <text x={tx} y={ty} fill="#fff" fontSize={n > 8 ? 11 : 14} fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${i * seg + seg / 2} ${tx} ${ty})`}>
                  {item.length > 12 ? `${item.slice(0, 11)}…` : item}
                </text>
              </g>
            );
          })}
          <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="6" />
          <circle cx="150" cy="150" r="24" fill="#111827" stroke="#facc15" strokeWidth="4" />
        </svg>
      </div>
      <div className="wheelResult">{result ? `🎉 ${result}` : spinning ? "…" : " "}</div>
      <div className="actionRow">
        <button className="bigAction secondary" onClick={() => setEditing(true)}>
          {t("Options", "Options")} ({items.length})
        </button>
        <button className="bigAction" onClick={spin} disabled={spinning || items.length < 2}>
          {t("Tourner", "Spin")}
        </button>
      </div>

      {editing && (
        <div className="sheetBackdrop" onClick={() => setEditing(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>{t("Options de la roue", "Wheel options")}</h2>
              <button className="iconButton" onClick={() => setEditing(false)}>
                <X size={22} />
              </button>
            </div>
            <form
              className="addRow"
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim()) return;
                setItems([...items, input.trim()]);
                setInput("");
              }}
            >
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Ajouter une option", "Add an option")} />
              <button className="iconButton accentBg" type="submit">
                <Plus size={20} />
              </button>
            </form>
            <div className="editList">
              {items.map((item, i) => (
                <div className="editRow" key={`${item}-${i}`}>
                  <span>{item}</span>
                  <button className="iconButton soft" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="linkButton" onClick={() => setItems(players.map((p) => p.name))}>
              {t("Utiliser les noms des joueurs", "Use player names")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Liste des pièces de rechange ----------
export const TOOLS = [
  { id: "scores", emoji: "🏆", fr: "Scores", en: "Scores", descFr: "Feuille de pointage", descEn: "Score sheet", colors: ["#ca8a04", "#b45309"] },
  { id: "counters", emoji: "🔢", fr: "Compteurs", en: "Counters", descFr: "Vies, armées, ressources", descEn: "Life, armies, resources", colors: ["#dc2626", "#9d174d"] },
  { id: "hourglass", emoji: "⏳", fr: "Sablier", en: "Hourglass", descFr: "30 s à 5 min, se retourne", descEn: "30 s to 5 min, flips", colors: ["#d97706", "#92400e"] },
  { id: "timer", emoji: "⏱️", fr: "Minuteur", en: "Timer", descFr: "Chrono avec alarme", descEn: "Timer with alarm", colors: ["#0891b2", "#1e40af"] },
  { id: "bank", emoji: "💰", fr: "Banque", en: "Bank", descFr: "Argent du jeu", descEn: "Play money", colors: ["#15803d", "#065f46"] },
  { id: "property", emoji: "🏠", fr: "Kit immobilier", en: "Property kit", descFr: "Cartes événement et titres", descEn: "Event cards & deeds", colors: ["#ea580c", "#b91c1c"] },
  { id: "customdice", emoji: "🎨", fr: "Dés spéciaux", en: "Special dice", descFr: "Couleurs, lettres, sur mesure", descEn: "Colors, letters, custom", colors: ["#7c3aed", "#4338ca"] },
  { id: "letters", emoji: "🔤", fr: "Lettres", en: "Letter tiles", descFr: "Sac de tuiles pour jeux de mots", descEn: "Tile bag for word games", colors: ["#a16207", "#78350f"] },
  { id: "turns", emoji: "🔄", fr: "Ordre de jeu", en: "Turn order", descFr: "Qui commence, à qui le tour", descEn: "Who starts, whose turn", colors: ["#0d9488", "#0f766e"] },
  { id: "wheel", emoji: "🎡", fr: "Roue", en: "Wheel", descFr: "Tirage au sort", descEn: "Random pick", colors: ["#db2777", "#7c3aed"] }
];

export default function ToolsScreen({ tool, onTool, players, setPlayers }) {
  const { lang } = useLang();
  if (!tool) {
    return (
      <div className="gamesGrid toolsGrid">
        {TOOLS.map((item) => (
          <button key={item.id} className="gameTile" style={{ "--g1": item.colors[0], "--g2": item.colors[1] }} onClick={() => onTool(item.id)}>
            <span className="gameEmoji">{item.emoji}</span>
            <strong>{item[lang]}</strong>
            <small>{lang === "fr" ? item.descFr : item.descEn}</small>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="toolsScreen">
      {tool === "scores" && <Scores players={players} setPlayers={setPlayers} />}
      {tool === "timer" && <TimerTool />}
      {tool === "bank" && <Bank players={players} setPlayers={setPlayers} />}
      {tool === "wheel" && <Wheel players={players} />}
      {tool === "hourglass" && <Hourglass />}
      {tool === "counters" && <Counters players={players} />}
      {tool === "customdice" && <CustomDice />}
      {tool === "turns" && <TurnOrder players={players} />}
      {tool === "letters" && <LetterTiles />}
      {tool === "property" && <PropertyKit players={players} setPlayers={setPlayers} />}
    </div>
  );
}
