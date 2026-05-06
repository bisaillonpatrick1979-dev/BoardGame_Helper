import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dice6,
  Timer,
  Trophy,
  Wallet,
  Cards,
  Shuffle,
  Lock,
  Home,
  RotateCcw,
  Plus,
  Minus
} from "lucide-react";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "dice", label: "Dice", icon: Dice6 },
  { id: "timer", label: "Timer", icon: Timer },
  { id: "score", label: "Score", icon: Trophy },
  { id: "premium", label: "Premium", icon: Lock }
];

const diceTypes = [4, 6, 8, 10, 12, 20];

function randomRoll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export default function App() {
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

  const totalRoll = useMemo(() => {
    return rolls.reduce((sum, value) => sum + value, 0);
  }, [rolls]);

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

    setTimeout(() => {
      const newRolls = Array.from({ length: diceCount }, () =>
        randomRoll(selectedDie)
      );

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
    }, 650);
  }

  function changePlayerScore(playerId, amount) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === playerId
          ? { ...player, score: player.score + amount }
          : player
      )
    );
  }

  function addPlayer() {
    setPlayers((currentPlayers) => [
      ...currentPlayers,
      {
        id: Date.now(),
        name: `Player ${currentPlayers.length + 1}`,
        score: 0
      }
    ]);
  }

  function resetScores() {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => ({ ...player, score: 0 }))
    );
  }

  return (
    <div className="app">
      <div className="backgroundGlow backgroundGlowOne"></div>
      <div className="backgroundGlow backgroundGlowTwo"></div>

      <main className="screen">
        {activeTab === "home" && (
          <section className="hero">
            <div className="premiumBadge">Offline PWA • Premium Game Tools</div>

            <h1>Board Game Helper</h1>

            <p>
              Replace missing dice, timers, score sheets, cards and money tools
              with one premium mobile companion.
            </p>

            <button className="heroButton" onClick={() => setActiveTab("dice")}>
              Rescue Game Night
            </button>

            <div className="homeGrid">
              <button className="homeTile" onClick={() => setActiveTab("dice")}>
                <Dice6 size={38} />
                <span>Roll Dice</span>
              </button>

              <button className="homeTile" onClick={() => setActiveTab("timer")}>
                <Timer size={38} />
                <span>Start Timer</span>
              </button>

              <button className="homeTile" onClick={() => setActiveTab("score")}>
                <Trophy size={38} />
                <span>Track Score</span>
              </button>

              <button
                className="homeTile lockedTile"
                onClick={() => setActiveTab("premium")}
              >
                <Wallet size={38} />
                <span>Premium Bank</span>
              </button>
            </div>
          </section>
        )}

        {activeTab === "dice" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>3D Dice Roller</h2>
              <p>Choose dice, roll multiple at once, and keep history.</p>
            </div>

            <div className={`megaDice ${rolling ? "rolling" : ""}`}>🎲</div>

            <div className="resultPanel">
              <span>Total</span>
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
              <span>Number of dice</span>

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
              Roll Dice
            </button>

            <div className="historyList">
              {history.map((item) => (
                <div className="historyItem" key={item.id}>
                  <span>
                    {item.count} × D{item.die}
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
              <h2>Game Timer</h2>
              <p>Fast presets for turns, challenges and family games.</p>
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
              onClick={() => setTimerRunning((value) => !value)}
            >
              {timerRunning ? "Pause Timer" : "Start Timer"}
            </button>

            <button
              className="secondaryAction"
              onClick={() => {
                setTimerRunning(false);
                setSeconds(300);
              }}
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </section>
        )}

        {activeTab === "score" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>Scoreboard</h2>
              <p>Track multiple players with quick plus and minus controls.</p>
            </div>

            <div className="playerList">
              {players.map((player) => (
                <div className="playerCard" key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>Current score</span>
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
              Add Player
            </button>

            <button className="secondaryAction" onClick={resetScores}>
              <RotateCcw size={18} />
              Reset Scores
            </button>
          </section>
        )}

        {activeTab === "premium" && (
          <section className="toolPage">
            <div className="pageHeader">
              <h2>Premium Tools</h2>
              <p>Bank, cards, randomizer and premium themes are locked.</p>
            </div>

            <div className="premiumGrid">
              <div className="premiumCard">
                <Wallet size={42} />
                <h3>Game Bank</h3>
                <p>Money balances, transfers and transaction history.</p>
                <span>Premium Games Pack</span>
              </div>

              <div className="premiumCard">
                <Cards size={42} />
                <h3>Cards</h3>
                <p>Custom decks, random draw and flip animations.</p>
                <span>Premium Games Pack</span>
              </div>

              <div className="premiumCard">
                <Shuffle size={42} />
                <h3>Randomizer</h3>
                <p>Animated wheel and custom random selections.</p>
                <span>Premium Games Pack</span>
              </div>
            </div>

            <button className="primaryAction">Unlock Premium</button>
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
