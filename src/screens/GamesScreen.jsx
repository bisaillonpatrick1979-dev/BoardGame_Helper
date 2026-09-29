// Liste des jeux et affichage du jeu choisi
import { Fragment } from "react";
import { useLang } from "../lib/core.js";
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

// Catégories affichées dans la liste des jeux
export const CATEGORIES = [
  { id: "together", fr: "À plusieurs téléphones", en: "Multi-phone" },
  { id: "adventure", fr: "Aventures", en: "Adventures" },
  { id: "cards", fr: "Cartes et casino", en: "Cards & casino" },
  { id: "words", fr: "Mots", en: "Words" },
  { id: "classic", fr: "Classiques", en: "Classics" }
];

export const GAMES = [
  {
    id: "online",
    cat: "together",
    emoji: "📱",
    name: { fr: "Jouer ensemble", en: "Play together" },
    desc: { fr: "Poker, cartes, dés… chacun sur son téléphone", en: "Poker, cards, dice… each on your own phone" },
    colors: ["#0ea5e9", "#7c3aed"],
    component: OnlineScreen
  },
  {
    id: "lia",
    cat: "adventure",
    emoji: "✨",
    name: { fr: "Aventure avec Lia", en: "Adventure with Lia" },
    desc: { fr: "Jeu de rôle : une IA maître du jeu", en: "Role-play with an AI game master" },
    colors: ["#6d28d9", "#0e7490"],
    component: LiaAdventure
  },
  {
    id: "gamebook",
    cat: "adventure",
    emoji: "🐦‍⬛",
    name: { fr: "La Crypte du Roi-Corbeau", en: "The Raven King's Crypt" },
    desc: { fr: "Aventure dont tu es le héros : combats aux dés", en: "Choose-your-path adventure with dice combat" },
    colors: ["#1e1b4b", "#7f1d1d"],
    component: Gamebook
  },
  {
    id: "solitaire",
    cat: "cards",
    emoji: "🂡",
    name: { fr: "Solitaires", en: "Solitaire" },
    desc: { fr: "Klondike, FreeCell, Araignée, Pyramide et Golf", en: "Klondike, FreeCell, Spider, Pyramid and Golf" },
    colors: ["#16a34a", "#14532d"],
    component: Solitaire
  },
  {
    id: "videopoker",
    cat: "cards",
    emoji: "🎰",
    name: { fr: "Poker vidéo", en: "Video Poker" },
    desc: { fr: "Jacks or Better et Deuces Wild", en: "Jacks or Better and Deuces Wild" },
    colors: ["#1e3a8a", "#b45309"],
    component: VideoPoker
  },
  {
    id: "drawpoker",
    cat: "cards",
    emoji: "♣️",
    name: { fr: "Poker 5 cartes", en: "Five-Card Draw" },
    desc: { fr: "Échange tes cartes contre 1 à 5 adversaires", en: "Swap cards vs 1 to 5 opponents" },
    colors: ["#7c2d12", "#15803d"],
    component: DrawPoker
  },
  {
    id: "crossword",
    cat: "words",
    emoji: "✏️",
    name: { fr: "Mots croisés", en: "Crossword" },
    desc: { fr: "Grilles toujours nouvelles, 3 niveaux", en: "Fresh grids every time, 3 levels" },
    colors: ["#0ea5e9", "#6366f1"],
    component: Crossword
  },
  {
    id: "wordsearch",
    cat: "words",
    emoji: "🔍",
    name: { fr: "Mots cachés", en: "Word Search" },
    desc: { fr: "Trouve les mots cachés dans la grille", en: "Find the hidden words in the grid" },
    colors: ["#f59e0b", "#ec4899"],
    component: WordSearch
  },
  {
    id: "hangman",
    cat: "words",
    emoji: "🪢",
    name: { fr: "Pendu", en: "Hangman" },
    desc: { fr: "Devine le mot avant d'être pendu", en: "Guess the word before you hang" },
    colors: ["#7c3aed", "#db2777"],
    component: Hangman
  },
  {
    id: "yams",
    cat: "classic",
    emoji: "🎲",
    name: { fr: "Yam's", en: "Yahtzee" },
    desc: { fr: "5 dés 3D, 3 lancers, 13 cases", en: "5 3D dice, 3 rolls, 13 boxes" },
    colors: ["#2563eb", "#0891b2"],
    component: Yams
  },
  {
    id: "blackjack",
    cat: "cards",
    emoji: "🃏",
    name: { fr: "Blackjack", en: "Blackjack" },
    desc: { fr: "Approche 21 sans dépasser", en: "Get close to 21 without busting" },
    colors: ["#15803d", "#0f766e"],
    component: Blackjack
  },
  {
    id: "poker",
    cat: "cards",
    emoji: "♠️",
    name: { fr: "Poker", en: "Poker" },
    desc: { fr: "Hold'em ou Omaha contre 1 à 5 adversaires", en: "Hold'em or Omaha vs 1 to 5 opponents" },
    colors: ["#111827", "#b91c1c"],
    component: Poker
  },
  {
    id: "connect4",
    cat: "classic",
    emoji: "🔴",
    name: { fr: "Puissance 4", en: "Connect 4" },
    desc: { fr: "Aligne 4 jetons", en: "Line up 4 discs" },
    colors: ["#dc2626", "#ca8a04"],
    component: Connect4
  },
  {
    id: "tictactoe",
    cat: "classic",
    emoji: "❌",
    name: { fr: "Tic-tac-toe", en: "Tic-tac-toe" },
    desc: { fr: "Le classique à 9 cases", en: "The 9-square classic" },
    colors: ["#0ea5e9", "#6366f1"],
    component: TicTacToe
  },
  {
    id: "memory",
    cat: "classic",
    emoji: "🧠",
    name: { fr: "Memory", en: "Memory" },
    desc: { fr: "Retrouve les paires de cartes", en: "Find matching pairs" },
    colors: ["#ea580c", "#db2777"],
    component: Memory
  },
  {
    id: "higherlower",
    cat: "cards",
    emoji: "↕️",
    name: { fr: "Plus haut, plus bas", en: "Higher or Lower" },
    desc: { fr: "Devine la prochaine carte", en: "Guess the next card" },
    colors: ["#9333ea", "#4f46e5"],
    component: HigherLower
  }
];

export default function GamesScreen({ game, onOpen, players, theme, sound }) {
  const { lang } = useLang();
  const current = GAMES.find((g) => g.id === game);

  if (current) {
    const Game = current.component;
    return <Game players={players} theme={theme} sound={sound} />;
  }

  return (
    <div className="gamesGrid">
      {CATEGORIES.map((cat) => (
        <Fragment key={cat.id}>
          <h3 className="gamesCat">{cat[lang]}</h3>
          {GAMES.filter((g) => g.cat === cat.id).map((g) => (
            <button key={g.id} className={`gameTile ${g.id === "online" ? "wide" : ""}`} style={{ "--g1": g.colors[0], "--g2": g.colors[1] }} onClick={() => onOpen(g.id)}>
              <span className="gameEmoji">{g.emoji}</span>
              <strong>{g.name[lang]}</strong>
              <small>{g.desc[lang]}</small>
            </button>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
