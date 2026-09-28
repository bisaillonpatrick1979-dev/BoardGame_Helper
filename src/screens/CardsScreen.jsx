// Écran Cartes : piger, distribuer des mains privées, bataille et cartes personnalisées
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Minus, Pencil, Plus, Shuffle, Trash2, X } from "lucide-react";
import PlayingCard from "../cards/PlayingCard.jsx";
import { battleValue, cardName, shuffledDeck } from "../cards/deck.js";
import { randomInt, sfx, shuffle, useLang, useStored, vibrate } from "../lib/core.js";

// Carte qui arrive de la pioche puis se retourne
export function DealtCard({ card, width, delay = 0, className = "", faceUp = true }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    const timer = setTimeout(() => setShown(true), 180 + delay);
    return () => clearTimeout(timer);
  }, [card?.id, delay]);
  return (
    <div className={`dealIn ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <PlayingCard card={card} width={width} faceUp={faceUp && shown} />
    </div>
  );
}

// Pile de cartes (dos) avec le nombre restant
export function DeckPile({ count, width = 76, onClick }) {
  const layers = Math.min(5, Math.ceil(count / 10));
  return (
    <button className="deckPile" style={{ width }} onClick={onClick} disabled={!count}>
      {count === 0 && <div className="deckEmpty" style={{ width }} />}
      {Array.from({ length: layers }).map((_, i) => (
        <div key={i} className="deckLayer" style={{ transform: `translate(${-i * 1.5}px, ${-i * 1.5}px)` }}>
          <PlayingCard card={null} faceUp={false} width={width} />
        </div>
      ))}
      <span className="deckCount">{count}</span>
    </button>
  );
}

function DrawMode() {
  const { t, lang } = useLang();
  const [jokers, setJokers] = useState(false);
  const [decks, setDecks] = useState(1);
  const [deck, setDeck] = useState(() => shuffledDeck({ decks: 1, jokers: false }));
  const [drawn, setDrawn] = useState([]);

  function reshuffle(nextDecks = decks, nextJokers = jokers) {
    setDeck(shuffledDeck({ decks: nextDecks, jokers: nextJokers }));
    setDrawn([]);
    sfx.flip();
  }

  function draw() {
    if (!deck.length) return;
    const [card, ...rest] = deck;
    setDeck(rest);
    setDrawn((old) => [card, ...old]);
    sfx.deal();
    vibrate(15);
  }

  const last = drawn[0];

  return (
    <div className="cardsMode">
      <div className="feltTable">
        <div className="drawArea">
          <DeckPile count={deck.length} onClick={draw} />
          <div className="drawnSlot">
            {last ? <DealtCard key={last.id} card={last} width={150} /> : <div className="emptySlot">{t("Touche la pioche", "Tap the deck")}</div>}
          </div>
        </div>
        <div className="drawnName">{last ? cardName(last, lang) : " "}</div>
        <div className="drawnStrip">
          {drawn.slice(1, 12).map((card) => (
            <PlayingCard key={card.id} card={card} width={44} />
          ))}
        </div>
      </div>

      <div className="optionRow">
        <button
          className={`chipButton ${jokers ? "accent" : ""}`}
          onClick={() => {
            setJokers(!jokers);
            reshuffle(decks, !jokers);
          }}
        >
          Jokers {jokers ? "✓" : ""}
        </button>
        <div className="stepper small">
          <button onClick={() => { const n = Math.max(1, decks - 1); setDecks(n); reshuffle(n, jokers); }}>
            <Minus size={16} />
          </button>
          <strong>
            {decks} {t(decks > 1 ? "jeux" : "jeu", decks > 1 ? "decks" : "deck")}
          </strong>
          <button onClick={() => { const n = Math.min(8, decks + 1); setDecks(n); reshuffle(n, jokers); }}>
            <Plus size={16} />
          </button>
        </div>
        <button className="iconButton soft" onClick={() => reshuffle()} aria-label={t("Mélanger", "Shuffle")}>
          <Shuffle size={20} />
        </button>
      </div>

      <button className="bigAction" onClick={draw} disabled={!deck.length}>
        {deck.length ? t("Piger une carte", "Draw a card") : t("Pioche vide — mélange!", "Deck empty — shuffle!")}
      </button>
    </div>
  );
}

// Main en éventail
export function Fan({ cards, faceUp, width = 70, selected, onSelect }) {
  const n = cards.length;
  const spread = Math.min(12, 70 / Math.max(n, 1));
  return (
    <div className="fan" style={{ height: width * 1.4 + 40 }}>
      {cards.map((card, i) => {
        const angle = (i - (n - 1) / 2) * spread;
        const shift = (i - (n - 1) / 2) * Math.min(width * 0.55, 260 / Math.max(n, 1));
        const lift = selected === card.id ? -18 : 0;
        return (
          <div
            key={card.id}
            className="fanCard"
            style={{ transform: `translateX(${shift}px) translateY(${Math.abs(angle) * 1.2 + lift}px) rotate(${angle}deg)`, zIndex: i }}
          >
            <PlayingCard card={card} faceUp={faceUp} width={width} onClick={faceUp && onSelect ? () => onSelect(card.id) : undefined} />
          </div>
        );
      })}
    </div>
  );
}

function HandsMode({ players }) {
  const { t } = useLang();
  const seats = players.length >= 2 ? players.slice(0, 6) : [{ id: 1, name: "Joueur 1" }, { id: 2, name: "Joueur 2" }];
  const [cardsEach, setCardsEach] = useState(5);
  const [hands, setHands] = useState(null);
  const [turn, setTurn] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);

  function deal() {
    const deck = shuffledDeck();
    const next = {};
    seats.forEach((p) => (next[p.id] = []));
    let k = 0;
    for (let r = 0; r < cardsEach; r += 1) {
      seats.forEach((p) => {
        if (deck[k]) next[p.id].push(deck[k]);
        k += 1;
      });
    }
    setHands(next);
    setTurn(0);
    setVisible(false);
    sfx.flip();
  }

  const player = seats[turn % seats.length];
  const hand = hands ? hands[player.id] || [] : [];

  return (
    <div className="cardsMode">
      <div className="feltTable handTable">
        {!hands ? (
          <div className="emptySlot">{t("Choisis le nombre de cartes puis distribue.", "Pick how many cards, then deal.")}</div>
        ) : (
          <>
            <div className="turnBanner">
              {visible ? t("Main de", "Hand of") : t("Passe le téléphone à", "Pass the phone to")} <strong>{player.name}</strong>
            </div>
            <Fan cards={hand} faceUp={visible} width={hand.length > 7 ? 58 : 74} selected={selected} onSelect={(id) => setSelected(selected === id ? null : id)} />
          </>
        )}
      </div>

      {hands && (
        <div className="optionRow">
          <button className="chipButton" onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            {visible ? t("Cacher", "Hide") : t("Voir ma main", "Show my hand")}
          </button>
          <button
            className="chipButton accent"
            onClick={() => {
              setVisible(false);
              setSelected(null);
              setTurn((turn + 1) % seats.length);
            }}
          >
            {t("Joueur suivant", "Next player")} →
          </button>
        </div>
      )}

      <div className="optionRow">
        <span className="muted">{t("Cartes chacun", "Cards each")}</span>
        <div className="stepper small">
          <button onClick={() => setCardsEach(Math.max(1, cardsEach - 1))}>
            <Minus size={16} />
          </button>
          <strong>{cardsEach}</strong>
          <button onClick={() => setCardsEach(Math.min(Math.floor(52 / seats.length), cardsEach + 1))}>
            <Plus size={16} />
          </button>
        </div>
        <span className="muted">
          {seats.length} {t("joueurs", "players")}
        </span>
      </div>

      <button className="bigAction" onClick={deal}>
        {hands ? t("Redistribuer", "Deal again") : t("Distribuer", "Deal")}
      </button>
    </div>
  );
}

function BattleMode({ players }) {
  const { t } = useLang();
  const seats = players.length >= 2 ? players.slice(0, 4) : [{ id: 1, name: "Joueur 1" }, { id: 2, name: "Joueur 2" }];
  const [deck, setDeck] = useState(() => shuffledDeck());
  const [round, setRound] = useState(null);
  const [wins, setWins] = useState({});

  function play() {
    let pool = deck;
    if (pool.length < seats.length) pool = shuffledDeck();
    const cards = pool.slice(0, seats.length);
    setDeck(pool.slice(seats.length));
    const best = Math.max(...cards.map(battleValue));
    const winners = seats.filter((_, i) => battleValue(cards[i]) === best);
    setRound({ id: Date.now(), cards, winners: winners.map((w) => w.id) });
    if (winners.length === 1) {
      setWins((old) => ({ ...old, [winners[0].id]: (old[winners[0].id] || 0) + 1 }));
      setTimeout(sfx.good, 500);
    } else {
      setTimeout(sfx.bad, 500);
    }
    sfx.deal();
  }

  const tie = round && round.winners.length > 1;

  return (
    <div className="cardsMode">
      <div className="feltTable battleTable">
        <div className={`battleSeats seats${seats.length}`}>
          {seats.map((p, i) => (
            <div key={p.id} className={`battleSeat ${round?.winners.includes(p.id) && !tie ? "winner" : ""}`}>
              <span className="seatName">{p.name}</span>
              {round ? (
                <DealtCard key={`${round.id}-${i}`} card={round.cards[i]} width={seats.length > 2 ? 78 : 104} delay={i * 120} />
              ) : (
                <PlayingCard card={null} faceUp={false} width={seats.length > 2 ? 78 : 104} />
              )}
              <span className="seatWins">🏆 {wins[p.id] || 0}</span>
            </div>
          ))}
        </div>
        <div className="battleMessage">
          {round ? (tie ? t("Égalité — BATAILLE!", "Tie — WAR!") : `${seats.find((p) => p.id === round.winners[0]).name} ${t("gagne!", "wins!")}`) : " "}
        </div>
      </div>
      <div className="optionRow">
        <span className="muted">
          {deck.length} {t("cartes restantes", "cards left")}
        </span>
        <button
          className="iconButton soft"
          onClick={() => {
            setDeck(shuffledDeck());
            setWins({});
            setRound(null);
          }}
          aria-label={t("Recommencer", "Restart")}
        >
          <Shuffle size={20} />
        </button>
      </div>
      <button className="bigAction" onClick={play}>
        {t("Retourner les cartes", "Flip cards")}
      </button>
    </div>
  );
}

const DEFAULT_CUSTOM = {
  fr: ["Passe ton tour", "Rejoue", "Pige deux cartes", "Échange ta place", "Perds 100 $", "Gagne 100 $", "Recule de 3 cases", "Avance de 5 cases"],
  en: ["Skip your turn", "Play again", "Draw two cards", "Swap places", "Lose $100", "Win $100", "Go back 3 spaces", "Move forward 5 spaces"]
};

function CustomMode() {
  const { t, lang } = useLang();
  const [list, setList] = useStored("bgh2_custom_cards", DEFAULT_CUSTOM[lang] || DEFAULT_CUSTOM.fr);
  const [current, setCurrent] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const pile = useMemo(() => shuffle(list), [list]);

  function draw() {
    if (!list.length) return;
    setFlipped(false);
    sfx.flip();
    setTimeout(() => {
      setCurrent({ id: Date.now(), text: pile[randomInt(pile.length)] });
      setFlipped(true);
    }, 250);
  }

  return (
    <div className="cardsMode">
      <div className="feltTable">
        <div className={`eventCard ${flipped ? "up" : ""}`}>
          <div className="eventInner">
            <div className="eventFace eventBack">
              <PlayingCard card={null} faceUp={false} width={170} back="red" />
            </div>
            <div className="eventFace eventFront">
              <span>★</span>
              <strong>{current?.text}</strong>
              <span>★</span>
            </div>
          </div>
        </div>
      </div>
      <div className="optionRow">
        <span className="muted">
          {list.length} {t("cartes dans le paquet", "cards in the deck")}
        </span>
        <button className="chipButton" onClick={() => setEditing(true)}>
          <Pencil size={16} />
          {t("Modifier", "Edit")}
        </button>
      </div>
      <button className="bigAction" onClick={draw} disabled={!list.length}>
        {t("Piger une carte", "Draw a card")}
      </button>

      {editing && (
        <div className="sheetBackdrop" onClick={() => setEditing(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>{t("Mes cartes", "My cards")}</h2>
              <button className="iconButton" onClick={() => setEditing(false)}>
                <X size={22} />
              </button>
            </div>
            <form
              className="addRow"
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim()) return;
                setList([...list, input.trim()]);
                setInput("");
              }}
            >
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Ex. : Tout le monde recule", "Ex: Everyone moves back")} />
              <button className="iconButton accentBg" type="submit">
                <Plus size={20} />
              </button>
            </form>
            <div className="editList">
              {list.map((item, i) => (
                <div className="editRow" key={`${item}-${i}`}>
                  <span>{item}</span>
                  <button className="iconButton soft" onClick={() => setList(list.filter((_, j) => j !== i))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CardsScreen({ players }) {
  const { t } = useLang();
  const [mode, setMode] = useState("draw");
  const modes = [
    ["draw", t("Piger", "Draw")],
    ["hands", t("Mains", "Hands")],
    ["battle", t("Bataille", "War")],
    ["custom", t("Perso", "Custom")]
  ];
  return (
    <div className="cardsScreen">
      <div className="segmented">
        {modes.map(([id, label]) => (
          <button key={id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>
      {mode === "draw" && <DrawMode />}
      {mode === "hands" && <HandsMode players={players} />}
      {mode === "battle" && <BattleMode players={players} />}
      {mode === "custom" && <CustomMode />}
    </div>
  );
}
