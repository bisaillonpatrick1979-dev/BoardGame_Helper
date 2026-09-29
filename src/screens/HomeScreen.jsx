// Écran d'accueil : accès rapide à tout, sans défilement
import { Dice5, Gamepad2, Puzzle, Spade } from "lucide-react";
import { useLang } from "../lib/core.js";
import { GAMES } from "./GamesScreen.jsx";
import PlayingCard from "../cards/PlayingCard.jsx";

const HERO_CARDS = [
  { id: "h1", rank: "A", suit: "spades" },
  { id: "h2", rank: "K", suit: "hearts" },
  { id: "h3", rank: "Q", suit: "diamonds" }
];

export default function HomeScreen({ onTab, onGame, onTool }) {
  const { t, lang } = useLang();
  const featured = GAMES.slice(0, 4);

  return (
    <div className="home">
      <section className="homeHero">
        <div className="heroCards" aria-hidden="true">
          {HERO_CARDS.map((card, i) => (
            <PlayingCard key={card.id} card={card} width={62} className={`heroCard heroCard${i}`} />
          ))}
        </div>
        <div className="heroText">
          <h2>{t("Ta trousse de secours pour soirées de jeux", "Your game-night rescue kit")}</h2>
          <p>{t("Dés, cartes, sablier, compteurs, argent, titres… L'app remplace ce qui manque à ton jeu, même sans Internet.", "Dice, cards, hourglass, counters, money, deeds… The app replaces what your game is missing, even offline.")}</p>
        </div>
      </section>

      <div className="homeSectionTitle">
        <Puzzle size={18} />
        <span>{t("Il te manque une pièce?", "Missing a piece?")}</span>
        <button className="linkButton" onClick={() => onTab("tools")}>
          {t("Tout voir", "See all")}
        </button>
      </div>
      <div className="homeTiles">
        <button className="homeTile tileDice" onClick={() => onTab("dice")}>
          <Dice5 size={30} />
          <strong>{t("Dés 3D", "3D Dice")}</strong>
          <small>D4 → D20</small>
        </button>
        <button className="homeTile tileCards" onClick={() => onTab("cards")}>
          <Spade size={30} />
          <strong>{t("Cartes", "Cards")}</strong>
          <small>{t("Piger, distribuer", "Draw, deal")}</small>
        </button>
        {[
          ["hourglass", "⏳", t("Sablier", "Hourglass")],
          ["counters", "🔢", t("Compteurs", "Counters")],
          ["property", "🏠", t("Kit immo", "Property kit")],
          ["bank", "💰", t("Banque", "Bank")],
          ["customdice", "🎨", t("Dés spéciaux", "Special dice")],
          ["scores", "🏆", t("Scores", "Scores")]
        ].map(([id, emoji, label]) => (
          <button key={id} className="homeTile small" onClick={() => onTool(id)}>
            <span className="tileEmoji">{emoji}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      <div className="homeSectionTitle">
        <Gamepad2 size={18} />
        <span>{t("Jeux", "Games")}</span>
        <button className="linkButton" onClick={() => onTab("games")}>
          {t("Tout voir", "See all")} ({GAMES.length})
        </button>
      </div>
      <div className="homeGames">
        {featured.map((g) => (
          <button key={g.id} className="homeGame" style={{ "--g1": g.colors[0], "--g2": g.colors[1] }} onClick={() => onGame(g.id)}>
            <span className="homeGameIcon">{g.emoji}</span>
            <span>{g.name[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
