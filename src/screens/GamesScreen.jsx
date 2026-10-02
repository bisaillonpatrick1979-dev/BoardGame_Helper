// Liste des jeux et affichage du jeu choisi
import { Fragment, useState } from "react";
import { useLang, useStored } from "../lib/core.js";
import Hangman from "../games/Hangman.jsx";
import Yams from "../games/Yams.jsx";
import Blackjack from "../games/Blackjack.jsx";
import Connect4 from "../games/Connect4.jsx";
import TicTacToe from "../games/TicTacToe.jsx";
import Memory from "../games/Memory.jsx";
import HigherLower from "../games/HigherLower.jsx";
import Poker from "../games/poker/Poker.jsx";
import Gamebook from "../games/gamebook/Gamebook.jsx";
import LiaAdventure from "../games/lia/LiaAdventure.jsx";
import Solitaire from "../games/solitaire/Solitaire.jsx";
import Crossword from "../games/words/Crossword.jsx";
import WordSearch from "../games/words/WordSearch.jsx";
import VideoPoker from "../games/poker/VideoPoker.jsx";
import DrawPoker from "../games/poker/DrawPoker.jsx";
import OnlineScreen from "../net/OnlineScreen.jsx";

import Cribbage from "../games/additions/Cribbage.jsx";
import Farkle from "../games/additions/Farkle.jsx";
import Dominos from "../games/additions/Dominos.jsx";
import Checkers from "../games/additions/Checkers.jsx";
import CrazyEights from "../games/additions/CrazyEights.jsx";
import Sudoku from "../games/additions/Sudoku.jsx";
import Charades from "../games/additions/Charades.jsx";
import Battleship from "../games/additions/Battleship.jsx";
import TaleBooks from "../games/additions/TaleBooks.jsx";

// Catégories affichées dans la liste des jeux
export const CATEGORIES = [
  { id: "together", fr: "À plusieurs téléphones", en: "Multi-phone" },
  { id: "adventure", fr: "Aventures", en: "Adventures" },
  { id: "cards", fr: "Cartes et casino", en: "Cards & casino" },
  { id: "words", fr: "Mots", en: "Words" },
  { id: "classic", fr: "Classiques", en: "Classics" },
];

export const GAMES = [
  ...[
    [
      "cribbage",
      "cards",
      "🂡",
      "Cribbage",
      "Cribbage",
      "Contre ordinateur, jusqu’à 121 points",
      "Against the computer, first to 121",
      Cribbage,
    ],
    [
      "farkle",
      "classic",
      "🎲",
      "Farkle / 10 000",
      "Farkle / 10,000",
      "Six dés, garde tes points ou tente ta chance",
      "Six dice, bank your points or take a risk",
      Farkle,
    ],
    [
      "dominos",
      "classic",
      "🁣",
      "Dominos",
      "Dominoes",
      "À deux ou contre l’ordinateur",
      "Two players or against the computer",
      Dominos,
    ],
    [
      "checkers",
      "classic",
      "🔵",
      "Dames",
      "Checkers",
      "Prises obligatoires et dames couronnées",
      "Mandatory captures and crowned kings",
      Checkers,
    ],
    [
      "eights",
      "cards",
      "8️⃣",
      "Huit américain",
      "Crazy Eights",
      "Vide ta main, le 8 change la couleur",
      "Empty your hand, eights change suit",
      CrazyEights,
    ],
    [
      "sudoku",
      "classic",
      "🔢",
      "Sudoku",
      "Sudoku",
      "Trois niveaux et un défi quotidien",
      "Three levels and a daily challenge",
      Sudoku,
    ],
    [
      "charades",
      "words",
      "🎭",
      "Charades et mime",
      "Charades",
      "Deux équipes, mots et minuteur",
      "Two teams, words and a timer",
      Charades,
    ],
    [
      "naval",
      "classic",
      "🚢",
      "Bataille navale",
      "Battleship",
      "Coule la flotte de l’ordinateur",
      "Sink the computer’s fleet",
      Battleship,
    ],
    [
      "talebooks",
      "adventure",
      "📚",
      "Autres livres-jeux",
      "More gamebooks",
      "Le phare oublié et le signal des étoiles",
      "The forgotten lighthouse and the star signal",
      TaleBooks,
    ],
  ].map(([id, cat, emoji, fr, en, descFr, descEn, component]) => ({
    id,
    cat,
    emoji,
    name: { fr, en },
    desc: { fr: descFr, en: descEn },
    colors: ["#155e75", "#3730a3"],
    component,
  })),
  {
    id: "online",
    cat: "together",
    emoji: "📱",
    name: { fr: "Jouer ensemble", en: "Play together" },
    desc: {
      fr: "Poker, cartes, dés… chacun sur son téléphone",
      en: "Poker, cards, dice… each on your own phone",
    },
    colors: ["#0ea5e9", "#7c3aed"],
    component: OnlineScreen,
  },
  {
    id: "lia",
    cat: "adventure",
    emoji: "✨",
    name: { fr: "Aventure avec Lia", en: "Adventure with Lia" },
    desc: {
      fr: "Jeu de rôle : une IA maître du jeu",
      en: "Role-play with an AI game master",
    },
    colors: ["#6d28d9", "#0e7490"],
    component: LiaAdventure,
  },
  {
    id: "gamebook",
    cat: "adventure",
    emoji: "🐦‍⬛",
    name: { fr: "La Crypte du Roi-Corbeau", en: "The Raven King's Crypt" },
    desc: {
      fr: "Aventure dont tu es le héros : combats aux dés",
      en: "Choose-your-path adventure with dice combat",
    },
    colors: ["#1e1b4b", "#7f1d1d"],
    component: Gamebook,
  },
  {
    id: "solitaire",
    cat: "cards",
    emoji: "🂡",
    name: { fr: "Solitaires", en: "Solitaire" },
    desc: {
      fr: "Klondike, FreeCell, Araignée, Pyramide et Golf",
      en: "Klondike, FreeCell, Spider, Pyramid and Golf",
    },
    colors: ["#16a34a", "#14532d"],
    component: Solitaire,
  },
  {
    id: "videopoker",
    cat: "cards",
    emoji: "🎰",
    name: { fr: "Poker vidéo", en: "Video Poker" },
    desc: {
      fr: "Jacks or Better et Deuces Wild",
      en: "Jacks or Better and Deuces Wild",
    },
    colors: ["#1e3a8a", "#b45309"],
    component: VideoPoker,
  },
  {
    id: "drawpoker",
    cat: "cards",
    emoji: "♣️",
    name: { fr: "Poker 5 cartes", en: "Five-Card Draw" },
    desc: {
      fr: "Échange tes cartes contre 1 à 5 adversaires",
      en: "Swap cards vs 1 to 5 opponents",
    },
    colors: ["#7c2d12", "#15803d"],
    component: DrawPoker,
  },
  {
    id: "crossword",
    cat: "words",
    emoji: "✏️",
    name: { fr: "Mots croisés", en: "Crossword" },
    desc: {
      fr: "Grilles toujours nouvelles, 3 niveaux",
      en: "Fresh grids every time, 3 levels",
    },
    colors: ["#0ea5e9", "#6366f1"],
    component: Crossword,
  },
  {
    id: "wordsearch",
    cat: "words",
    emoji: "🔍",
    name: { fr: "Mots cachés", en: "Word Search" },
    desc: {
      fr: "Trouve les mots cachés dans la grille",
      en: "Find the hidden words in the grid",
    },
    colors: ["#f59e0b", "#ec4899"],
    component: WordSearch,
  },
  {
    id: "hangman",
    cat: "words",
    emoji: "🪢",
    name: { fr: "Pendu", en: "Hangman" },
    desc: {
      fr: "Devine le mot avant d'être pendu",
      en: "Guess the word before you hang",
    },
    colors: ["#7c3aed", "#db2777"],
    component: Hangman,
  },
  {
    id: "yams",
    cat: "classic",
    emoji: "🎲",
    name: { fr: "Yam's", en: "Yahtzee" },
    desc: {
      fr: "5 dés 3D, 3 lancers, 13 cases",
      en: "5 3D dice, 3 rolls, 13 boxes",
    },
    colors: ["#2563eb", "#0891b2"],
    component: Yams,
  },
  {
    id: "blackjack",
    cat: "cards",
    emoji: "🃏",
    name: { fr: "Blackjack", en: "Blackjack" },
    desc: {
      fr: "Approche 21 sans dépasser",
      en: "Get close to 21 without busting",
    },
    colors: ["#15803d", "#0f766e"],
    component: Blackjack,
  },
  {
    id: "poker",
    cat: "cards",
    emoji: "♠️",
    name: { fr: "Poker", en: "Poker" },
    desc: {
      fr: "Hold'em ou Omaha contre 1 à 5 adversaires",
      en: "Hold'em or Omaha vs 1 to 5 opponents",
    },
    colors: ["#111827", "#b91c1c"],
    component: Poker,
  },
  {
    id: "connect4",
    cat: "classic",
    emoji: "🔴",
    name: { fr: "Puissance 4", en: "Connect 4" },
    desc: { fr: "Aligne 4 jetons", en: "Line up 4 discs" },
    colors: ["#dc2626", "#ca8a04"],
    component: Connect4,
  },
  {
    id: "tictactoe",
    cat: "classic",
    emoji: "❌",
    name: { fr: "Tic-tac-toe", en: "Tic-tac-toe" },
    desc: { fr: "Le classique à 9 cases", en: "The 9-square classic" },
    colors: ["#0ea5e9", "#6366f1"],
    component: TicTacToe,
  },
  {
    id: "memory",
    cat: "classic",
    emoji: "🧠",
    name: { fr: "Memory", en: "Memory" },
    desc: { fr: "Retrouve les paires de cartes", en: "Find matching pairs" },
    colors: ["#ea580c", "#db2777"],
    component: Memory,
  },
  {
    id: "higherlower",
    cat: "cards",
    emoji: "↕️",
    name: { fr: "Plus haut, plus bas", en: "Higher or Lower" },
    desc: { fr: "Devine la prochaine carte", en: "Guess the next card" },
    colors: ["#9333ea", "#4f46e5"],
    component: HigherLower,
  },
];

const MODES = {
  online: ["group"],
  lia: ["solo", "group"],
  gamebook: ["solo"],
  talebooks: ["solo"],
  solitaire: ["solo"],
  videopoker: ["solo"],
  drawpoker: ["solo"],
  crossword: ["solo"],
  wordsearch: ["solo"],
  hangman: ["solo", "two"],
  yams: ["solo", "two", "group"],
  blackjack: ["solo"],
  poker: ["solo"],
  connect4: ["solo", "two"],
  tictactoe: ["solo", "two"],
  memory: ["solo", "two"],
  higherlower: ["solo"],
  cribbage: ["solo"],
  farkle: ["solo", "two", "group"],
  dominos: ["solo", "two"],
  checkers: ["solo", "two"],
  eights: ["solo", "two"],
  sudoku: ["solo"],
  charades: ["group"],
  naval: ["solo"],
};
const TIMES = {
  online: "5–60",
  lia: "20–120",
  gamebook: "20–45",
  talebooks: "5–15",
  solitaire: "5–20",
  videopoker: "1–5",
  drawpoker: "5–20",
  crossword: "10–30",
  wordsearch: "5–15",
  hangman: "2–5",
  yams: "15–30",
  blackjack: "1–5",
  poker: "15–60",
  connect4: "3–10",
  tictactoe: "1–3",
  memory: "3–10",
  higherlower: "1–5",
  cribbage: "15–30",
  farkle: "10–30",
  dominos: "5–15",
  checkers: "10–30",
  eights: "5–15",
  sudoku: "10–45",
  charades: "5–30",
  naval: "10–20",
};
export default function GamesScreen({ game, onOpen, players, theme, sound }) {
  const { lang, t } = useLang();
  const [mode, setMode] = useState("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useStored("bgh2_favorites", []);
  const current = GAMES.find((g) => g.id === game);
  if (current) {
    const Game = current.component;
    return <Game players={players} theme={theme} sound={sound} />;
  }
  const visible = GAMES.filter(
    (g) =>
      (mode === "all" ||
        (mode === "favorites" && favorites.includes(g.id)) ||
        (mode === "offline" && !["online", "lia"].includes(g.id)) ||
        (MODES[g.id] || []).includes(mode)) &&
      `${g.name[lang]} ${g.desc[lang]}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <div className="gameCatalog">
      <input
        className="gameSearch"
        aria-label={t("Chercher un jeu", "Find a game")}
        placeholder={t("Chercher un jeu…", "Find a game…")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="catalogFilters">
        {[
          ["all", t("Tous", "All")],
          ["solo", t("Seul", "Solo")],
          ["two", t("À deux", "Two players")],
          ["group", t("En groupe", "Group")],
          ["offline", t("Sans Internet", "Offline")],
          ["favorites", t("Favoris", "Favorites")],
        ].map(([id, label]) => (
          <button
            className={`chipButton ${mode === id ? "selected" : ""}`}
            aria-pressed={mode === id}
            key={id}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="muted">
        {t(
          "Durées approximatives. Le mode hors ligne nécessite une première ouverture avec Internet.",
          "Approximate durations. Offline mode needs a first visit with internet.",
        )}
      </p>
      {!visible.length && (
        <p role="status">
          {t("Aucun jeu pour ce filtre.", "No games match this filter.")}
        </p>
      )}
      <div className="gamesGrid">
        {CATEGORIES.map((cat) => (
          <Fragment key={cat.id}>
            {visible.some((g) => g.cat === cat.id) && (
              <h3 className="gamesCat">{cat[lang]}</h3>
            )}
            {visible
              .filter((g) => g.cat === cat.id)
              .map((g) => (
                <div key={g.id} className="catalogTile">
                  <button
                    className="gameTile"
                    style={{ "--g1": g.colors[0], "--g2": g.colors[1] }}
                    onClick={() => onOpen(g.id)}
                  >
                    <span className="gameEmoji">{g.emoji}</span>
                    <strong>{g.name[lang]}</strong>
                    <small>{g.desc[lang]}</small>
                    <small>
                      {TIMES[g.id]} min ·{" "}
                      {["online", "lia"].includes(g.id)
                        ? t("Internet", "Internet")
                        : t("Hors ligne", "Offline")}
                    </small>
                  </button>
                  <button
                    className="favoriteButton"
                    aria-pressed={favorites.includes(g.id)}
                    aria-label={`${t("Favori", "Favorite")}: ${g.name[lang]}`}
                    onClick={() =>
                      setFavorites((v) =>
                        v.includes(g.id)
                          ? v.filter((id) => id !== g.id)
                          : [...v, g.id],
                      )
                    }
                  >
                    {favorites.includes(g.id) ? "★" : "☆"}
                  </button>
                </div>
              ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
