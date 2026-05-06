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
  Sparkles
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
    total: "Total",
    numberDice: "Number of dice",
    pauseTimer: "Pause Timer",
    reset: "Reset",
    addPlayer: "Add Player",
    resetScores: "Reset Scores",
    currentScore: "Current score",
    premiumTitle: "Premium Tools",
    unlockPremium: "Unlock Premium",
    premiumUnlocked: "Premium Unlocked",
    locked: "Locked",
    unlocked: "Unlocked",
    bankTitle: "Game Bank",
    bankDesc: "Money balances, transfers and transaction history.",
    cards: "Cards",
    cardsDesc: "Custom decks, random draw and flip animations.",
    randomizer: "Randomizer",
    randomizerDesc: "Animated wheel and custom random selections.",
    amount: "Amount",
    from: "From",
    to: "To",
    history: "History",
    resetBank: "Reset Bank",
    noHistory: "No transactions yet.",
    bank: "Bank",
    cardTool: "Cards",
    addCard: "Add Card",
    drawCard: "Draw Card",
    cardName: "Card name",
    deck: "Deck",
    resetDeck: "Reset Deck",
    noCards: "No cards yet.",
    drawnCards: "Drawn cards",
    spinWheel: "Spin Wheel",
    selected: "Selected",
    addOption: "Add Option",
    optionName: "Option name",
    options: "Options"
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
    startTimer: "Démarrer",
    trackScore: "Suivre les scores",
    premiumBank: "Banque Premium",
    total: "Total",
    numberDice: "Nombre de dés",
    pauseTimer: "Pause",
    reset: "Réinitialiser",
    addPlayer: "Ajouter un joueur",
    resetScores: "Réinitialiser les scores",
    currentScore: "Score actuel",
    premiumTitle: "Outils Premium",
    unlockPremium: "Débloquer Premium",
    premiumUnlocked: "Premium débloqué",
    locked: "Verrouillé",
    unlocked: "Débloqué",
    bankTitle: "Banque de jeu",
    bankDesc: "Argent par joueur, transferts et historique.",
    cards: "Cartes",
    cardsDesc: "Paquets personnalisés, tirage aléatoire et animations.",
    randomizer: "Randomizer",
    randomizerDesc: "Roue animée et sélections aléatoires.",
    amount: "Montant",
    from: "De",
    to: "À",
    history: "Historique",
    resetBank: "Réinitialiser la banque",
    noHistory: "Aucune transaction.",
    bank: "Banque",
    cardTool: "Cartes",
    addCard: "Ajouter une carte",
    drawCard: "Tirer une carte",
    cardName: "Nom de la carte",
    deck: "Paquet",
    resetDeck: "Réinitialiser le paquet",
    noCards: "Aucune carte.",
    drawnCards: "Cartes tirées",
    spinWheel: "Tourner la roue",
    selected: "Sélectionné",
    addOption: "Ajouter une option",
    optionName: "Nom de l’option",
    options: "Options"
  }
};

const diceTypes = [4, 6, 8, 10, 12, 20];

const defaultCards = [
  "Skip turn",
  "Play again",
  "Draw two cards",
  "Trade places",
  "Lose 100",
  "Win 100",
  "Go back 3 spaces",
  "Move forward 5 spaces"
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

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("bgh_lang") || "en");
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("bgh_premium") === "true");
  const [premiumTool, setPremiumTool] = useState("bank");
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

  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem("bgh_cards");
    return saved ? JSON.parse(saved) : defaultCards;
  });

  const [newCard, setNewCard] = useState("");
  const [drawnCard, setDrawnCard] = useState(null);
  const [cardFlipping, setCardFlipping] = useState(false);

  const [cardHistory, setCardHistory] = useState(() => {
    const saved = localStorage.getItem("bgh_card_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [randomItems, setRandomItems] = useState(() => {
    const saved = localStorage.getItem("bgh_random_items");
    return saved ? JSON.parse(saved) : ["Player 1", "Player 2", "Player 3", "Player 4"];
  });

  const [randomInput, setRandomInput] = useState("");
  const [randomResult, setRandomResult] = useState(null);
  const [spinningWheel, setSpinningWheel] = useState(false);

  useEffect(() => localStorage.setItem("bgh_lang", lang), [lang]);
  useEffect(() => localStorage.setItem("bgh_premium", String(isPremium)), [isPremium]);
  useEffect(() => localStorage.setItem("bgh_players", JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem("bgh_bank_history", JSON.stringify(bankHistory)), [bankHistory]);
  useEffect(() => localStorage.setItem("bgh_cards", JSON.stringify(cards)), [cards]);
  useEffect(() => localStorage.setItem("bgh_card_history", JSON.stringify(cardHistory)), [cardHistory]);
  useEffect(() => localStorage.setItem("bgh_random_items", JSON.stringify(randomItems)), [randomItems]);

  const totalRoll = useMemo(() => rolls.reduce((sum, value) => sum + value, 0), [rolls]);

  useEffect(() => {
    if (!timerRunning) return;

    timerRef.current = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          setTimerRunning(false);

          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }

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

    if (navigator.vibrate) {
      navigator.vibrate(80);
    }

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
      current.map((p) =>
        p.id === playerId ? { ...p, score: p.score + amount } : p
      )
    );
  }

  function addPlayer() {
    setPlayers((current) => [
      ...current,
      {
        id: Date.now(),
        name: `Player ${current.length + 1}`,
        score: 0,
        money: 1500
      }
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
        p.id === playerId
          ? { ...p, money: Math.max(0, (p.money || 0) + amount) }
          : p
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

    if (navigator.vibrate) {
      navigator.vibrate(60);
    }
  }

  function resetBank() {
    setPlayers((current) => current.map((p) => ({ ...p, money: 1500 })));
    setBankHistory([]);
  }

  function addCard() {
    const cleanCard = newCard.trim();

    if (!cleanCard) return;

    setCards((current) => [...current, cleanCard]);
    setNewCard("");

    if (navigator.vibrate) {
      navigator.vibrate(40);
    }
  }

  function drawCard() {
    if (cards.length === 0) return;

    setCardFlipping(true);

    setTimeout(() => {
      const picked = cards[Math.floor(Math.random() * cards.length)];

      setDrawnCard(picked);
      setCardHistory((old) => [{ id: Date.now(), text: picked }, ...old.slice(0, 14)]);
      setCardFlipping(false);

      if (navigator.vibrate) {
        navigator.vibrate([70, 40, 70]);
      }
    }, 600);
  }

  function removeCard(cardIndex) {
    setCards((current) => current.filter((_, index) => index !== cardIndex));
  }

  function resetDeck() {
    setCards(defaultCards);
    setDrawnCard(null);
    setCardHistory([]);
  }

  function addRandomItem() {
    const clean = randomInput.trim();

    if (!clean) return;

    setRandomItems((current) => [...current, clean]);
    setRandomInput("");

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  function removeRandomItem(indexToRemove) {
    setRandomItems((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
  }

  function spinWheel() {
    if (randomItems.length === 0) return;

    setSpinningWheel(true);

    setTimeout(() => {
      const selected = randomItems[Math.floor(Math.random() * randomItems.length)];

      setRandomResult(selected);
      setSpinningWheel(false);

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }, 1800);
  }

  return (
    <div className="app">
      <div className="backgroundGlow backgroundGlowOne"></div>
      <div className="backgroundGlow backgroundGlowTwo"></div>

      <main className="screen">
        <div className="topBar">
          <button
            className={lang === "en" ? "langActive" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>

          <button
            className={lang === "fr" ? "langActive" : ""}
            onClick={() => setLang("fr")}
          >
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

              <button
                className={`homeTile ${!isPremium ? "lockedTile" : ""}`}
                onClick={() => setActiveTab("premium")}
              >
                <Wallet size={38} />
                <span>{t.premiumBank}</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === "dice" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>{lang === "fr" ? "Lanceur de dés réaliste" : "Realistic Dice Roller"}</h2>
              <p>
                {lang === "fr"
                  ? "Choisis tes dés, lance plusieurs dés à la fois et garde l’historique."
                  : "Choose dice, roll multiple at once, and keep history."}
              </p>
            </div>

            <div className="diceTable">
              {rolls.map((value, index) => (
                <DiceFace
                  key={`${index}-${value}-${rolling}`}
                  value={value}
                  sides={selectedDie}
                  rolling={rolling}
                />
              ))}
            </div>

            <div className="resultPanel">
              <span>{t.total}</span>
              <strong>{totalRoll}</strong>
              <small>{rolls.join(" + ")}</small>
            </div>

            <div className="diceSelector">
              {diceTypes.map((die) => (
                <button
                  key={die}
                  className={selectedDie === die ? "selected" : ""}
                  onClick={() => setSelectedDie(die)}
                >
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
              <h2>{lang === "fr" ? "Minuteur de jeu" : "Game Timer"}</h2>
              <p>
                {lang === "fr"
                  ? "Préréglages rapides pour les tours et défis."
                  : "Fast presets for turns and challenges."}
              </p>
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

            <button
              className="primaryAction"
              onClick={() => setTimerRunning((v) => !v)}
            >
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
              <h2>{lang === "fr" ? "Tableau des scores" : "Scoreboard"}</h2>
              <p>
                {lang === "fr"
                  ? "Suis plusieurs joueurs avec plus et moins."
                  : "Track multiple players with plus and minus controls."}
              </p>
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
              <p>
                {isPremium
                  ? t.premiumUnlocked
                  : lang === "fr"
                  ? "Banque, cartes, randomizer et thèmes premium sont verrouillés."
                  : "Bank, cards, randomizer and premium themes are locked."}
              </p>
            </div>

            {!isPremium && (
              <>
                <div className="premiumGrid">
                  <div className="premiumCard">
                    <Wallet size={42} />
                    <h3>{t.bankTitle}</h3>
                    <p>{t.bankDesc}</p>
                    <span>{t.locked}</span>
                  </div>

                  <div className="premiumCard">
                    <CreditCard size={42} />
                    <h3>{t.cards}</h3>
                    <p>{t.cardsDesc}</p>
                    <span>{t.locked}</span>
                  </div>

                  <div className="premiumCard">
                    <Shuffle size={42} />
                    <h3>{t.randomizer}</h3>
                    <p>{t.randomizerDesc}</p>
                    <span>{t.locked}</span>
                  </div>
                </div>

                <button className="primaryAction" onClick={() => setIsPremium(true)}>
                  {t.unlockPremium}
                </button>
              </>
            )}

            {isPremium && (
              <>
                <div className="premiumToolTabs">
                  <button
                    className={premiumTool === "bank" ? "active" : ""}
                    onClick={() => setPremiumTool("bank")}
                  >
                    <Wallet size={18} />
                    {t.bank}
                  </button>

                  <button
                    className={premiumTool === "cards" ? "active" : ""}
                    onClick={() => setPremiumTool("cards")}
                  >
                    <CreditCard size={18} />
                    {t.cardTool}
                  </button>

                  <button
                    className={premiumTool === "randomizer" ? "active" : ""}
                    onClick={() => setPremiumTool("randomizer")}
                  >
                    <Sparkles size={18} />
                    {t.randomizer}
                  </button>
                </div>

                {premiumTool === "bank" && (
                  <>
                    <div className="bankHeader">
                      <Wallet size={36} />
                      <div>
                        <h3>{t.bankTitle}</h3>
                        <p>{t.bankDesc}</p>
                      </div>
                    </div>

                    <div className="bankPlayers">
                      {players.map((player) => (
                        <div className="bankPlayerCard" key={player.id}>
                          <div>
                            <strong>{player.name}</strong>
                            <span>${player.money || 0}</span>
                          </div>

                          <div className="bankButtons">
                            <button onClick={() => changeMoney(player.id, Number(bankAmount))}>
                              <Plus size={16} />
                            </button>

                            <button onClick={() => changeMoney(player.id, -Number(bankAmount))}>
                              <Minus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bankTransferCard">
                      <label>{t.amount}</label>

                      <input
                        type="number"
                        value={bankAmount}
                        onChange={(e) => setBankAmount(e.target.value)}
                      />

                      <label>{t.from}</label>

                      <select value={bankFrom} onChange={(e) => setBankFrom(e.target.value)}>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <label>{t.to}</label>

                      <select value={bankTo} onChange={(e) => setBankTo(e.target.value)}>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <button className="primaryAction" onClick={transferMoney}>
                        <ArrowLeftRight size={18} />
                        {t.transfer}
                      </button>
                    </div>

                    <button className="secondaryAction" onClick={resetBank}>
                      <RotateCcw size={18} />
                      {t.resetBank}
                    </button>

                    <div className="historyList">
                      <h3>{t.history}</h3>

                      {bankHistory.length === 0 && (
                        <div className="historyItem">
                          <span>{t.noHistory}</span>
                        </div>
                      )}

                      {bankHistory.map((item) => (
                        <div className="historyItem" key={item.id}>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {premiumTool === "cards" && (
                  <>
                    <div className="cardsHero">
                      <div className={`flipCard ${cardFlipping ? "flipping" : ""}`}>
                        <div className="flipCardInner">
                          <div className="flipCardFront">
                            <CreditCard size={42} />
                            <span>{lang === "fr" ? "Carte mystère" : "Mystery Card"}</span>
                          </div>

                          <div className="flipCardBack">
                            <strong>{drawnCard || "?"}</strong>
                          </div>
                        </div>
                      </div>

                      <button className="primaryAction" onClick={drawCard}>
                        {t.drawCard}
                      </button>
                    </div>

                    <div className="bankTransferCard">
                      <label>{t.cardName}</label>

                      <input
                        type="text"
                        value={newCard}
                        placeholder={lang === "fr" ? "Ex: Passe ton tour" : "Ex: Skip your turn"}
                        onChange={(e) => setNewCard(e.target.value)}
                      />

                      <button className="secondaryAction" onClick={addCard}>
                        <Plus size={18} />
                        {t.addCard}
                      </button>
                    </div>

                    <div className="deckList">
                      <h3>
                        {t.deck} ({cards.length})
                      </h3>

                      {cards.length === 0 && (
                        <div className="historyItem">
                          <span>{t.noCards}</span>
                        </div>
                      )}

                      {cards.map((card, index) => (
                        <div className="deckItem" key={`${card}-${index}`}>
                          <span>{card}</span>

                          <button onClick={() => removeCard(index)}>
                            <Minus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button className="secondaryAction" onClick={resetDeck}>
                      <RotateCcw size={18} />
                      {t.resetDeck}
                    </button>

                    <div className="historyList">
                      <h3>{t.drawnCards}</h3>

                      {cardHistory.length === 0 && (
                        <div className="historyItem">
                          <span>{t.noHistory}</span>
                        </div>
                      )}

                      {cardHistory.map((item) => (
                        <div className="historyItem" key={item.id}>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {premiumTool === "randomizer" && (
                  <>
                    <div className="randomizerHero">
                      <div className={`wheel ${spinningWheel ? "wheelSpin" : ""}`}>
                        <div className="wheelCenter">
                          <Sparkles size={42} />
                        </div>
                      </div>

                      <button className="primaryAction" onClick={spinWheel}>
                        {t.spinWheel}
                      </button>

                      {randomResult && (
                        <div className="randomResult">
                          <span>{t.selected}</span>
                          <strong>{randomResult}</strong>
                        </div>
                      )}
                    </div>

                    <div className="bankTransferCard">
                      <label>{t.optionName}</label>

                      <input
                        type="text"
                        value={randomInput}
                        placeholder={lang === "fr" ? "Ajouter un joueur ou une option" : "Add player or option"}
                        onChange={(e) => setRandomInput(e.target.value)}
                      />

                      <button className="secondaryAction" onClick={addRandomItem}>
                        <Plus size={18} />
                        {t.addOption}
                      </button>
                    </div>

                    <div className="deckList">
                      <h3>
                        {t.options} ({randomItems.length})
                      </h3>

                      {randomItems.map((item, index) => (
                        <div className="deckItem" key={`${item}-${index}`}>
                          <span>{item}</span>

                          <button onClick={() => removeRandomItem(index)}>
                            <Minus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
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
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
