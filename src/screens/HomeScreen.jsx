// Écran d'accueil : accès rapide à tout, sans défilement
import { Dice5, Gamepad2, Puzzle, Spade } from "lucide-react";
import { useLang } from "../lib/core.js";
import { GAMES } from "./GamesScreen.jsx";
import { PlayerChips } from "./PlayersSheet.jsx";
import { useRoom } from "../net/room.js";

export default function HomeScreen({
  onTab,
  onGame,
  onTool,
  players,
  onPlayers,
  lastGame,
}) {
  const { t, lang } = useLang();
  const room = useRoom();
  // Jeux vedettes (Jouer ensemble, Lia et le livre-jeu ont déjà leur bouton plus haut)
  const featured = GAMES.filter((g) =>
    ["solitaire", "poker", "crossword", "yams"].includes(g.id),
  );

  return (
    <div className="home">
      {lastGame && GAMES.some((g) => g.id === lastGame) && (
        <button className="resumeGame" onClick={() => onGame(lastGame)}>
          ▶ {t("Retour au dernier jeu", "Back to last game")} ·{" "}
          {GAMES.find((g) => g.id === lastGame).name[lang]}
        </button>
      )}
      {/* Jouer ensemble : chacun sur son téléphone */}
      <button className="homeTogether" onClick={() => onGame("online")}>
        <span className="homeTogetherIcon">📱📱</span>
        <span className="homeTogetherText">
          <strong>
            {room.code
              ? `${t("Partie en cours", "Game in progress")} · ${room.code}`
              : t("Jouer ensemble", "Play together")}
          </strong>
          <small>
            {t(
              "Poker, cartes, dés… chacun sur son téléphone. Invite tes amis par texto!",
              "Poker, cards, dice… each on your own phone. Invite friends by text!",
            )}
          </small>
        </span>
        {room.code && <i className="homeTogetherLive" />}
      </button>

      {/* Les deux aventures en vedette : livre dont tu es le héros et jeu de rôle avec Lia (IA) */}
      <section className="homeAdventures">
        <button
          className="adventureCard advBook"
          onClick={() => onGame("gamebook")}
        >
          <span className="advBadge">{t("Livre-jeu", "Gamebook")}</span>
          <span className="advEmoji">🐦‍⬛</span>
          <strong>
            {t("Livre dont tu es le héros", "Choose-your-path book")}
          </strong>
          <small>
            {t(
              "La Crypte du Roi-Corbeau · combats aux dés",
              "The Raven King's Crypt · dice combat",
            )}
          </small>
        </button>
        <button className="adventureCard advLia" onClick={() => onGame("lia")}>
          <span className="advBadge">{t("IA", "AI")}</span>
          <span className="advEmoji">🐉</span>
          <strong>{t("Donjons avec Lia", "Dungeons with Lia")}</strong>
          <small>
            {t(
              "Jeu de rôle, Lia est la maître du jeu",
              "Role-play, Lia is your game master",
            )}
          </small>
        </button>
      </section>

      <div className="homePlayers">
        <span>{t("À la table", "At the table")}</span>
        <PlayerChips players={players} onOpen={onPlayers} />
      </div>

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
          ["scores", "🏆", t("Scores", "Scores")],
        ].map(([id, emoji, label]) => (
          <button
            key={id}
            className="homeTile small"
            onClick={() => onTool(id)}
          >
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
          <button
            key={g.id}
            className="homeGame"
            style={{ "--g1": g.colors[0], "--g2": g.colors[1] }}
            onClick={() => onGame(g.id)}
          >
            <span className="homeGameIcon">{g.emoji}</span>
            <span>{g.name[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
