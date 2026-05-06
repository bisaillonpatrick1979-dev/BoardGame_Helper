import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dice6,
  Timer,
  Trophy,
  Wallet,
  CreditCard,
  Shuffle,
  Lock,
  Home,
  RotateCcw,
  Plus,
  Minus,
  Unlock
} from "lucide-react";

const TEXT = {
  en: {
    home: "Home",
    dice: "Dice",
    timer: "Timer",
    score: "Score",
    premium: "Premium",
    title: "Board Game Helper",
    hero: "Replace missing dice, timers, score sheets, cards and money tools with one premium mobile companion.",
    rescue: "Rescue Game Night",
    rollDice: "Roll Dice",
    startTimer: "Start Timer",
    trackScore: "Track Score",
    premiumBank: "Premium Bank",
    diceTitle: "Realistic Dice Roller",
    diceDesc: "Choose dice, roll multiple at once, and keep history.",
    total: "Total",
    numberDice: "Number of dice",
    timerTitle: "Game Timer",
    timerDesc: "Fast presets for turns, challenges and family games.",
    pauseTimer: "Pause Timer",
    reset: "Reset",
    scoreTitle: "Scoreboard",
    scoreDesc: "Track multiple players with quick plus and minus controls.",
    currentScore: "Current score",
    addPlayer: "Add Player",
    resetScores: "Reset Scores",
    premiumTitle: "Premium Tools",
    premiumDescLocked: "Bank, cards, randomizer and premium themes are locked.",
    premiumDescUnlocked: "Premium tools are unlocked on this device.",
    unlockPremium: "Unlock Premium",
    premiumUnlocked: "Premium Unlocked",
    bankDesc: "Money balances, transfers and transaction history.",
    cards: "Cards",
    cardsDesc: "Custom decks, random draw and flip animations.",
    randomizer: "Randomizer",
    randomizerDesc: "Animated wheel and custom random selections.",
    locked: "Locked",
    unlocked: "Unlocked"
  },
  fr: {
    home: "Accueil",
    dice: "Dés",
    timer: "Minuteur",
    score: "Score",
    premium: "Premium",
    title: "Board Game Helper",
    hero: "Remplace les dés perdus, minuteurs, feuilles de score, cartes et outils d’argent dans une seule application mobile.",
    rescue: "Sauver la soirée de jeu",
    rollDice: "Lancer les dés",
    startTimer: "Démarrer le minuteur",
    trackScore: "Suivre les scores",
    premiumBank: "Banque Premium",
    diceTitle: "Lanceur de dés réaliste",
    diceDesc: "Choisis tes dés, lance plusieurs dés à la fois et garde l’historique.",
    total: "Total",
    numberDice: "Nombre de dés",
    timerTitle: "Minuteur de jeu",
    timerDesc: "Préréglages rapides pour les tours, défis et jeux de famille.",
    pauseTimer: "Pause",
    reset: "Réinitialiser",
    scoreTitle: "Tableau des scores",
    scoreDesc: "Suis plusieurs joueurs avec des boutons plus et moins.",
    currentScore: "Score actuel",
    addPlayer: "Ajouter un joueur",
    resetScores: "Réinitialiser les scores",
    premiumTitle: "Outils Premium",
    premiumDescLocked: "Banque, cartes, randomizer et thèmes premium sont verrouillés.",
    premiumDescUnlocked: "Les outils premium sont débloqués sur cet appareil.",
    unlockPremium: "Débloquer Premium",
    premiumUnlocked: "Premium débloqué",
    bankDesc: "Balances d’argent, transferts et historique.",
    cards: "Cartes",
    cardsDesc: "Paquets personnalisés, tirage aléatoire et animation de retournement.",
    randomizer: "Randomizer",
    randomizerDesc: "Roue animée et sélections aléatoires personnalisées.",
    locked: "Verrouillé",
    unlocked: "Débloqué"
  }
};

const diceTypes = [4, 6, 8, 10, 12, 20];

function randomRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function DiceFace({ value, sides, rolling }) {
  if (sides !== 6) {
    return (
      <div className={`polyDie ${rolling ? "rolling" : ""}`}>
        <span>D{sides}</span>
        <strong>{value}</strong>
      </div>
    );
  }

  return (
    <div className={`realDie face${value} ${rolling ? "rolling" : ""}`}>
      {Array.from({ length: 9 }).map((_, index) => (
        <i key={index}></i>
      ))}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("bgh_lang") || "en");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("bgh_premium") === "true");
  const t = TEXT[lang];

  const tabs = [
    { id: "home", label: t.home, icon: Home },
    { id: "dice", label: t.dice, icon: Dice6 },
    { id: "timer", label: t.timer, icon: Timer },
    { id: "score", label: t.score, icon: Trophy },
    { id: "premium", label: t.premium, icon: isPremium ? Unlock : Lock }
  ];

  const [activeTab, setActiveTab] = useState("home");
  const [selectedDie, setSelectedDie] = useState(6);
  const [diceCount, setDiceCount] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [rolls, setRolls] = useState([6]);
  const [history, setHistory] = useState([]);

  const [seconds, setSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [players, setPlayers] = useState([
    { id: 1, name: "Player 1", score: 0 },
    { id: 2, name: "Player 2", score: 0 }
  ]);

  useEffect(() => {
    localStorage.setItem("bgh_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("bgh_premium", String(isPremium));
  }, [isPremium]);

  const totalRoll = useMemo(() => rolls.reduce((sum, value) => sum + value, 0), [rolls]);

  useEffect(() => {
    if (!timerRunning) return;

    timerRef.current = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");

  function handleRoll() {
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(80);

    let animationTicks = 0;
    const animation = setInterval(() => {
      setRolls(Array.from({ length: diceCount }, () => randomRoll(selectedDie)));
      animationTicks += 1;

      if (animationTicks >= 8) {
        clearInterval(animation);

        const newRolls = Array.from({ length: diceCount }, () => randomRoll(selectedDie));

        setRolls(newRolls);
        setHistory((oldHistory) => [
          {
            id: Date.now(),
            die: selectedDie,
            count: diceCount,
            rolls: newRolls,
            total: newRolls.reduce((sum, value) => sum + value, 0)
          },
          ...oldHistory.slice(0, 9)
        ]);

        setRolling(false);
      }
    }, 90);
  }

  function changePlayerScore(playerId, amount) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === playerId ? { ...player, score: player.score + amount } : player
      )
    );
  }

  function addPlayer() {
    setPlayers((currentPlayers) => [
      ...currentPlayers,
      { id: Date.now(), name: `Player ${currentPlayers.length + 1}`, score: 0 }
    ]);
  }

  function resetScores() {
    setPlayers((currentPlayers) => currentPlayers.map((player) => ({ ...player, score: 0 })));
  }

  return (
    <div className="app">
      <div className="backgroundGlow backgroundGlowOne"></div>
      <div className="backgroundGlow backgroundGlowTwo"></div>

      <main className="screen">
        <div className="topBar">
          <button className={lang === "en" ? "langActive" : ""} onClick={() => setLang("en")}>
            EN
          </button>
          <button className={lang === "fr" ? "langActive" : ""} onClick={() => setLang("fr")}>
            FR
          </button>
        </div>

        {activeTab === "home" && (
          <section className="hero">
            <div className="premiumBadge">
              Offline PWA • {isPremium ? t.premiumUnlocked : "Premium Game Tools"}
            </div>

            <h1>{t.title}</h1>
            <p>{t.hero}</p>

            <button className="heroButton" onClick={() => setActiveTab("dice")}>
              {t.rescue}
            </button>

            <div className="homeGrid">
              <button className="homeTile" onClick={() => setActiveTab("dice")}>
                <Dice6 size={38} />
                <span>{t.rollDice}</span>
              </button>

              <button className="homeTile" onClick={() => setActiveTab("timer")}>
                <Timer size={38} />
                <span>{t.startTimer}</span>
              </button>

              <button className="homeTile" onClick={() => setActiveTab("score")}>
                <Trophy size={38} />
                <span>{t.trackScore}</span>
              </button>

              <button className={`homeTile ${!isPremium ? "lockedTile" : ""}`} onClick={() => setActiveTab("premium")}>
                <Wallet size={38} />
                <span>{t.premiumBank}</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === "dice" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{t.diceTitle}</h2>
              <p>{t.diceDesc}</p>
            </div>

            <div className="diceTable">
              {rolls.map((value, index) => (
                <DiceFace key={`${index}-${value}-${rolling}`} value={value} sides={selectedDie} rolling={rolling} />
              ))}
            </div>

            <div className="resultPanel">
              <span>{t.total}</span>
              <strong>{totalRoll}</strong>
              <small>{rolls.join(" + ")}</small>
            </div>

            <div className="diceSelector">
              {diceTypes.map((die) => (
                <button key={die} className={selectedDie === die ? "selected" : ""} onClick={() => setSelectedDie(die)}>
                  D{die}
                </button>
              ))}
            </div>

            <div className="controlCard">
              <span>{t.numberDice}</span>

              <div className="stepper">
                <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))}>
                  <Minus size={18} />
                </button>

                <strong>{diceCount}</strong>

                <button onClick={() => setDiceCount(Math.min(12, diceCount + 1))}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <button className="primaryAction" onClick={handleRoll}>
              {t.rollDice}
            </button>

            <div className="historyList">
              {history.map((item) => (
                <div className="historyItem" key={item.id}>
                  <span>
                    {item.count} × D{item.die} — {item.rolls.join(" + ")}
                  </span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "timer" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{t.timerTitle}</h2>
              <p>{t.timerDesc}</p>
            </div>

            <div className="timerOrb">
              <span>{minutes}</span>
              <small>:</small>
              <span>{remainingSeconds}</span>
            </div>

            <div className="presetGrid">
              {[30, 60, 120, 300, 600].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setSeconds(preset);
                    setTimerRunning(false);
                  }}
                >
                  {preset < 60 ? `${preset}s` : `${preset / 60}m`}
                </button>
              ))}
            </div>

            <button className="primaryAction" onClick={() => setTimerRunning((value) => !value)}>
              {timerRunning ? t.pauseTimer : t.startTimer}
            </button>

            <button
              className="secondaryAction"
              onClick={() => {
                setTimerRunning(false);
                setSeconds(300);
              }}
            >
              <RotateCcw size={18} />
              {t.reset}
            </button>
          </section>
        )}

        {activeTab === "score" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{t.scoreTitle}</h2>
              <p>{t.scoreDesc}</p>
            </div>

            <div className="playerList">
              {players.map((player) => (
                <div className="playerCard" key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>{t.currentScore}</span>
                  </div>

                  <div className="scoreControls">
                    <button onClick={() => changePlayerScore(player.id, -1)}>
                      <Minus size={18} />
                    </button>

                    <b>{player.score}</b>

                    <button onClick={() => changePlayerScore(player.id, 1)}>
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="primaryAction" onClick={addPlayer}>
              {t.addPlayer}
            </button>

            <button className="secondaryAction" onClick={resetScores}>
              <RotateCcw size={18} />
              {t.resetScores}
            </button>
          </section>
        )}

        {activeTab === "premium" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{t.premiumTitle}</h2>
              <p>{isPremium ? t.premiumDescUnlocked : t.premiumDescLocked}</p>
            </div>

            <div className="premiumGrid">
              <div className={`premiumCard ${isPremium ? "unlockedCard" : ""}`}>
                <Wallet size={42} />
                <h3>{t.premiumBank}</h3>
                <p>{t.bankDesc}</p>
                <span>{isPremium ? t.unlocked : t.locked}</span>
              </div>

              <div className={`premiumCard ${isPremium ? "unlockedCard" : ""}`}>
                <CreditCard size={42} />
                <h3>{t.cards}</h3>
                <p>{t.cardsDesc}</p>
                <span>{isPremium ? t.unlocked : t.locked}</span>
              </div>

              <div className={`premiumCard ${isPremium ? "unlockedCard" : ""}`}>
                <Shuffle size={42} />
                <h3>{t.randomizer}</h3>
                <p>{t.randomizerDesc}</p>
                <span>{isPremium ? t.unlocked : t.locked}</span>
              </div>
            </div>

            <button className="primaryAction" onClick={() => setIsPremium(true)}>
              {isPremium ? t.premiumUnlocked : t.unlockPremium}
            </button>
          </section>
        )}
      </main>

      <nav className="bottomNav">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
