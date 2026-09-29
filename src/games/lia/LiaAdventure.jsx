// Aventure libre avec Lia, maître du jeu IA : elle raconte, tu choisis, les dés décident.
import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Sparkles } from "lucide-react";
import { useAuth } from "../../lib/auth.jsx";
import { supabase } from "../../lib/cloud.js";
import { randomInt, recordGame, sfx, useLang, useStored, vibrate } from "../../lib/core.js";

const SETTINGS = [
  { id: "fantasy", emoji: "🐉", fr: "Fantastique médiéval", en: "Medieval fantasy" },
  { id: "pirates", emoji: "🏴‍☠️", fr: "Pirates et îles perdues", en: "Pirates & lost islands" },
  { id: "space", emoji: "🚀", fr: "Science-fiction spatiale", en: "Space sci-fi" },
  { id: "mystery", emoji: "🕯️", fr: "Manoir hanté (frissons légers)", en: "Haunted manor (light spooky)" },
  { id: "western", emoji: "🤠", fr: "Far West", en: "Wild West" },
  { id: "north", emoji: "🌲", fr: "Légendes du Grand Nord", en: "Legends of the Far North" }
];

const CLASSES = [
  { id: "warrior", emoji: "⚔️", fr: "Guerrier·ère", en: "Warrior", bonus: "+2 force" },
  { id: "mage", emoji: "🔮", fr: "Magicien·ne", en: "Mage", bonus: "+2 magie" },
  { id: "rogue", emoji: "🗝️", fr: "Voleur·se", en: "Rogue", bonus: "+2 agilité" },
  { id: "ranger", emoji: "🏹", fr: "Rôdeur·se", en: "Ranger", bonus: "+2 perception" }
];

// Sépare le récit, la demande de jet et les actions proposées
function parseReply(text) {
  const lines = text.split("\n");
  let roll = null;
  let actions = [];
  const story = [];
  lines.forEach((line) => {
    const r = line.match(/^\s*(?:JET|ROLL)\s*:\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*[—–-]?\s*(.*)$/i);
    const a = line.match(/^\s*ACTIONS?\s*:\s*(.*)$/i);
    if (r) roll = { n: Number(r[1] || 1), sides: Number(r[2]), mod: r[3] ? Number(r[3].replace(/\s/g, "")) : 0, reason: r[4].trim() };
    else if (a) actions = a[1].split("|").map((x) => x.trim()).filter(Boolean).slice(0, 4);
    else story.push(line);
  });
  return { story: story.join("\n").trim(), roll, actions };
}

function RollCard({ roll, onDone, t }) {
  const [value, setValue] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [shown, setShown] = useState(roll.sides);

  function go() {
    if (spinning || value !== null) return;
    setSpinning(true);
    sfx.flip();
    vibrate(30);
    let k = 0;
    const id = setInterval(() => {
      k += 1;
      setShown(1 + randomInt(roll.sides));
      if (k > 14) {
        clearInterval(id);
        const dice = Array.from({ length: roll.n }, () => 1 + randomInt(roll.sides));
        const sum = dice.reduce((a, b) => a + b, 0);
        setShown(sum);
        setValue({ dice, sum, total: sum + roll.mod });
        setSpinning(false);
        if (roll.sides === 20 && dice[0] === 20) sfx.win();
        else if (roll.sides === 20 && dice[0] === 1) sfx.lose();
        else sfx.drop();
      }
    }, 60);
  }

  return (
    <div className="liaRoll">
      <div className={`liaDie ${spinning ? "spin" : value ? "landed" : ""}`}>
        <span>{shown}</span>
        <small>d{roll.sides}</small>
      </div>
      <div className="liaRollInfo">
        <strong>
          🎲 {roll.n}d{roll.sides}
          {roll.mod ? (roll.mod > 0 ? `+${roll.mod}` : roll.mod) : ""}
        </strong>
        <small>{roll.reason}</small>
        {value ? (
          <button className="bigAction compact" onClick={() => onDone(value)}>
            {t("Dire à Lia", "Tell Lia")} : {value.total}
          </button>
        ) : (
          <button className="bigAction compact gold" onClick={go}>
            {t("Lancer!", "Roll!")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LiaAdventure({ players }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [game, setGame] = useStored("bgh2_lia", null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState(null);
  const listRef = useRef(null);

  // Configuration de départ
  const [setting, setSetting] = useState(SETTINGS[0].id);
  const [heroName, setHeroName] = useState(players?.[0]?.name || "");
  const [heroClass, setHeroClass] = useState(CLASSES[0].id);
  const [group, setGroup] = useState(players.length > 1);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [game?.messages?.length, busy]);

  async function ask(messages, current = game) {
    setBusy(true);
    setError("");
    const s = SETTINGS.find((x) => x.id === current.setting);
    const c = CLASSES.find((x) => x.id === current.heroClass);
    try {
      const { data, error: err } = await supabase.functions.invoke("bgh-lia", {
        body: {
          lang,
          setting: s ? s[lang] : current.setting,
          hero: `${current.heroName} (${c ? `${c[lang]}, ${c.bonus}` : ""})`,
          party: current.party,
          messages: messages.map((m) => ({ role: m.role, content: m.content }))
        }
      });
      if (err) {
        let code = "";
        try {
          code = (await err.context?.json?.())?.error || "";
        } catch {
          code = "";
        }
        throw new Error(code || err.message);
      }
      setUsage({ used: data.used, limit: data.limit });
      setGame({ ...current, messages: [...messages, { role: "assistant", content: data.text }].slice(-40) });
      sfx.tap();
    } catch (e) {
      const code = String(e.message || "");
      setError(
        code.includes("not_configured")
          ? t("Lia n'est pas encore activée sur le serveur (clé IA manquante).", "Lia isn't enabled on the server yet (missing AI key).")
          : code.includes("quota")
            ? t("Tu as utilisé tous tes messages avec Lia pour aujourd'hui. Reviens demain!", "You've used all your Lia messages for today. Come back tomorrow!")
            : !navigator.onLine
              ? t("Lia a besoin d'Internet pour raconter.", "Lia needs the internet to tell the story.")
              : t("Lia n'a pas pu répondre. Réessaie.", "Lia couldn't answer. Try again.")
      );
      setGame({ ...current, messages });
    }
    setBusy(false);
  }

  function start() {
    const party = group ? players.map((p) => p.name).filter(Boolean) : [heroName || t("Héros", "Hero")];
    const first = { role: "user", content: t("Commence l'aventure!", "Start the adventure!") };
    const next = { setting, heroName: heroName || t("Héros", "Hero"), heroClass, party, messages: [first], startedAt: Date.now() };
    setGame(next);
    ask([first], next);
    recordGame("lia", "played");
  }

  function send(text) {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    const messages = [...game.messages, { role: "user", content: clean }];
    setGame({ ...game, messages });
    ask(messages);
  }

  if (!user) {
    return (
      <div className="game liaStart">
        <div className="liaIntro">
          <div className="liaAvatar big">✨</div>
          <h2>{t("Aventure avec Lia", "Adventure with Lia")}</h2>
          <p>
            {t(
              "Lia est une maître du jeu IA : elle invente l'histoire en direct, joue tous les personnages et te fait lancer les dés quand ça devient risqué. Seul ou avec toute la table!",
              "Lia is an AI game master: she invents the story live, voices every character and makes you roll dice when things get risky. Solo or with the whole table!"
            )}
          </p>
          <p className="muted">{t("Il faut un compte gratuit pour jouer avec Lia.", "A free account is required to play with Lia.")}</p>
          <button className="bigAction" onClick={() => window.dispatchEvent(new CustomEvent("bgh-open-account"))}>
            {t("Créer un compte / se connecter", "Sign up / sign in")}
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="game liaSetup">
        <div className="liaHead">
          <div className="liaAvatar">✨</div>
          <p>{t("Salut! Moi, c'est Lia. On part dans quel genre d'aventure?", "Hi! I'm Lia. What kind of adventure shall we go on?")}</p>
        </div>
        <div className="liaGrid">
          {SETTINGS.map((s) => (
            <button key={s.id} className={setting === s.id ? "active" : ""} onClick={() => setSetting(s.id)}>
              <span>{s.emoji}</span>
              {s[lang]}
            </button>
          ))}
        </div>
        <div className="liaGrid four">
          {CLASSES.map((c) => (
            <button key={c.id} className={heroClass === c.id ? "active" : ""} onClick={() => setHeroClass(c.id)}>
              <span>{c.emoji}</span>
              {c[lang]}
            </button>
          ))}
        </div>
        <div className="addRow">
          <input value={heroName} onChange={(e) => setHeroName(e.target.value)} placeholder={t("Nom de ton héros", "Your hero's name")} />
        </div>
        {players.length > 1 && (
          <button className={`toggleRow ${group ? "on" : ""}`} onClick={() => setGroup(!group)}>
            <span>
              {t("Jouer avec toute la table", "Play with the whole table")} ({players.map((p) => p.name).join(", ")})
            </span>
            <i className="switch" />
          </button>
        )}
        <button className="bigAction" onClick={start}>
          <Sparkles size={20} /> {t("Commencer avec Lia", "Start with Lia")}
        </button>
      </div>
    );
  }

  const last = [...game.messages].reverse().find((m) => m.role === "assistant");
  const parsed = last ? parseReply(last.content) : null;
  const waitingRoll = parsed?.roll && game.messages[game.messages.length - 1]?.role === "assistant";

  return (
    <div className="game lia">
      <div className="liaBar">
        <span>
          {SETTINGS.find((s) => s.id === game.setting)?.emoji} {game.heroName}
        </span>
        {usage && (
          <small>
            {usage.used}/{usage.limit} {t("aujourd'hui", "today")}
          </small>
        )}
        <button className="chipButton" onClick={() => setGame(null)}>
          <RotateCcw size={14} /> {t("Nouvelle", "New")}
        </button>
      </div>

      <div className="liaChat" ref={listRef}>
        {game.messages.map((m, i) => {
          if (m.role === "user") {
            if (i === 0) return null;
            return (
              <div key={i} className="liaMsg me">
                {m.content}
              </div>
            );
          }
          const p = parseReply(m.content);
          return (
            <div key={i} className="liaMsg lia">
              <span className="liaAvatar">✨</span>
              <p>{p.story}</p>
            </div>
          );
        })}
        {busy && (
          <div className="liaMsg lia typing">
            <span className="liaAvatar">✨</span>
            <p>
              <i />
              <i />
              <i />
            </p>
          </div>
        )}
        {error && <div className="formError">{error}</div>}
      </div>

      {waitingRoll && !busy && (
        <RollCard
          key={game.messages.length}
          roll={parsed.roll}
          t={t}
          onDone={(v) =>
            send(
              t(
                `🎲 J'ai lancé ${v.dice.join(" + ")}${parsed.roll.mod ? ` ${parsed.roll.mod > 0 ? "+" : "−"} ${Math.abs(parsed.roll.mod)}` : ""} = ${v.total} (${parsed.roll.reason})`,
                `🎲 I rolled ${v.dice.join(" + ")}${parsed.roll.mod ? ` ${parsed.roll.mod > 0 ? "+" : "−"} ${Math.abs(parsed.roll.mod)}` : ""} = ${v.total} (${parsed.roll.reason})`
              )
            )
          }
        />
      )}

      {!waitingRoll && parsed?.actions?.length > 0 && !busy && (
        <div className="liaActions">
          {parsed.actions.map((a) => (
            <button key={a} onClick={() => send(a)}>
              {a}
            </button>
          ))}
        </div>
      )}

      <form
        className="addRow"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Que fais-tu?", "What do you do?")} disabled={busy} maxLength={500} />
        <button className="iconButton accentBg" type="submit" disabled={busy || !input.trim()} aria-label={t("Envoyer", "Send")}>
          <Send size={18} />
        </button>
      </form>
      {error && !busy && game.messages[game.messages.length - 1]?.role === "user" && (
        <button className="linkButton" onClick={() => ask(game.messages)}>
          {t("Réessayer", "Retry")}
        </button>
      )}
    </div>
  );
}
