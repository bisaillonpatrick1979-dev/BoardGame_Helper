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
  Unlock,
  ArrowLeftRight,
  Sparkles,
  LayoutGrid,
  Castle,
  Gem,
  Swords,
  Landmark,
  Club
} from "lucide-react";

const TEXT = {
  en: {
    home: "Home",
    dice: "Dice",
    timer: "Timer",
    score: "Score",
    table: "Table",
    premium: "Premium",
    title: "Board Game Helper",
    hero: "Replace missing dice, timers, score sheets, cards and money tools with one premium mobile companion.",
    rescue: "Rescue Game Night",
    rollDice: "Roll Dice",
    startTimer: "Start Timer",
    pauseTimer: "Pause",
    reset: "Reset",
    total: "Total",
    numberDice: "Number of dice",
    addPlayer: "Add Player",
    resetScores: "Reset Scores",
    currentScore: "Current score",
    premiumTitle: "Premium Tools",
    unlockPremium: "Unlock Premium",
    premiumUnlocked: "Premium Unlocked",
    locked: "Locked",
    bank: "Bank",
    cards: "Cards",
    randomizer: "Randomizer",
    kits: "Game Kits",
    themes: "Themes",
    bankTitle: "Game Bank",
    bankDesc: "Money balances, transfers and transaction history.",
    amount: "Amount",
    from: "From",
    to: "To",
    transfer: "Transfer",
    history: "History",
    resetBank: "Reset Bank",
    noHistory: "No history yet.",
    drawCard: "Draw Card",
    addCard: "Add Custom Card",
    cardName: "Card name",
    deck: "Deck",
    resetDeck: "Reset Deck",
    drawnCards: "Drawn cards",
    standardDeck: "Standard Playing Cards",
    customDeck: "Custom Event Cards",
    spinWheel: "Spin Wheel",
    selected: "Selected",
    addOption: "Add Option",
    optionName: "Option name",
    options: "Options",
    tableTitle: "Game Table",
    tableDesc: "Build your own screen with the tools you need during a real game.",
    tableTools: "Visible tools",
    propertyKit: "Property Empire Kit",
    conquestKit: "World Conquest Kit",
    dungeonKit: "Dungeon Quest Kit",
    fiveDiceKit: "Five Dice Score Kit",
    cardKit: "Classic Card Kit"
  },
  fr: {
    home: "Accueil",
    dice: "Dés",
    timer: "Minuteur",
    score: "Score",
    table: "Table",
    premium: "Premium",
    title: "Board Game Helper",
    hero: "Remplace les dés perdus, minuteurs, feuilles de score, cartes et outils d’argent dans une seule application mobile.",
    rescue: "Sauver la soirée de jeu",
    rollDice: "Lancer les dés",
    startTimer: "Démarrer",
    pauseTimer: "Pause",
    reset: "Réinitialiser",
    total: "Total",
    numberDice: "Nombre de dés",
    addPlayer: "Ajouter un joueur",
    resetScores: "Réinitialiser les scores",
    currentScore: "Score actuel",
    premiumTitle: "Outils Premium",
    unlockPremium: "Débloquer Premium",
    premiumUnlocked: "Premium débloqué",
    locked: "Verrouillé",
    bank: "Banque",
    cards: "Cartes",
    randomizer: "Randomizer",
    kits: "Kits de jeux",
    themes: "Thèmes",
    bankTitle: "Banque de jeu",
    bankDesc: "Argent par joueur, transferts et historique.",
    amount: "Montant",
    from: "De",
    to: "À",
    transfer: "Transférer",
    history: "Historique",
    resetBank: "Réinitialiser la banque",
    noHistory: "Aucun historique.",
    drawCard: "Piger une carte",
    addCard: "Ajouter une carte custom",
    cardName: "Nom de la carte",
    deck: "Paquet",
    resetDeck: "Réinitialiser le paquet",
    drawnCards: "Cartes pigées",
    standardDeck: "Cartes à jouer standard",
    customDeck: "Cartes événement custom",
    spinWheel: "Tourner la roue",
    selected: "Sélectionné",
    addOption: "Ajouter une option",
    optionName: "Nom de l’option",
    options: "Options",
    tableTitle: "Table de jeu",
    tableDesc: "Monte ton propre écran avec les outils nécessaires pendant une vraie partie.",
    tableTools: "Outils visibles",
    propertyKit: "Kit Empire Immobilier",
    conquestKit: "Kit Conquête du Monde",
    dungeonKit: "Kit Quête Donjon",
    fiveDiceKit: "Kit Score 5 Dés",
    cardKit: "Kit Cartes Classiques"
  }
};

const diceTypes = [4, 6, 8, 10, 12, 20];

const defaultCustomCards = [
  "Skip turn",
  "Play again",
  "Draw two cards",
  "Trade places",
  "Lose 100",
  "Win 100",
  "Go back 3 spaces",
  "Move forward 5 spaces"
];

const suits = [
  { symbol: "♠", name: "Spades", color: "black" },
  { symbol: "♥", name: "Hearts", color: "red" },
  { symbol: "♦", name: "Diamonds", color: "red" },
  { symbol: "♣", name: "Clubs", color: "black" }
];

const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function buildStandardDeck() {
  const deck = [];

  suits.forEach((suit) => {
    ranks.forEach((rank) => {
      deck.push({
        id: `${rank}-${suit.symbol}`,
        rank,
        suit: suit.symbol,
        color: suit.color,
        label: `${rank}${suit.symbol}`
      });
    });
  });

  deck.push({ id: "joker-red", rank: "Joker", suit: "★", color: "red", label: "Joker" });
  deck.push({ id: "joker-black", rank: "Joker", suit: "★", color: "black", label: "Joker" });

  return deck;
}

const gameKits = [
  {
    id: "property",
    icon: Landmark,
    key: "propertyKit",
    descFr: "Banque, billets virtuels, dés, cartes chance et cartes communauté génériques.",
    descEn: "Bank, virtual money, dice, chance cards and community-style generic cards."
  },
  {
    id: "conquest",
    icon: Swords,
    key: "conquestKit",
    descFr: "Dés attaque/défense, compteur d’armées, territoires et ordre des tours.",
    descEn: "Attack/defense dice, army counters, territories and turn order."
  },
  {
    id: "dungeon",
    icon: Castle,
    key: "dungeonKit",
    descFr: "D4 à D20, initiative, points de vie, événements et butin aléatoire.",
    descEn: "D4 to D20, initiative, health, events and random loot."
  },
  {
    id: "fiveDice",
    icon: Dice6,
    key: "fiveDiceKit",
    descFr: "Cinq dés, relances, combinaisons et feuille de score rapide.",
    descEn: "Five dice, rerolls, combinations and quick score sheet."
  },
  {
    id: "classicCards",
    icon: Club,
    key: "cardKit",
    descFr: "Jeu de 52 cartes, jokers, piger, brasser, distribuer et défausser.",
    descEn: "52-card deck, jokers, draw, shuffle, deal and discard."
  }
];

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

function PlayingCard({ card, flipping }) {
  return (
    <div className={`playingCard ${flipping ? "cardFlip" : ""} ${card?.color === "red" ? "redCard" : "blackCard"}`}>
      <div className="cardCorner top">
        <span>{card?.rank || "?"}</span>
        <small>{card?.suit || "★"}</small>
      </div>

      <div className="cardCenter">
        <strong>{card?.rank || "?"}</strong>
        <span>{card?.suit || "★"}</span>
      </div>

      <div className="cardCorner bottom">
        <span>{card?.rank || "?"}</span>
        <small>{card?.suit || "★"}</small>
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("bgh_lang") || "en");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("bgh_premium") === "true");
  const [premiumTool, setPremiumTool] = useState("bank");
  const [activeTab, setActiveTab] = useState("home");
  const t = TEXT[lang];

  const tabs = [
    { id: "home", label: t.home, icon: Home },
    { id: "dice", label: t.dice, icon: Dice6 },
    { id: "timer", label: t.timer, icon: Timer },
    { id: "score", label: t.score, icon: Trophy },
    { id: "table", label: t.table, icon: LayoutGrid },
    { id: "premium", label: t.premium, icon: isPremium ? Unlock : Lock }
  ];

  const [selectedDie, setSelectedDie] = useState(6);
  const [diceCount, setDiceCount] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [rolls, setRolls] = useState([6]);
  const [history, setHistory] = useState([]);

  const [seconds, setSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem("bgh_players");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: "Player 1", score: 0, money: 1500 },
          { id: 2, name: "Player 2", score: 0, money: 1500 }
        ];
  });

  const [bankAmount, setBankAmount] = useState(100);
  const [bankFrom, setBankFrom] = useState(1);
  const [bankTo, setBankTo] = useState(2);
  const [bankHistory, setBankHistory] = useState(() => {
    const saved = localStorage.getItem("bgh_bank_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [cardMode, setCardMode] = useState("standard");
  const [standardDeck] = useState(buildStandardDeck);
  const [drawnPlayingCard, setDrawnPlayingCard] = useState(null);
  const [playingCardHistory, setPlayingCardHistory] = useState(() => {
    const saved = localStorage.getItem("bgh_playing_card_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [customCards, setCustomCards] = useState(() => {
    const saved = localStorage.getItem("bgh_cards");
    return saved ? JSON.parse(saved) : defaultCustomCards;
  });
  const [newCard, setNewCard] = useState("");
  const [drawnCustomCard, setDrawnCustomCard] = useState(null);
  const [cardFlipping, setCardFlipping] = useState(false);
  const [customCardHistory, setCustomCardHistory] = useState(() => {
    const saved = localStorage.getItem("bgh_card_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [randomItems, setRandomItems] = useState(() => {
    const saved = localStorage.getItem("bgh_random_items");
    return saved ? JSON.parse(saved) : ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6"];
  });
  const [randomInput, setRandomInput] = useState("");
  const [randomResult, setRandomResult] = useState(null);
  const [spinningWheel, setSpinningWheel] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const [tableTools, setTableTools] = useState(() => {
    const saved = localStorage.getItem("bgh_table_tools");
    return saved
      ? JSON.parse(saved)
      : {
          dice: true,
          timer: true,
          score: true,
          cards: false,
          bank: false,
          randomizer: false
        };
  });

  useEffect(() => localStorage.setItem("bgh_lang", lang), [lang]);
  useEffect(() => localStorage.setItem("bgh_premium", String(isPremium)), [isPremium]);
  useEffect(() => localStorage.setItem("bgh_players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("bgh_bank_history", JSON.stringify(bankHistory)), [bankHistory]);
  useEffect(() => localStorage.setItem("bgh_cards", JSON.stringify(customCards)), [customCards]);
  useEffect(() => localStorage.setItem("bgh_card_history", JSON.stringify(customCardHistory)), [customCardHistory]);
  useEffect(() => localStorage.setItem("bgh_playing_card_history", JSON.stringify(playingCardHistory)), [playingCardHistory]);
  useEffect(() => localStorage.setItem("bgh_random_items", JSON.stringify(randomItems)), [randomItems]);
  useEffect(() => localStorage.setItem("bgh_table_tools", JSON.stringify(tableTools)), [tableTools]);

  const totalRoll = useMemo(() => rolls.reduce((sum, value) => sum + value, 0), [rolls]);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");

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

  function handleRoll() {
    setRolling(true);
    if (navigator.vibrate) navigator.vibrate(80);

    let ticks = 0;
    const animation = setInterval(() => {
      setRolls(Array.from({ length: diceCount }, () => randomRoll(selectedDie)));
      ticks += 1;

      if (ticks >= 8) {
        clearInterval(animation);
        const newRolls = Array.from({ length: diceCount }, () => randomRoll(selectedDie));
        setRolls(newRolls);
        setHistory((old) => [
          {
            id: Date.now(),
            die: selectedDie,
            count: diceCount,
            rolls: newRolls,
            total: newRolls.reduce((s, v) => s + v, 0)
          },
          ...old.slice(0, 9)
        ]);
        setRolling(false);
      }
    }, 90);
  }

  function changePlayerScore(playerId, amount) {
    setPlayers((current) =>
      current.map((p) => (p.id === playerId ? { ...p, score: p.score + amount } : p))
    );
  }

  function addPlayer() {
    setPlayers((current) => [
      ...current,
      { id: Date.now(), name: `Player ${current.length + 1}`, score: 0, money: 1500 }
    ]);
  }

  function resetScores() {
    setPlayers((current) => current.map((p) => ({ ...p, score: 0 })));
  }

  function addBankHistory(text) {
    setBankHistory((old) => [{ id: Date.now(), text }, ...old.slice(0, 14)]);
  }

  function changeMoney(playerId, amount) {
    const player = players.find((p) => p.id === playerId);

    setPlayers((current) =>
      current.map((p) =>
        p.id === playerId ? { ...p, money: Math.max(0, (p.money || 0) + amount) } : p
      )
    );

    addBankHistory(`${amount > 0 ? "+" : ""}${amount} → ${player?.name}`);
  }

  function transferMoney() {
    const amount = Number(bankAmount);

    if (!amount || amount <= 0 || bankFrom === bankTo) return;

    const fromPlayer = players.find((p) => p.id === Number(bankFrom));
    const toPlayer = players.find((p) => p.id === Number(bankTo));

    if (!fromPlayer || !toPlayer || fromPlayer.money < amount) return;

    setPlayers((current) =>
      current.map((p) => {
        if (p.id === Number(bankFrom)) return { ...p, money: p.money - amount };
        if (p.id === Number(bankTo)) return { ...p, money: p.money + amount };
        return p;
      })
    );

    addBankHistory(`${fromPlayer.name} → ${toPlayer.name}: ${amount}`);
    if (navigator.vibrate) navigator.vibrate(60);
  }

  function resetBank() {
    setPlayers((current) => current.map((p) => ({ ...p, money: 1500 })));
    setBankHistory([]);
  }

  function addCard() {
    const cleanCard = newCard.trim();
    if (!cleanCard) return;

    setCustomCards((current) => [...current, cleanCard]);
    setNewCard("");

    if (navigator.vibrate) navigator.vibrate(40);
  }

  function drawCustomCard() {
    if (customCards.length === 0) return;

    setCardFlipping(true);

    setTimeout(() => {
      const picked = customCards[Math.floor(Math.random() * customCards.length)];
      setDrawnCustomCard(picked);
      setCustomCardHistory((old) => [{ id: Date.now(), text: picked }, ...old.slice(0, 14)]);
      setCardFlipping(false);

      if (navigator.vibrate) navigator.vibrate([70, 40, 70]);
    }, 600);
  }

  function drawPlayingCard() {
    setCardFlipping(true);

    setTimeout(() => {
      const picked = standardDeck[Math.floor(Math.random() * standardDeck.length)];
      setDrawnPlayingCard(picked);
      setPlayingCardHistory((old) => [{ id: Date.now(), text: picked.label }, ...old.slice(0, 14)]);
      setCardFlipping(false);

      if (navigator.vibrate) navigator.vibrate([70, 40, 70]);
    }, 600);
  }

  function removeCustomCard(cardIndex) {
    setCustomCards((current) => current.filter((_, index) => index !== cardIndex));
  }

  function resetDeck() {
    setCustomCards(defaultCustomCards);
    setDrawnCustomCard(null);
    setDrawnPlayingCard(null);
    setCustomCardHistory([]);
    setPlayingCardHistory([]);
  }

  function addRandomItem() {
    const clean = randomInput.trim();
    if (!clean) return;

    setRandomItems((current) => [...current, clean]);
    setRandomInput("");

    if (navigator.vibrate) navigator.vibrate(30);
  }

  function removeRandomItem(indexToRemove) {
    setRandomItems((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function spinWheel() {
    if (randomItems.length === 0 || spinningWheel) return;

    const selectedIndex = Math.floor(Math.random() * randomItems.length);
    const segmentAngle = 360 / randomItems.length;
    const targetAngle = 360 - selectedIndex * segmentAngle - segmentAngle / 2;
    const extraSpins = 1440;
    const finalRotation = wheelRotation + extraSpins + targetAngle;

    setSpinningWheel(true);
    setWheelRotation(finalRotation);

    setTimeout(() => {
      setRandomResult(randomItems[selectedIndex]);
      setSpinningWheel(false);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }, 1900);
  }

  function toggleTableTool(tool) {
    setTableTools((current) => ({
      ...current,
      [tool]: !current[tool]
    }));
  }

  function DiceCompact() {
    return (
      <div className="tableWidget">
        <div className="widgetHeader">
          <Dice6 size={20} />
          <strong>{t.dice}</strong>
        </div>

        <div className="compactDiceLine">
          <DiceFace value={rolls[0] || 1} sides={selectedDie} rolling={rolling} />
          <div>
            <span>{t.total}</span>
            <strong>{totalRoll}</strong>
          </div>
        </div>

        <button className="miniAction" onClick={handleRoll}>{t.rollDice}</button>
      </div>
    );
  }

  function TimerCompact() {
    return (
      <div className="tableWidget">
        <div className="widgetHeader">
          <Timer size={20} />
          <strong>{t.timer}</strong>
        </div>

        <div className="compactTimer">{minutes}:{remainingSeconds}</div>

        <button className="miniAction" onClick={() => setTimerRunning((v) => !v)}>
          {timerRunning ? t.pauseTimer : t.startTimer}
        </button>
      </div>
    );
  }

  function ScoreCompact() {
    return (
      <div className="tableWidget">
        <div className="widgetHeader">
          <Trophy size={20} />
          <strong>{t.score}</strong>
        </div>

        <div className="compactPlayers">
          {players.slice(0, 4).map((player) => (
            <div key={player.id}>
              <span>{player.name}</span>
              <strong>{player.score}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function CardsCompact() {
    return (
      <div className="tableWidget">
        <div className="widgetHeader">
          <CreditCard size={20} />
          <strong>{t.cards}</strong>
        </div>

        <PlayingCard card={drawnPlayingCard || { rank: "?", suit: "★", color: "black" }} flipping={cardFlipping} />

        <button className="miniAction" onClick={drawPlayingCard}>{t.drawCard}</button>
      </div>
    );
  }

  function BankCompact() {
    return (
      <div className="tableWidget">
        <div className="widgetHeader">
          <Wallet size={20} />
          <strong>{t.bank}</strong>
        </div>

        <div className="compactPlayers">
          {players.slice(0, 4).map((player) => (
            <div key={player.id}>
              <span>{player.name}</span>
              <strong>${player.money || 0}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function RandomizerCompact() {
    return (
      <div className="tableWidget">
        <div className="widgetHeader">
          <Sparkles size={20} />
          <strong>{t.randomizer}</strong>
        </div>

        <div className="compactResult">{randomResult || "—"}</div>

        <button className="miniAction" onClick={spinWheel}>{t.spinWheel}</button>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="backgroundGlow backgroundGlowOne"></div>
      <div className="backgroundGlow backgroundGlowTwo"></div>

      <main className="screen">
        <div className="topBar">
          <button className={lang === "en" ? "langActive" : ""} onClick={() => setLang("en")}>EN</button>
          <button className={lang === "fr" ? "langActive" : ""} onClick={() => setLang("fr")}>FR</button>
        </div>

        {activeTab === "home" && (
          <section className="hero">
            <div className="premiumBadge">
              Offline PWA • {isPremium ? t.premiumUnlocked : "Premium Game Tools"}
            </div>

            <h1>{t.title}</h1>
            <p>{t.hero}</p>

            <button className="heroButton" onClick={() => setActiveTab("table")}>
              {t.rescue}
            </button>

            <div className="homeGrid">
              <button className="homeTile" onClick={() => setActiveTab("dice")}><Dice6 size={38} /><span>{t.rollDice}</span></button>
              <button className="homeTile" onClick={() => setActiveTab("timer")}><Timer size={38} /><span>{t.startTimer}</span></button>
              <button className="homeTile" onClick={() => setActiveTab("score")}><Trophy size={38} /><span>{t.score}</span></button>
              <button className="homeTile" onClick={() => setActiveTab("table")}><LayoutGrid size={38} /><span>{t.table}</span></button>
              <button className={`homeTile ${!isPremium ? "lockedTile" : ""}`} onClick={() => setActiveTab("premium")}><Gem size={38} /><span>{t.premium}</span></button>
            </div>
          </section>
        )}

        {activeTab === "dice" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{lang === "fr" ? "Lanceur de dés réaliste" : "Realistic Dice Roller"}</h2>
              <p>{lang === "fr" ? "Choisis tes dés, lance plusieurs dés à la fois et garde l’historique." : "Choose dice, roll multiple at once, and keep history."}</p>
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
                <button key={die} className={selectedDie === die ? "selected" : ""} onClick={() => setSelectedDie(die)}>D{die}</button>
              ))}
            </div>

            <div className="controlCard">
              <span>{t.numberDice}</span>
              <div className="stepper">
                <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))}><Minus size={18} /></button>
                <strong>{diceCount}</strong>
                <button onClick={() => setDiceCount(Math.min(12, diceCount + 1))}><Plus size={18} /></button>
              </div>
            </div>

            <button className="primaryAction" onClick={handleRoll}>{t.rollDice}</button>

            <div className="historyList">
              {history.map((item) => (
                <div className="historyItem" key={item.id}>
                  <span>{item.count} × D{item.die} — {item.rolls.join(" + ")}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "timer" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{lang === "fr" ? "Minuteur de jeu" : "Game Timer"}</h2>
              <p>{lang === "fr" ? "Préréglages rapides pour les tours et défis." : "Fast presets for turns and challenges."}</p>
            </div>

            <div className="timerOrb"><span>{minutes}</span><small>:</small><span>{remainingSeconds}</span></div>

            <div className="presetGrid">
              {[30, 60, 120, 300, 600].map((preset) => (
                <button key={preset} onClick={() => { setSeconds(preset); setTimerRunning(false); }}>
                  {preset < 60 ? `${preset}s` : `${preset / 60}m`}
                </button>
              ))}
            </div>

            <button className="primaryAction" onClick={() => setTimerRunning((v) => !v)}>
              {timerRunning ? t.pauseTimer : t.startTimer}
            </button>

            <button className="secondaryAction" onClick={() => { setTimerRunning(false); setSeconds(300); }}>
              <RotateCcw size={18} />{t.reset}
            </button>
          </section>
        )}

        {activeTab === "score" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{lang === "fr" ? "Tableau des scores" : "Scoreboard"}</h2>
              <p>{lang === "fr" ? "Suis plusieurs joueurs avec plus et moins." : "Track multiple players with plus and minus controls."}</p>
            </div>

            <div className="playerList">
              {players.map((player) => (
                <div className="playerCard" key={player.id}>
                  <div><strong>{player.name}</strong><span>{t.currentScore}</span></div>
                  <div className="scoreControls">
                    <button onClick={() => changePlayerScore(player.id, -1)}><Minus size={18} /></button>
                    <b>{player.score}</b>
                    <button onClick={() => changePlayerScore(player.id, 1)}><Plus size={18} /></button>
                  </div>
                </div>
              ))}
            </div>

            <button className="primaryAction" onClick={addPlayer}>{t.addPlayer}</button>
            <button className="secondaryAction" onClick={resetScores}><RotateCcw size={18} />{t.resetScores}</button>
          </section>
        )}

        {activeTab === "table" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{t.tableTitle}</h2>
              <p>{t.tableDesc}</p>
            </div>

            <div className="tableTogglePanel">
              <h3>{t.tableTools}</h3>

              <div className="tableToggles">
                {[
                  ["dice", t.dice],
                  ["timer", t.timer],
                  ["score", t.score],
                  ["cards", t.cards],
                  ["bank", t.bank],
                  ["randomizer", t.randomizer]
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={tableTools[key] ? "active" : ""}
                    onClick={() => toggleTableTool(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="gameTableGrid">
              {tableTools.dice && <DiceCompact />}
              {tableTools.timer && <TimerCompact />}
              {tableTools.score && <ScoreCompact />}
              {tableTools.cards && <CardsCompact />}
              {tableTools.bank && <BankCompact />}
              {tableTools.randomizer && <RandomizerCompact />}
            </div>
          </section>
        )}

        {activeTab === "premium" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{t.premiumTitle}</h2>
              <p>{isPremium ? t.premiumUnlocked : lang === "fr" ? "Banque, cartes, randomizer, kits et thèmes sont verrouillés." : "Bank, cards, randomizer, kits and themes are locked."}</p>
            </div>

            {!isPremium && (
              <>
                <div className="premiumGrid">
                  <div className="premiumCard"><Wallet size={42} /><h3>{t.bankTitle}</h3><p>{t.bankDesc}</p><span>{t.locked}</span></div>
                  <div className="premiumCard"><CreditCard size={42} /><h3>{t.cards}</h3><p>{lang === "fr" ? "Cartes standard, jokers et cartes événement custom." : "Standard cards, jokers and custom event cards."}</p><span>{t.locked}</span></div>
                  <div className="premiumCard"><Shuffle size={42} /><h3>{t.randomizer}</h3><p>{lang === "fr" ? "Roue avec aiguille, joueurs autour du cercle et tirage animé." : "Needle wheel, players around the circle and animated picks."}</p><span>{t.locked}</span></div>
                  <div className="premiumCard"><Castle size={42} /><h3>{t.kits}</h3><p>{lang === "fr" ? "Kits inspirés de grands styles de jeux, sans noms protégés." : "Kits inspired by major game styles, without protected names."}</p><span>{t.locked}</span></div>
                </div>

                <button className="primaryAction" onClick={() => setIsPremium(true)}>{t.unlockPremium}</button>
              </>
            )}

            {isPremium && (
              <>
                <div className="premiumToolTabs">
                  <button className={premiumTool === "bank" ? "active" : ""} onClick={() => setPremiumTool("bank")}><Wallet size={18} />{t.bank}</button>
                  <button className={premiumTool === "cards" ? "active" : ""} onClick={() => setPremiumTool("cards")}><CreditCard size={18} />{t.cards}</button>
                  <button className={premiumTool === "randomizer" ? "active" : ""} onClick={() => setPremiumTool("randomizer")}><Sparkles size={18} />{t.randomizer}</button>
                  <button className={premiumTool === "kits" ? "active" : ""} onClick={() => setPremiumTool("kits")}><Castle size={18} />{t.kits}</button>
                </div>

                {premiumTool === "bank" && (
                  <>
                    <div className="bankHeader">
                      <Wallet size={36} />
                      <div><h3>{t.bankTitle}</h3><p>{t.bankDesc}</p></div>
                    </div>

                    <div className="bankPlayers">
                      {players.map((player) => (
                        <div className="bankPlayerCard" key={player.id}>
                          <div><strong>{player.name}</strong><span>${player.money || 0}</span></div>
                          <div className="bankButtons">
                            <button onClick={() => changeMoney(player.id, Number(bankAmount))}><Plus size={16} /></button>
                            <button onClick={() => changeMoney(player.id, -Number(bankAmount))}><Minus size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bankTransferCard">
                      <label>{t.amount}</label>
                      <input type="number" value={bankAmount} onChange={(e) => setBankAmount(e.target.value)} />

                      <label>{t.from}</label>
                      <select value={bankFrom} onChange={(e) => setBankFrom(e.target.value)}>
                        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>

                      <label>{t.to}</label>
                      <select value={bankTo} onChange={(e) => setBankTo(e.target.value)}>
                        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>

                      <button className="primaryAction" onClick={transferMoney}><ArrowLeftRight size={18} />{t.transfer}</button>
                    </div>

                    <button className="secondaryAction" onClick={resetBank}><RotateCcw size={18} />{t.resetBank}</button>

                    <div className="historyList">
                      <h3>{t.history}</h3>
                      {bankHistory.length === 0 && <div className="historyItem"><span>{t.noHistory}</span></div>}
                      {bankHistory.map((item) => <div className="historyItem" key={item.id}><span>{item.text}</span></div>)}
                    </div>
                  </>
                )}

                {premiumTool === "cards" && (
                  <>
                    <div className="cardModeTabs">
                      <button className={cardMode === "standard" ? "active" : ""} onClick={() => setCardMode("standard")}>{t.standardDeck}</button>
                      <button className={cardMode === "custom" ? "active" : ""} onClick={() => setCardMode("custom")}>{t.customDeck}</button>
                    </div>

                    {cardMode === "standard" && (
                      <>
                        <div className="cardsHero">
                          <PlayingCard card={drawnPlayingCard || { rank: "?", suit: "★", color: "black" }} flipping={cardFlipping} />
                          <button className="primaryAction" onClick={drawPlayingCard}>{t.drawCard}</button>
                        </div>

                        <div className="historyList">
                          <h3>{t.drawnCards}</h3>
                          {playingCardHistory.length === 0 && <div className="historyItem"><span>{t.noHistory}</span></div>}
                          {playingCardHistory.map((item) => <div className="historyItem" key={item.id}><span>{item.text}</span></div>)}
                        </div>
                      </>
                    )}

                    {cardMode === "custom" && (
                      <>
                        <div className="cardsHero">
                          <div className={`eventCard ${cardFlipping ? "cardFlip" : ""}`}>
                            <span>{lang === "fr" ? "Carte événement" : "Event Card"}</span>
                            <strong>{drawnCustomCard || "?"}</strong>
                          </div>
                          <button className="primaryAction" onClick={drawCustomCard}>{t.drawCard}</button>
                        </div>

                        <div className="bankTransferCard">
                          <label>{t.cardName}</label>
                          <input type="text" value={newCard} placeholder={lang === "fr" ? "Ex: Passe ton tour" : "Ex: Skip your turn"} onChange={(e) => setNewCard(e.target.value)} />
                          <button className="secondaryAction" onClick={addCard}><Plus size={18} />{t.addCard}</button>
                        </div>

                        <div className="deckList">
                          <h3>{t.deck} ({customCards.length})</h3>
                          {customCards.map((card, index) => (
                            <div className="deckItem" key={`${card}-${index}`}>
                              <span>{card}</span>
                              <button onClick={() => removeCustomCard(index)}><Minus size={16} /></button>
                            </div>
                          ))}
                        </div>

                        <button className="secondaryAction" onClick={resetDeck}><RotateCcw size={18} />{t.resetDeck}</button>

                        <div className="historyList">
                          <h3>{t.drawnCards}</h3>
                          {customCardHistory.length === 0 && <div className="historyItem"><span>{t.noHistory}</span></div>}
                          {customCardHistory.map((item) => <div className="historyItem" key={item.id}><span>{item.text}</span></div>)}
                        </div>
                      </>
                    )}
                  </>
                )}

                {premiumTool === "randomizer" && (
                  <>
                    <div className="wheelShell">
                      <div className="wheelNeedle"></div>

                      <div className={`wheel ${spinningWheel ? "wheelSpin" : ""}`} style={{ transform: `rotate(${wheelRotation}deg)` }}>
                        {randomItems.map((item, index) => {
                          const angle = (360 / randomItems.length) * index;
                          return (
                            <span
                              key={`${item}-${index}`}
                              className="wheelLabel"
                              style={{ transform: `rotate(${angle}deg) translateY(-103px) rotate(${-angle}deg)` }}
                            >
                              {item}
                            </span>
                          );
                        })}

                        <div className="wheelCenter"><Sparkles size={42} /></div>
                      </div>
                    </div>

                    <button className="primaryAction" onClick={spinWheel}>{t.spinWheel}</button>

                    {randomResult && (
                      <div className="randomResult">
                        <span>{t.selected}</span>
                        <strong>{randomResult}</strong>
                      </div>
                    )}

                    <div className="bankTransferCard">
                      <label>{t.optionName}</label>
                      <input type="text" value={randomInput} placeholder={lang === "fr" ? "Ajouter un joueur ou une option" : "Add player or option"} onChange={(e) => setRandomInput(e.target.value)} />
                      <button className="secondaryAction" onClick={addRandomItem}><Plus size={18} />{t.addOption}</button>
                    </div>

                    <div className="deckList">
                      <h3>{t.options} ({randomItems.length})</h3>
                      {randomItems.map((item, index) => (
                        <div className="deckItem" key={`${item}-${index}`}>
                          <span>{item}</span>
                          <button onClick={() => removeRandomItem(index)}><Minus size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {premiumTool === "kits" && (
                  <div className="kitsGrid">
                    {gameKits.map((kit) => {
                      const Icon = kit.icon;
                      return (
                        <div className="kitCard" key={kit.id}>
                          <div className="kitIcon"><Icon size={36} /></div>
                          <h3>{t[kit.key]}</h3>
                          <p>{lang === "fr" ? kit.descFr : kit.descEn}</p>
                          <span>{lang === "fr" ? "Kit premium compatible" : "Compatible premium kit"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
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
