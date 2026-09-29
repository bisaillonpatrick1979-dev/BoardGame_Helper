// Table de cartes libre en réseau : un vrai paquet partagé, chacun sa main sur son téléphone.
// Pas de règles imposées : on pige, on distribue, on joue au centre, on donne une carte…
// Parfait pour la Dame de pique, le 8 américain, le Crazy Eights, la Bataille, le Rami, etc.
import { buildDeck } from "../../cards/deck.js";
import { shuffle } from "../../lib/core.js";

const MAX_LOG = 8;

function log(gs, name, fr, en) {
  gs.log = [...gs.log, { name, fr, en }].slice(-MAX_LOG);
}

const findIn = (list, id) => list.findIndex((c) => c.id === id);

export default {
  id: "cards",
  emoji: "🃏",
  name: { fr: "Cartes libres", en: "Free card table" },
  desc: { fr: "Un paquet partagé, chacun sa main : joue à n'importe quel jeu", en: "One shared deck, private hands: play any card game" },
  min: 1,
  max: 8,
  defaultOpts: { decks: 1, jokers: false },

  setup({ seats, opts }) {
    const hands = {};
    const revealed = {};
    seats.forEach((id) => {
      hands[id] = [];
      revealed[id] = false;
    });
    return {
      deck: shuffle(buildDeck({ decks: opts.decks === 2 ? 2 : 1, jokers: Boolean(opts.jokers) })),
      table: [],
      hands,
      revealed,
      log: [],
      seats: [...seats]
    };
  },

  apply(prev, pid, action, { names }) {
    if (!prev.hands[pid] || !action) return null; // spectateur
    const gs = structuredClone(prev);
    const hand = gs.hands[pid];
    const name = names[pid] || "?";

    switch (action.type) {
      case "draw": {
        const n = Math.max(1, Math.min(10, Math.floor(Number(action.n) || 1)));
        if (!gs.deck.length) return null;
        const got = gs.deck.splice(-n, n);
        hand.push(...got);
        log(gs, name, `pige ${got.length} carte${got.length > 1 ? "s" : ""}`, `draws ${got.length} card${got.length > 1 ? "s" : ""}`);
        return gs;
      }
      case "deal": {
        // Distribue n cartes à chaque joueur assis
        const n = Math.max(1, Math.min(26, Math.floor(Number(action.n) || 1)));
        if (gs.deck.length < gs.seats.length) return null;
        for (let r = 0; r < n; r += 1) {
          gs.seats.forEach((id) => {
            if (gs.deck.length) gs.hands[id].push(gs.deck.pop());
          });
        }
        log(gs, name, `distribue ${n} carte${n > 1 ? "s" : ""} à chacun`, `deals ${n} card${n > 1 ? "s" : ""} each`);
        return gs;
      }
      case "play": {
        const ids = Array.isArray(action.ids) ? action.ids.slice(0, 13) : [];
        const played = [];
        for (const id of ids) {
          const k = findIn(hand, id);
          if (k < 0) return null;
          played.push(hand.splice(k, 1)[0]);
        }
        if (!played.length) return null;
        gs.table.push(...played.map((c) => ({ ...c, by: pid })));
        log(gs, name, `joue ${played.length > 1 ? `${played.length} cartes` : "une carte"}`, `plays ${played.length > 1 ? `${played.length} cards` : "a card"}`);
        return gs;
      }
      case "take": {
        // Reprend la carte du dessus au centre
        const top = gs.table.pop();
        if (!top) return null;
        delete top.by;
        hand.push(top);
        log(gs, name, "prend la carte du centre", "takes the top card");
        return gs;
      }
      case "give": {
        const k = findIn(hand, action.id);
        if (k < 0 || !gs.hands[action.to] || action.to === pid) return null;
        gs.hands[action.to].push(hand.splice(k, 1)[0]);
        log(gs, name, `donne une carte à ${names[action.to] || "?"}`, `gives a card to ${names[action.to] || "?"}`);
        return gs;
      }
      case "reveal": {
        gs.revealed[pid] = Boolean(action.on);
        log(gs, name, action.on ? "montre sa main" : "cache sa main", action.on ? "shows their hand" : "hides their hand");
        return gs;
      }
      case "clearTable": {
        // Le centre retourne sous le paquet (sans mélanger)
        if (!gs.table.length) return null;
        gs.deck = [...gs.table.map(({ by, ...c }) => c), ...gs.deck];
        gs.table = [];
        log(gs, name, "remet le centre sous le paquet", "puts the table under the deck");
        return gs;
      }
      case "collect": {
        // Nouvelle donne : toutes les cartes reviennent dans le paquet, mélangé
        const all = [...gs.deck, ...gs.table.map(({ by, ...c }) => c)];
        Object.keys(gs.hands).forEach((id) => {
          all.push(...gs.hands[id]);
          gs.hands[id] = [];
          gs.revealed[id] = false;
        });
        gs.deck = shuffle(all);
        gs.table = [];
        log(gs, name, "ramasse et mélange tout", "collects and shuffles everything");
        return gs;
      }
      default:
        return null;
    }
  },

  view(gs, pid, { names }) {
    return {
      deckCount: gs.deck.length,
      table: gs.table.slice(-10),
      tableCount: gs.table.length,
      myHand: gs.hands[pid] || null,
      revealedMine: Boolean(gs.revealed[pid]),
      others: gs.seats
        .filter((id) => id !== pid)
        .map((id) => ({ id, name: names[id] || "?", count: gs.hands[id].length, cards: gs.revealed[id] ? gs.hands[id] : null })),
      log: gs.log
    };
  }
};
