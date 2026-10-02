// Outils de partie : scores, minuteur, banque et liste des pièces de rechange
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  UserPlus,
  X,
} from "lucide-react";
import { sfx, useLang, useStored, vibrate } from "../lib/core.js";
import Hourglass from "../tools/Hourglass.jsx";
import Counters from "../tools/Counters.jsx";
import CustomDice from "../tools/CustomDice.jsx";
import TurnOrder from "../tools/TurnOrder.jsx";
import PropertyKit from "../tools/PropertyKit.jsx";

// ---------- Scores ----------
function Scores({ players, setPlayers }) {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [undo, setUndo] = useState(null);
  const leader = Math.max(...players.map((p) => p.score));

  const update = (id, patch) => {
    setUndo(players);
    setPlayers(players.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  return (
    <div className="tool">
      <div className="optionRow">
        <span className="muted">{t("Pas", "Step")}</span>
        <div className="segmented small">
          {[1, 5, 10, 50].map((s) => (
            <button
              key={s}
              className={step === s ? "active" : ""}
              onClick={() => setStep(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {undo && (
        <button
          className="chipButton"
          onClick={() => {
            setPlayers(undo);
            setUndo(null);
          }}
        >
          {t("Annuler la dernière action", "Undo last action")}
        </button>
      )}
      <div className="scoreList">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`scoreRow ${p.score === leader && leader > 0 ? "leader" : ""}`}
            style={{ "--hue": (i * 57) % 360 }}
          >
            <span className="avatar">
              {(p.name || "?").slice(0, 1).toUpperCase()}
            </span>
            <input
              value={p.name}
              onChange={(e) => update(p.id, { name: e.target.value })}
              aria-label={t("Nom", "Name")}
            />
            <button
              className="roundBtn"
              onClick={() => update(p.id, { score: p.score - step })}
            >
              <Minus size={18} />
            </button>
            <strong className="scoreValue">{p.score}</strong>
            <button
              className="roundBtn plus"
              onClick={() => update(p.id, { score: p.score + step })}
            >
              <Plus size={18} />
            </button>
            {players.length > 1 && (
              <button
                className="removeBtn"
                onClick={() => {
                  setUndo(players);
                  setPlayers(players.filter((x) => x.id !== p.id));
                }}
                aria-label={t("Retirer", "Remove")}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="actionRow">
        <button
          className="bigAction secondary"
          onClick={() => {
            if (
              window.confirm(
                t("Remettre tous les scores à zéro?", "Reset all scores?"),
              )
            ) {
              setUndo(players);
              setPlayers(players.map((p) => ({ ...p, score: 0 })));
            }
          }}
        >
          <RotateCcw size={18} />
          {t("Zéro", "Reset")}
        </button>
        <button
          className="bigAction"
          disabled={players.length >= 8}
          onClick={() =>
            setPlayers([
              ...players,
              {
                id: Date.now(),
                name: `${t("Joueur", "Player")} ${players.length + 1}`,
                score: 0,
                money: 1500,
              },
            ])
          }
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
      const remaining = Math.max(
        0,
        Math.round((endAt.current - Date.now()) / 1000),
      );
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
      <div
        className={`timerRing ${left === 0 ? "ringing" : ""} ${left <= 10 && left > 0 ? "urgent" : ""}`}
      >
        <svg viewBox="0 0 260 260">
          <circle cx="130" cy="130" r={r} className="track" />
          <circle
            cx="130"
            cy="130"
            r={r}
            className="progress"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ratio)}
          />
        </svg>
        <div className="timerText">
          <strong>
            {mm}:{ss}
          </strong>
          <small>
            {left === 0
              ? t("Temps écoulé!", "Time's up!")
              : running
                ? t("En cours", "Running")
                : t("Prêt", "Ready")}
          </small>
        </div>
      </div>

      <div className="presetRow">
        {[15, 30, 60, 120, 180, 300].map((s) => (
          <button
            key={s}
            className={duration === s ? "active" : ""}
            onClick={() => preset(s)}
          >
            {s < 60
              ? `${s}s`
              : s % 60
                ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
                : `${s / 60} min`}
          </button>
        ))}
      </div>

      <div className="actionRow">
        <button
          className="bigAction secondary"
          onClick={() => preset(duration)}
        >
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
  const [undo, setUndo] = useState(null);
  const [error, setError] = useState("");
  const nameOf = (id) =>
    id === "bank"
      ? t("Banque", "Bank")
      : players.find((p) => String(p.id) === String(id))?.name || "?";

  function transfer() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || String(from) === String(to))
      return;
    const payer = players.find((p) => String(p.id) === String(from));
    if (payer && (payer.money ?? 0) < value) {
      setError(t("Fonds insuffisants", "Insufficient funds"));
      sfx.bad();
      vibrate(80);
      return;
    }
    setError("");
    setUndo({ players, log });
    setPlayers(
      players.map((p) => {
        let money = p.money ?? 0;
        if (String(p.id) === String(from)) money -= value;
        if (String(p.id) === String(to)) money += value;
        return { ...p, money };
      }),
    );
    setLog(
      [
        {
          id: Date.now(),
          text: `${nameOf(from)} → ${nameOf(to)} : ${value} $`,
        },
        ...log,
      ].slice(0, 30),
    );
    sfx.good();
    vibrate(20);
  }

  const parties = [{ id: "bank", name: t("Banque", "Bank") }, ...players];

  return (
    <div className="tool">
      {error && <p role="alert">{error}</p>}
      {undo && (
        <button
          className="chipButton"
          onClick={() => {
            setPlayers(undo.players);
            setLog(undo.log);
            setUndo(null);
          }}
        >
          {t("Annuler le paiement", "Undo payment")}
        </button>
      )}
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
            <strong>
              {(p.money ?? 0).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")}{" "}
              $
            </strong>
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
            <button
              key={v}
              className={Number(amount) === v ? "active" : ""}
              onClick={() => setAmount(v)}
            >
              {v}
            </button>
          ))}
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={t("Montant", "Amount")}
          />
        </div>
        <button className="bigAction" onClick={transfer}>
          {t("Payer", "Pay")} {amount} $
        </button>
      </div>

      <div className="bankLog">
        {log.slice(0, 4).map((item) => (
          <div key={item.id}>{item.text}</div>
        ))}
        {log.length === 0 && (
          <div className="muted">
            {t("Aucune transaction.", "No transactions yet.")}
          </div>
        )}
      </div>

      <button
        className="linkButton"
        onClick={() => {
          if (!window.confirm(t("Réinitialiser la banque?", "Reset the bank?")))
            return;
          setUndo({ players, log });
          setPlayers(players.map((p) => ({ ...p, money: 1500 })));
          setLog([]);
        }}
      >
        {t("Remettre tout le monde à 1500 $", "Reset everyone to $1500")}
      </button>
    </div>
  );
}

// ---------- Liste des pièces de rechange ----------
export const TOOLS = [
  {
    id: "scores",
    emoji: "🏆",
    fr: "Scores",
    en: "Scores",
    descFr: "Feuille de pointage",
    descEn: "Score sheet",
    colors: ["#ca8a04", "#b45309"],
  },
  {
    id: "counters",
    emoji: "🔢",
    fr: "Compteurs",
    en: "Counters",
    descFr: "Vies, armées, ressources",
    descEn: "Life, armies, resources",
    colors: ["#dc2626", "#9d174d"],
  },
  {
    id: "hourglass",
    emoji: "⏳",
    fr: "Sablier",
    en: "Hourglass",
    descFr: "30 s à 5 min, se retourne",
    descEn: "30 s to 5 min, flips",
    colors: ["#d97706", "#92400e"],
  },
  {
    id: "timer",
    emoji: "⏱️",
    fr: "Minuteur",
    en: "Timer",
    descFr: "Chrono avec alarme",
    descEn: "Timer with alarm",
    colors: ["#0891b2", "#1e40af"],
  },
  {
    id: "bank",
    emoji: "💰",
    fr: "Banque",
    en: "Bank",
    descFr: "Argent du jeu",
    descEn: "Play money",
    colors: ["#15803d", "#065f46"],
  },
  {
    id: "property",
    emoji: "🏠",
    fr: "Kit immobilier",
    en: "Property kit",
    descFr: "Cartes événement et titres",
    descEn: "Event cards & deeds",
    colors: ["#ea580c", "#b91c1c"],
  },
  {
    id: "customdice",
    emoji: "🎨",
    fr: "Dés spéciaux",
    en: "Special dice",
    descFr: "Couleurs, lettres, sur mesure",
    descEn: "Colors, letters, custom",
    colors: ["#7c3aed", "#4338ca"],
  },
  {
    id: "turns",
    emoji: "🔄",
    fr: "Ordre de jeu",
    en: "Turn order",
    descFr: "Qui commence, à qui le tour",
    descEn: "Who starts, whose turn",
    colors: ["#0d9488", "#0f766e"],
  },
];

export default function ToolsScreen({ tool, onTool, players, setPlayers }) {
  const { lang } = useLang();
  if (!tool) {
    return (
      <div className="gamesGrid toolsGrid">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            className="gameTile"
            style={{ "--g1": item.colors[0], "--g2": item.colors[1] }}
            onClick={() => onTool(item.id)}
          >
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
      {tool === "scores" && (
        <Scores players={players} setPlayers={setPlayers} />
      )}
      {tool === "timer" && <TimerTool />}
      {tool === "bank" && <Bank players={players} setPlayers={setPlayers} />}
      {tool === "hourglass" && <Hourglass />}
      {tool === "counters" && <Counters players={players} />}
      {tool === "customdice" && <CustomDice />}
      {tool === "turns" && <TurnOrder players={players} />}
      {tool === "property" && (
        <PropertyKit players={players} setPlayers={setPlayers} />
      )}
    </div>
  );
}
