// Tuiles de lettres : un sac de lettres pour les jeux de mots où il en manque
import { useState } from "react";
import { Minus, Plus, Shuffle, Undo2 } from "lucide-react";
import { shuffle, sfx, useLang, useStored, vibrate } from "../lib/core.js";

// Répartition inspirée de la fréquence des lettres dans chaque langue (102 tuiles)
const BAGS = {
  fr: { E: 15, A: 9, I: 8, N: 6, O: 6, R: 6, S: 6, T: 6, U: 6, L: 5, D: 3, M: 3, C: 2, P: 2, G: 2, B: 2, F: 2, H: 2, V: 2, J: 1, Q: 1, K: 1, W: 1, X: 1, Y: 1, Z: 1, "★": 2 },
  en: { E: 12, A: 9, I: 9, O: 8, N: 6, R: 6, T: 6, L: 4, S: 4, U: 4, D: 4, G: 3, B: 2, C: 2, M: 2, P: 2, F: 2, H: 2, V: 2, W: 2, Y: 2, K: 1, J: 1, X: 1, Q: 1, Z: 1, "★": 2 }
};

function freshBag(lang) {
  const bag = [];
  Object.entries(BAGS[lang] || BAGS.fr).forEach(([letter, n]) => {
    for (let i = 0; i < n; i += 1) bag.push(letter);
  });
  return shuffle(bag);
}

export default function LetterTiles() {
  const { t, lang } = useLang();
  const [bag, setBag] = useStored("bgh2_letters_bag", () => freshBag(lang));
  const [rack, setRack] = useStored("bgh2_letters_rack", []);
  const [size, setSize] = useStored("bgh2_letters_size", 7);
  const [picked, setPicked] = useState([]);

  function fill() {
    const need = Math.max(0, size - rack.length);
    if (!need || !bag.length) return;
    const drawn = bag.slice(0, need);
    setBag(bag.slice(need));
    setRack([...rack, ...drawn]);
    sfx.deal();
    vibrate(15);
  }

  // Remettre les tuiles choisies dans le sac et en piger autant
  function swap() {
    if (!picked.length) return;
    const keep = rack.filter((_, i) => !picked.includes(i));
    const back = rack.filter((_, i) => picked.includes(i));
    const newBag = shuffle([...bag, ...back]);
    const drawn = newBag.slice(0, back.length);
    setBag(newBag.slice(back.length));
    setRack([...keep, ...drawn]);
    setPicked([]);
    sfx.flip();
  }

  // Jouer les tuiles choisies (elles quittent le support)
  function play() {
    if (!picked.length) return;
    setRack(rack.filter((_, i) => !picked.includes(i)));
    setPicked([]);
    sfx.good();
  }

  return (
    <div className="tool">
      <div className="bagInfo">
        <div className="bagIcon">👜</div>
        <div>
          <strong>{bag.length}</strong> {t("tuiles dans le sac", "tiles in the bag")}
          <small>{t("★ = tuile joker", "★ = blank tile")}</small>
        </div>
        <button
          className="iconButton soft"
          onClick={() => {
            setBag(freshBag(lang));
            setRack([]);
            setPicked([]);
          }}
          aria-label={t("Nouveau sac", "New bag")}
        >
          <Shuffle size={20} />
        </button>
      </div>

      <div className="rackArea">
        <div className="rack">
          {rack.map((letter, i) => (
            <button
              key={`${letter}-${i}`}
              className={`tile ${picked.includes(i) ? "picked" : ""}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i])}
            >
              {letter}
            </button>
          ))}
          {rack.length === 0 && <p className="muted">{t("Ton support est vide.", "Your rack is empty.")}</p>}
        </div>
        <div className="rackWood" />
      </div>

      <div className="optionRow">
        <span className="muted">{t("Tuiles par support", "Tiles per rack")}</span>
        <div className="stepper small">
          <button onClick={() => setSize(Math.max(1, size - 1))}>
            <Minus size={16} />
          </button>
          <strong>{size}</strong>
          <button onClick={() => setSize(Math.min(21, size + 1))}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {picked.length > 0 ? (
        <div className="actionRow">
          <button className="bigAction secondary" onClick={swap}>
            <Undo2 size={18} /> {t("Échanger", "Swap")} ({picked.length})
          </button>
          <button className="bigAction gold" onClick={play}>
            {t("Jouer", "Play")} ({picked.length})
          </button>
        </div>
      ) : (
        <button className="bigAction" onClick={fill} disabled={rack.length >= size || !bag.length}>
          {t("Piger jusqu'à", "Draw up to")} {size}
        </button>
      )}
    </div>
  );
}
