import { useEffect, useState } from "react";
import { useLang, useStored, shuffle } from "../../lib/core.js";
import { GameFrame } from "./shared.jsx";
const WORDS = {
  fr: [
    "Un castor",
    "Faire du ski",
    "Un plombier",
    "Une tempête de neige",
    "Faire des crêpes",
    "Un astronaute",
    "Pêcher",
    "Un pirate",
    "Peindre un mur",
    "Un kangourou",
    "Jouer au hockey",
    "Un chef cuisinier",
    "Une girafe",
    "Passer l’aspirateur",
    "Un détective",
    "Un robot",
    "Un pompier",
    "Jouer du violon",
    "Une poule",
    "Un magicien",
    "Un avion",
    "Construire une maison",
    "Un dinosaure",
    "Un serveur",
    "Faire du vélo",
    "Un éléphant",
    "Un jardinier",
    "Un chanteur",
    "Faire du camping",
    "Un vétérinaire",
  ],
  en: [
    "A beaver",
    "Skiing",
    "A plumber",
    "A snowstorm",
    "Making pancakes",
    "An astronaut",
    "Fishing",
    "A pirate",
    "Painting a wall",
    "A kangaroo",
    "Playing hockey",
    "A chef",
    "A giraffe",
    "Vacuuming",
    "A detective",
    "A robot",
    "A firefighter",
    "Playing violin",
    "A chicken",
    "A magician",
    "An airplane",
    "Building a house",
    "A dinosaur",
    "A waiter",
    "Cycling",
    "An elephant",
    "A gardener",
    "A singer",
    "Camping",
    "A vet",
  ],
};
export default function Charades() {
  const { t, lang } = useLang();
  const [g, setG] = useStored("bgh2_charades", () => ({
    scores: [0, 0],
    team: 0,
    until: null,
    deck: shuffle(WORDS[lang]),
    word: null,
    lang,
  }));
  const [now, setNow] = useState(Date.now());
  const [duration, setDuration] = useStored("bgh2_charades_duration", 60);
  const [custom, setCustom] = useStored("bgh2_charades_custom", "");
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!g.until) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [g.until]);
  const expired = g.until && now >= g.until;
  function start() {
    const bank = custom.trim()
      ? custom
          .split("\n")
          .map((w) => w.trim())
          .filter(Boolean)
      : WORDS[lang];
    const deck = g.lang === lang && g.deck.length ? g.deck : shuffle(bank);
    setNow(Date.now());
    setShow(true);
    setG({
      ...g,
      lang,
      until: Date.now() + duration * 1000,
      word: deck[0],
      deck: deck.slice(1),
    });
  }
  function next(correct) {
    if (expired || !g.until) return;
    const bank = custom.trim()
      ? custom
          .split("\n")
          .map((w) => w.trim())
          .filter(Boolean)
      : WORDS[lang];
    const deck = g.deck.length ? g.deck : shuffle(bank);
    setG({
      ...g,
      scores: g.scores.map((n, i) =>
        i === g.team ? n + (correct ? 1 : 0) : n,
      ),
      word: deck[0],
      deck: deck.slice(1),
    });
  }
  return (
    <GameFrame
      title={t("Charades et mime", "Charades")}
      onNew={() => {
        setG({
          scores: [0, 0],
          team: 0,
          until: null,
          deck: shuffle(WORDS[lang]),
          word: null,
          lang,
        });
        setShow(false);
      }}
      rules={t(
        "Deux équipes. Seul le mime regarde le mot. Fais deviner sans parler. Un bon mot vaut 1 point; passer ne retire aucun point. À la fin du minuteur, passe le téléphone à l’autre équipe.",
        "Two teams. Only the actor sees the word. Act it out without speaking. Each correct word earns 1 point; skips have no penalty. At the end of the timer, pass the phone to the other team.",
      )}
    >
      <div className="scoreStrip">
        {g.scores.map((n, i) => (
          <span key={i}>
            {t("Équipe", "Team")} {i + 1}: <b>{n}</b>
          </span>
        ))}
      </div>
      <p>
        {t("Équipe", "Team")} {g.team + 1}
      </p>
      {g.until ? (
        <>
          <p className="hugeNumber" role="timer">
            {Math.max(0, Math.ceil((g.until - now) / 1000))}
          </p>
          {!expired && (
            <>
              <button className="wordReveal" onClick={() => setShow(!show)}>
                {show
                  ? g.word
                  : t("Révéler le mot au mime", "Reveal word to actor")}
              </button>
              <div className="actionRow">
                <button className="bigAction" onClick={() => next(true)}>
                  {t("Trouvé!", "Correct!")}
                </button>
                <button className="chipButton" onClick={() => next(false)}>
                  {t("Passer", "Skip")}
                </button>
              </div>
            </>
          )}
          {expired && (
            <button
              className="bigAction"
              onClick={() => {
                setG({ ...g, until: null, word: null, team: 1 - g.team });
                setShow(false);
              }}
            >
              {t("Temps écoulé — équipe suivante", "Time’s up — next team")}
            </button>
          )}
        </>
      ) : (
        <>
          <label>
            {t("Durée du tour", "Round duration")}{" "}
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {[30, 60, 90, 120].map((n) => (
                <option key={n} value={n}>
                  {n} s
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(
              "Tes mots (un par ligne, facultatif)",
              "Your words (one per line, optional)",
            )}
            <textarea
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setG({ ...g, deck: [] });
              }}
              maxLength={4000}
            />
          </label>
          <button className="bigAction" onClick={start}>
            {t("Le mime est prêt", "Actor is ready")}
          </button>
        </>
      )}
    </GameFrame>
  );
}
