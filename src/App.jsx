// Board Game Helper — coquille de l'application : en-tête, écrans, barre d'onglets
import { useEffect, useState } from "react";
import { ChevronLeft, Dice5, Gamepad2, Home, Settings, Spade, Trophy } from "lucide-react";
import { LangContext, setSoundEnabled, useStored } from "./lib/core.js";
import HomeScreen from "./screens/HomeScreen.jsx";
import DiceScreen from "./screens/DiceScreen.jsx";
import CardsScreen from "./screens/CardsScreen.jsx";
import GamesScreen, { GAMES } from "./screens/GamesScreen.jsx";
import ToolsScreen from "./screens/ToolsScreen.jsx";
import SettingsSheet, { THEMES } from "./screens/SettingsSheet.jsx";

const DEFAULT_PLAYERS = [
  { id: 1, name: "Joueur 1", score: 0, money: 1500 },
  { id: 2, name: "Joueur 2", score: 0, money: 1500 }
];

export default function App() {
  const [lang, setLang] = useStored("bgh2_lang", () => (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en");
  const [theme, setTheme] = useStored("bgh2_theme", "classic");
  const [sound, setSound] = useStored("bgh2_sound", true);
  const [players, setPlayers] = useStored("bgh2_players", DEFAULT_PLAYERS);
  const [tab, setTab] = useState("home");
  const [tool, setTool] = useState("scores");
  const [game, setGame] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const t = (fr, en) => (lang === "fr" ? fr : en);

  useEffect(() => setSoundEnabled(sound), [sound]);

  // Couleurs du thème appliquées à toute la page (y compris la barre d'état)
  useEffect(() => {
    const current = THEMES.find((item) => item.id === theme) || THEMES[0];
    document.documentElement.dataset.theme = current.id;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", current.bg);
  }, [theme]);

  const tabs = [
    { id: "home", label: t("Accueil", "Home"), icon: Home },
    { id: "dice", label: t("Dés", "Dice"), icon: Dice5 },
    { id: "cards", label: t("Cartes", "Cards"), icon: Spade },
    { id: "games", label: t("Jeux", "Games"), icon: Gamepad2 },
    { id: "tools", label: t("Outils", "Tools"), icon: Trophy }
  ];

  const openGame = (id) => {
    setGame(id);
    setTab("games");
  };

  const openTool = (id) => {
    setTool(id);
    setTab("tools");
  };

  const currentGame = GAMES.find((g) => g.id === game);
  const title =
    tab === "games" && currentGame
      ? currentGame.name[lang]
      : { home: "Board Game Helper", dice: t("Dés", "Dice"), cards: t("Cartes", "Cards"), games: t("Jeux", "Games"), tools: t("Outils", "Tools") }[tab];

  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        <header className="topBar">
          {tab === "games" && currentGame ? (
            <button className="iconButton" onClick={() => setGame(null)} aria-label={t("Retour", "Back")}>
              <ChevronLeft size={24} />
            </button>
          ) : (
            <span className="topBarLogo" aria-hidden="true">
              <Dice5 size={22} />
            </span>
          )}
          <h1 className="topBarTitle">{title}</h1>
          <button className="iconButton" onClick={() => setSettingsOpen(true)} aria-label={t("Réglages", "Settings")}>
            <Settings size={22} />
          </button>
        </header>

        <main className={`screen screen-${tab}`}>
          {tab === "home" && <HomeScreen onTab={setTab} onGame={openGame} onTool={openTool} />}
          {tab === "dice" && <DiceScreen theme={theme} sound={sound} />}
          {tab === "cards" && <CardsScreen players={players} />}
          {tab === "games" && <GamesScreen game={game} onOpen={setGame} players={players} theme={theme} sound={sound} />}
          {tab === "tools" && <ToolsScreen tool={tool} onTool={setTool} players={players} setPlayers={setPlayers} />}
        </main>

        <nav className="bottomNav">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                if (id === "games" && tab === "games") setGame(null);
                setTab(id);
              }}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {settingsOpen && (
          <SettingsSheet
            onClose={() => setSettingsOpen(false)}
            lang={lang}
            setLang={setLang}
            theme={theme}
            setTheme={setTheme}
            sound={sound}
            setSound={setSound}
          />
        )}
      </div>
    </LangContext.Provider>
  );
}
