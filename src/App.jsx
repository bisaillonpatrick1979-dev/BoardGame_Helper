import { Dice6, Timer, Trophy, Wallet } from "lucide-react";

const cards = [
  {
    title: "Dice",
    icon: <Dice6 size={42} />,
    description: "3D dice rolling and multi-roll support"
  },
  {
    title: "Timer",
    icon: <Timer size={42} />,
    description: "Game timers and countdowns"
  },
  {
    title: "Scoreboard",
    icon: <Trophy size={42} />,
    description: "Track players and rounds"
  },
  {
    title: "Bank",
    icon: <Wallet size={42} />,
    description: "Premium game money manager"
  }
];

export default function App() {
  return (
    <div className="app">
      <div className="backgroundGlow"></div>

      <header className="hero">
        <h1>Board Game Helper</h1>

        <p>
          Premium offline companion for board games,
          camping nights and family game sessions.
        </p>

        <button className="heroButton">
          Launch Game Tools
        </button>
      </header>

      <section className="cardGrid">
        {cards.map((card) => (
          <div className="featureCard" key={card.title}>
            <div className="iconWrap">
              {card.icon}
            </div>

            <h2>{card.title}</h2>

            <p>{card.description}</p>
          </div>
        ))}
      </section>

      <section className="dicePreview">
        <div className="dice3d">
          🎲
        </div>

        <div className="diceText">
          <h2>Animated Dice Experience</h2>

          <p>
            Premium pseudo-3D dice animations designed
            for mobile devices.
          </p>
        </div>
      </section>
    </div>
  );
}
