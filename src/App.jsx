// Board Game Helper — coquille de l'application : en-tête, écrans, barre d'onglets
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Dice5,
  Gamepad2,
  Home,
  Puzzle,
  Settings,
  Spade,
  UserRound,
  Users,
} from "lucide-react";
import { LangContext, setSoundEnabled, useStored } from "./lib/core.js";
import HomeScreen from "./screens/HomeScreen.jsx";
import DiceScreen from "./screens/DiceScreen.jsx";
import CardsScreen from "./screens/CardsScreen.jsx";
import GamesScreen, { GAMES } from "./screens/GamesScreen.jsx";
import ToolsScreen, { TOOLS } from "./screens/ToolsScreen.jsx";
import SettingsSheet, { THEMES } from "./screens/SettingsSheet.jsx";
import AccountSheet from "./screens/AccountSheet.jsx";
import PlayersSheet from "./screens/PlayersSheet.jsx";
import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { PENDING_JOIN_KEY } from "./net/OnlineScreen.jsx";

// Lien d'invitation « ?join=CODE&h=empreinte » : on le garde de côté puis on nettoie l'adresse
function takeInviteFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("join") || "").toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return false;
    const pin = params.get("h");
    sessionStorage.setItem(
      PENDING_JOIN_KEY,
      JSON.stringify({
        code,
        pin: pin && /^[0-9a-f]{10}$/.test(pin) ? pin : null,
      }),
    );
    window.history.replaceState(null, "", window.location.pathname);
    return true;
  } catch {
    return false;
  }
}
const INVITED = typeof window !== "undefined" && takeInviteFromUrl();

const DEFAULT_PLAYERS = [
  { id: 1, name: "Joueur 1", score: 0, money: 1500 },
  { id: 2, name: "Joueur 2", score: 0, money: 1500 },
];

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user, profile, sync, recovery } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [lang, setLang] = useStored("bgh2_lang", () =>
    (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en",
  );
  const [theme, setTheme] = useStored("bgh2_theme", "classic");
  const [sound, setSound] = useStored("bgh2_sound", true);
  const [players, setPlayers] = useStored("bgh2_players", DEFAULT_PLAYERS);
  // Arrivé par un lien d'invitation : on ouvre directement « Jouer ensemble »
  const [tab, setTab] = useState(INVITED ? "games" : "home");
  const [lastGame, setLastGame] = useStored("bgh2_last_game", null);
  const [largeText, setLargeText] = useStored("bgh2_large_text", false);
  const [highContrast, setHighContrast] = useStored(
    "bgh2_high_contrast",
    false,
  );
  const [reducedMotion, setReducedMotion] = useStored(
    "bgh2_reduced_motion",
    false,
  );
  const [tool, setTool] = useState(null);
  const [game, setGame] = useState(INVITED ? "online" : null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);

  const t = (fr, en) => (lang === "fr" ? fr : en);

  useEffect(() => setSoundEnabled(sound), [sound]);

  // Un écran peut demander d'ouvrir le compte (ex. : Lia exige une connexion)
  useEffect(() => {
    const open = () => setAccountOpen(true);
    window.addEventListener("bgh-open-account", open);
    return () => window.removeEventListener("bgh-open-account", open);
  }, []);

  // Retour d'un lien « mot de passe oublié » : ouvre le compte
  useEffect(() => {
    if (recovery) setAccountOpen(true);
  }, [recovery]);

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
    { id: "tools", label: t("Pièces", "Pieces"), icon: Puzzle },
  ];

  const openGame = (id) => {
    setGame(id);
    setLastGame(id);
    setTab("games");
  };

  const openTool = (id) => {
    setTool(id);
    setTab("tools");
  };

  const currentGame = GAMES.find((g) => g.id === game);
  const currentTool = TOOLS.find((x) => x.id === tool);
  const inSub =
    (tab === "games" && currentGame) || (tab === "tools" && currentTool);
  const title =
    tab === "games" && currentGame
      ? currentGame.name[lang]
      : tab === "tools" && currentTool
        ? currentTool[lang]
        : {
            home: "Board Game Helper",
            dice: t("Dés", "Dice"),
            cards: t("Cartes", "Cards"),
            games: t("Jeux", "Games"),
            tools: t("Pièces", "Pieces"),
          }[tab];

  return (
    <LangContext.Provider value={lang}>
      <div
        className={`app ${largeText ? "largeText" : ""} ${highContrast ? "highContrast" : ""} ${reducedMotion ? "reducedMotion" : ""}`}
      >
        <header className="topBar">
          {inSub ? (
            <button
              className="iconButton"
              onClick={() => (tab === "games" ? setGame(null) : setTool(null))}
              aria-label={t("Retour", "Back")}
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <span className="topBarLogo" aria-hidden="true">
              <Dice5 size={22} />
            </span>
          )}
          <h1 className="topBarTitle">{title}</h1>
          <button
            className="iconButton playersButton"
            onClick={() => setPlayersOpen(true)}
            aria-label={t("Joueurs", "Players")}
          >
            <Users size={22} />
            <b className="countBadge">{players.length}</b>
          </button>
          <button
            className={`iconButton accountButton ${user ? "signedIn" : ""} sync-${sync.status}`}
            onClick={() => setAccountOpen(true)}
            aria-label={t("Compte", "Account")}
          >
            {user ? (
              <span className="miniAvatar">
                {(profile?.display_name || user.email || "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            ) : (
              <UserRound size={22} />
            )}
          </button>
          <button
            className="iconButton"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("Réglages", "Settings")}
          >
            <Settings size={22} />
          </button>
        </header>

        <UpdateNotice t={t} />
        <main className={`screen screen-${tab}`}>
          {tab === "home" && (
            <HomeScreen
              lastGame={lastGame}
              onTab={setTab}
              onGame={openGame}
              onTool={openTool}
              players={players}
              onPlayers={() => setPlayersOpen(true)}
            />
          )}
          {tab === "dice" && (
            <DiceScreen theme={theme} sound={sound} onTool={openTool} />
          )}
          {tab === "cards" && <CardsScreen players={players} />}
          {tab === "games" && (
            <GamesScreen
              game={game}
              onOpen={openGame}
              players={players}
              theme={theme}
              sound={sound}
            />
          )}
          {tab === "tools" && (
            <ToolsScreen
              tool={tool}
              onTool={setTool}
              players={players}
              setPlayers={setPlayers}
            />
          )}
        </main>

        <nav className="bottomNav">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                if (id === "games" && tab === "games") setGame(null);
                if (id === "tools" && tab === "tools") setTool(null);
                setTab(id);
              }}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {accountOpen && <AccountSheet onClose={() => setAccountOpen(false)} />}

        {playersOpen && (
          <PlayersSheet
            players={players}
            setPlayers={setPlayers}
            onClose={() => setPlayersOpen(false)}
          />
        )}

        {settingsOpen && (
          <SettingsSheet
            onClose={() => setSettingsOpen(false)}
            lang={lang}
            setLang={setLang}
            theme={theme}
            setTheme={setTheme}
            sound={sound}
            setSound={setSound}
            largeText={largeText}
            setLargeText={setLargeText}
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
          />
        )}
      </div>
    </LangContext.Provider>
  );
}

function UpdateNotice({ t }) {
  const [worker, setWorker] = useState(null);
  useEffect(() => {
    const receive = (event) => setWorker(event.detail);
    window.addEventListener("bgh-update-ready", receive);
    navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg?.waiting) setWorker(reg.waiting);
    });
    return () => window.removeEventListener("bgh-update-ready", receive);
  }, []);
  if (!worker) return null;
  return (
    <aside className="updateNotice" role="status">
      <span>
        {t(
          "Mise à jour prête. Termine ta partie avant de l'installer.",
          "Update ready. Finish your game before installing.",
        )}
      </span>
      <button
        className="chipButton"
        onClick={() => worker.postMessage({ type: "SKIP_WAITING" })}
      >
        {t("Installer", "Install")}
      </button>
    </aside>
  );
}
