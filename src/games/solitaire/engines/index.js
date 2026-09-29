// Registre des moteurs de solitaire : même interface pour toutes les variantes
//   deal(opts, rng) · apply(state, action) · actions(state) · hint(state) · tap(state, pile, index)
//   canSelect / canDrag / moveTo(state, sel, pile) · isWon · autoComplete · stuck
import * as klondike from "./klondike.js";
import * as freecell from "./freecell.js";
import * as spider from "./spider.js";
import * as pyramid from "./pyramid.js";
import * as golf from "./golf.js";

export const ENGINES = { klondike, freecell, spider, pyramid, golf };
export const VARIANT_IDS = ["klondike", "freecell", "spider", "pyramid", "golf"];

// Options par défaut de chaque variante
export const DEFAULT_OPTS = {
  klondike: { draw: 1 },
  freecell: {},
  spider: { suits: 1 },
  pyramid: {},
  golf: {}
};

// Cartes et piles concernées par une action (pour surligner un indice)
export function actionHighlight(state, action) {
  if (!action) return { cards: [], piles: [] };
  const p = state.piles;
  const topOf = (id) => (p[id] && p[id].length ? [p[id][p[id].length - 1] >> 1] : []);
  switch (action.t) {
    case "move":
      return { cards: p[action.from].slice(action.index).map((v) => v >> 1).concat(topOf(action.to)), piles: [action.to] };
    case "pair":
      return { cards: [...topOf(action.a), ...topOf(action.b)], piles: [] };
    case "king":
      return { cards: topOf(action.a), piles: [] };
    case "play":
      return { cards: [...topOf(action.from), ...topOf("waste")], piles: [] };
    default:
      return { cards: [], piles: ["stock"] };
  }
}
