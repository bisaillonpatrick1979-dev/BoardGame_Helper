// Jeu du pendu : le bonhomme se dessine trait par trait à chaque erreur
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Users, User } from "lucide-react";
import {
  randomInt,
  sfx,
  useLang,
  useStored,
  vibrate,
  recordGame,
} from "../lib/core.js";

const WORDS = {
  fr: {
    Animaux: [
      "ÉLÉPHANT",
      "GIRAFE",
      "KANGOUROU",
      "PINGOUIN",
      "CROCODILE",
      "HIBOU",
      "ÉCUREUIL",
      "ORIGNAL",
      "CASTOR",
      "PAPILLON",
      "TORTUE",
      "DAUPHIN",
      "RATON LAVEUR",
      "HÉRISSON",
      "CAMÉLÉON",
      "CARIBOU",
    ],
    Nourriture: [
      "POUTINE",
      "SPAGHETTI",
      "CROISSANT",
      "FROMAGE",
      "TOURTIÈRE",
      "BLEUET",
      "PAMPLEMOUSSE",
      "CHOCOLAT",
      "SIROP D'ÉRABLE",
      "BROCOLI",
      "HAMBURGER",
      "CRÊPE",
      "FRAMBOISE",
      "CITROUILLE",
    ],
    Maison: [
      "CUISINE",
      "FRIGIDAIRE",
      "ESCALIER",
      "FENÊTRE",
      "TABOURET",
      "LAVEUSE",
      "OREILLER",
      "ARMOIRE",
      "CHEMINÉE",
      "GARAGE",
      "TOITURE",
      "BIBLIOTHÈQUE",
      "BALCON",
    ],
    Métiers: [
      "POMPIER",
      "COUVREUR",
      "MENUISIER",
      "PLOMBIER",
      "ÉLECTRICIEN",
      "INFIRMIÈRE",
      "BOULANGER",
      "PILOTE",
      "ASTRONAUTE",
      "VÉTÉRINAIRE",
      "POLICIER",
      "ARCHITECTE",
    ],
    Sports: [
      "HOCKEY",
      "BASEBALL",
      "NATATION",
      "MARATHON",
      "KARATÉ",
      "PLANCHE À NEIGE",
      "BADMINTON",
      "CURLING",
      "ESCALADE",
      "TENNIS",
      "RAQUETTE",
      "PATINAGE",
    ],
    Pays: [
      "CANADA",
      "MEXIQUE",
      "JAPON",
      "AUSTRALIE",
      "ÉGYPTE",
      "PORTUGAL",
      "ISLANDE",
      "ARGENTINE",
      "NORVÈGE",
      "MAROC",
      "VIETNAM",
      "SÉNÉGAL",
    ],
    Jeux: [
      "DOMINO",
      "ÉCHECS",
      "DAMES",
      "SOLITAIRE",
      "CASSE-TÊTE",
      "MONOPOLE",
      "PUISSANCE",
      "BATAILLE",
      "DÉS",
      "CARTES",
      "ROULETTE",
      "BINGO",
    ],
  },
  en: {
    Animals: [
      "ELEPHANT",
      "GIRAFFE",
      "KANGAROO",
      "PENGUIN",
      "CROCODILE",
      "OWL",
      "SQUIRREL",
      "MOOSE",
      "BEAVER",
      "BUTTERFLY",
      "TURTLE",
      "DOLPHIN",
      "RACCOON",
      "HEDGEHOG",
      "CHAMELEON",
    ],
    Food: [
      "POUTINE",
      "SPAGHETTI",
      "CROISSANT",
      "CHEESE",
      "BLUEBERRY",
      "GRAPEFRUIT",
      "CHOCOLATE",
      "MAPLE SYRUP",
      "BROCCOLI",
      "HAMBURGER",
      "PANCAKE",
      "RASPBERRY",
      "PUMPKIN",
    ],
    Home: [
      "KITCHEN",
      "FRIDGE",
      "STAIRCASE",
      "WINDOW",
      "PILLOW",
      "CLOSET",
      "FIREPLACE",
      "GARAGE",
      "BOOKSHELF",
      "BALCONY",
      "BASEMENT",
      "BATHTUB",
    ],
    Jobs: [
      "FIREFIGHTER",
      "ROOFER",
      "CARPENTER",
      "PLUMBER",
      "ELECTRICIAN",
      "NURSE",
      "BAKER",
      "PILOT",
      "ASTRONAUT",
      "VETERINARIAN",
      "ARCHITECT",
    ],
    Sports: [
      "HOCKEY",
      "BASEBALL",
      "SWIMMING",
      "MARATHON",
      "KARATE",
      "SNOWBOARD",
      "BADMINTON",
      "CURLING",
      "CLIMBING",
      "TENNIS",
      "SKATING",
    ],
    Countries: [
      "CANADA",
      "MEXICO",
      "JAPAN",
      "AUSTRALIA",
      "EGYPT",
      "PORTUGAL",
      "ICELAND",
      "ARGENTINA",
      "NORWAY",
      "MOROCCO",
      "VIETNAM",
    ],
    Games: [
      "DOMINOES",
      "CHESS",
      "CHECKERS",
      "SOLITAIRE",
      "PUZZLE",
      "BINGO",
      "POKER",
      "ROULETTE",
      "DICE",
      "CARDS",
      "BACKGAMMON",
    ],
  },
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Retire les accents pour comparer les lettres (É devient E)
const plain = (letter) => letter.normalize("NFD").replace(/[̀-ͯ]/g, "");
const isLetter = (ch) => /[A-Z]/.test(plain(ch));

// Les 10 traits du dessin, dans l'ordre
const PARTS = [
  { id: "base", d: "M20 230 H150" },
  { id: "pole", d: "M55 230 V20" },
  { id: "beam", d: "M50 22 H160 M55 60 L92 22" },
  { id: "rope", d: "M150 22 V52" },
  { id: "head", circle: true },
  { id: "body", d: "M150 102 V160" },
  { id: "armL", d: "M150 118 L124 142" },
  { id: "armR", d: "M150 118 L176 142" },
  { id: "legL", d: "M150 160 L128 200" },
  { id: "legR", d: "M150 160 L172 200" },
];

function Gallows({ errors, start, lost, won }) {
  const shown = start + errors;
  return (
    <svg viewBox="0 0 200 240" className="gallows" aria-hidden="true">
      {PARTS.map((part, i) => {
        if (i >= shown) return null;
        const animated = i >= start ? "drawStroke" : "";
        if (part.circle) {
          return (
            <g key={part.id} className={animated}>
              <circle
                cx="150"
                cy="77"
                r="25"
                pathLength="1"
                className="stroke person"
              />
              {/* Visage : content si gagné, X si perdu */}
              {lost ? (
                <g className="face">
                  <path d="M139 70 l7 7 m0 -7 l-7 7 M154 70 l7 7 m0 -7 l-7 7" />
                  <path d="M140 91 q10 -8 20 0" />
                </g>
              ) : (
                <g className="face">
                  <circle cx="142" cy="73" r="2.5" />
                  <circle cx="158" cy="73" r="2.5" />
                  <path
                    d={
                      won
                        ? "M140 85 q10 10 20 0"
                        : errors > 7
                          ? "M141 89 q9 -6 18 0"
                          : "M142 87 h16"
                    }
                  />
                </g>
              )}
            </g>
          );
        }
        const personPart = i >= 5;
        return (
          <path
            key={part.id}
            d={part.d}
            pathLength="1"
            className={`stroke ${personPart ? "person" : "wood"} ${animated}`}
          />
        );
      })}
    </svg>
  );
}

export default function Hangman() {
  const { t, lang } = useLang();
  const bank = WORDS[lang] || WORDS.fr;
  const categories = Object.keys(bank);
  const [savedLang, setSavedLang] = useStored("bgh2_hang_lang", lang);
  const [category, setCategory] = useStored(
    "bgh2_hang_category",
    categories[0],
  );
  const [hard, setHard] = useStored("bgh2_hang_hard", false);
  const [word, setWord] = useStored(
    "bgh2_hang_word",
    () => bank[categories[0]][randomInt(bank[categories[0]].length)],
  );
  const [guessed, setGuessed] = useStored("bgh2_hang_guessed", []);
  const [streak, setStreak] = useStored("bgh2_hang_streak", 0);
  const [twoPlayers, setTwoPlayers] = useStored("bgh2_hang_twoPlayers", false);
  const [secretInput, setSecretInput] = useState("");
  const [askSecret, setAskSecret] = useStored("bgh2_hang_askSecret", false);

  const start = hard ? 4 : 0; // difficile : la potence est déjà montée
  const maxErrors = PARTS.length - start;

  const letters = useMemo(() => word.split(""), [word]);
  const wrong = guessed.filter((g) => !letters.some((ch) => plain(ch) === g));
  const errors = wrong.length;
  const won = letters.every(
    (ch) => !isLetter(ch) || guessed.includes(plain(ch)),
  );
  const lost = errors >= maxErrors;
  const over = won || lost;

  // Nouveau mot quand la langue change
  useEffect(() => {
    if (savedLang === lang) return;
    setSavedLang(lang);
    const cats = Object.keys(WORDS[lang] || WORDS.fr);
    setCategory(cats[0]);
    newWord(cats[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function newWord(cat = category) {
    const list = (WORDS[lang] || WORDS.fr)[cat] || bank[categories[0]];
    let next = list[randomInt(list.length)];
    if (next === word && list.length > 1)
      next = list[(list.indexOf(next) + 1) % list.length];
    setWord(next);
    setGuessed([]);
  }

  function guess(letter) {
    if (over || guessed.includes(letter)) return;
    const next = [...guessed, letter];
    setGuessed(next);
    const hit = letters.some((ch) => plain(ch) === letter);
    if (hit) {
      const nowWon = letters.every(
        (ch) => !isLetter(ch) || next.includes(plain(ch)),
      );
      if (nowWon) {
        sfx.win();
        vibrate([40, 40, 80]);
        if (!twoPlayers) setStreak((s) => s + 1);
        recordGame("hangman", "win", twoPlayers ? undefined : streak + 1);
      } else sfx.good();
    } else {
      const nowErrors = errors + 1;
      if (nowErrors >= maxErrors) {
        sfx.lose();
        vibrate([200, 80, 200]);
        if (!twoPlayers) setStreak(0);
        recordGame("hangman", "loss");
      } else {
        sfx.bad();
        vibrate(40);
      }
    }
  }

  // Clavier physique
  useEffect(() => {
    const onKey = (e) => {
      if (askSecret) return;
      const k = e.key.toUpperCase();
      if (k.length === 1 && k >= "A" && k <= "Z") guess(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function startTwoPlayers(e) {
    e.preventDefault();
    const clean = secretInput
      .toUpperCase()
      .replace(/[^A-ZÀ-ÖØ-Ý' -]/g, "")
      .trim();
    if (clean.replace(/[^A-ZÀ-ÖØ-Ý]/g, "").length < 2) return;
    setWord(clean);
    setGuessed([]);
    setSecretInput("");
    setAskSecret(false);
    setTwoPlayers(true);
  }

  return (
    <div className="game hangman">
      <div className="gameBar">
        <div className="segmented small">
          <button
            className={!twoPlayers ? "active" : ""}
            onClick={() => {
              setTwoPlayers(false);
              newWord();
            }}
          >
            <User size={15} /> Solo
          </button>
          <button
            className={twoPlayers ? "active" : ""}
            onClick={() => setAskSecret(true)}
          >
            <Users size={15} /> {t("2 joueurs", "2 players")}
          </button>
        </div>
        <button
          className={`chipButton ${hard ? "accent" : ""}`}
          onClick={() => {
            setHard(!hard);
            setGuessed([]);
          }}
        >
          {hard ? t("Difficile", "Hard") : t("Facile", "Easy")}
        </button>
      </div>

      {!twoPlayers && (
        <div className="categoryChips">
          {categories.map((cat) => (
            <button
              key={cat}
              className={cat === category ? "active" : ""}
              onClick={() => {
                setCategory(cat);
                newWord(cat);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="hangStage">
        <Gallows errors={errors} start={start} lost={lost} won={won} />
        <div className="hangInfo">
          <div className="lives">
            {Array.from({ length: maxErrors }).map((_, i) => (
              <i key={i} className={i < errors ? "lost" : ""} />
            ))}
          </div>
          <small>
            {t("Erreurs", "Misses")} {errors}/{maxErrors}
          </small>
          {!twoPlayers && (
            <small>
              🔥 {t("Série", "Streak")} : {streak}
            </small>
          )}
          {wrong.length > 0 && (
            <div className="wrongLetters">{wrong.join(" ")}</div>
          )}
        </div>
      </div>

      <div className={`hangWord ${lost ? "lost" : ""} ${won ? "won" : ""}`}>
        {letters.map((ch, i) =>
          ch === " " ? (
            <span key={i} className="gap" />
          ) : !isLetter(ch) ? (
            <span key={i} className="sym">
              {ch}
            </span>
          ) : (
            <span
              key={i}
              className={`slot ${guessed.includes(plain(ch)) ? "found" : ""}`}
            >
              {guessed.includes(plain(ch)) || lost ? ch : ""}
            </span>
          ),
        )}
      </div>

      {over ? (
        <div className={`resultBanner ${won ? "win" : "lose"}`}>
          <strong>
            {won
              ? t("Bravo! 🎉", "You got it! 🎉")
              : t("Pendu! 💀", "Hanged! 💀")}
          </strong>
          <button
            className="bigAction"
            onClick={() => (twoPlayers ? setAskSecret(true) : newWord())}
          >
            <RotateCcw size={20} />
            {t("Nouveau mot", "New word")}
          </button>
        </div>
      ) : (
        <div className="keyboard">
          {ALPHABET.map((letter) => {
            const used = guessed.includes(letter);
            const good = used && letters.some((ch) => plain(ch) === letter);
            return (
              <button
                key={letter}
                className={used ? (good ? "good" : "bad") : ""}
                disabled={used}
                onClick={() => guess(letter)}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {won && <Confetti />}

      {askSecret && (
        <div className="sheetBackdrop" onClick={() => setAskSecret(false)}>
          <form
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            onSubmit={startTwoPlayers}
          >
            <div className="sheetHeader">
              <h2>{t("Mot secret", "Secret word")}</h2>
            </div>
            <p className="muted">
              {t(
                "Le joueur 1 écrit un mot sans que l'autre regarde.",
                "Player 1 types a word while the other looks away.",
              )}
            </p>
            <input
              className="secretInput"
              type="password"
              autoFocus
              autoComplete="off"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder={t("Ton mot…", "Your word…")}
            />
            <button className="bigAction" type="submit">
              {t("C'est parti!", "Start!")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Petite pluie de confettis
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.2,
        color: [
          "#facc15",
          "#ef4444",
          "#22c55e",
          "#3b82f6",
          "#ec4899",
          "#a855f7",
        ][i % 6],
        rotate: Math.random() * 360,
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
