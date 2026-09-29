// Outils de cartes partagés par tous les moteurs de solitaire (fonctions pures, sans React).
//
// Représentation compacte : chaque carte est un entier  v = code * 2 + (face visible ? 1 : 0)
//   code = copie * 52 + couleur * 13 + (rang - 1)
// → sauvegarde minuscule (localStorage + nuage) et états faciles à copier.

export const SUIT_KEYS = ["spades", "hearts", "diamonds", "clubs"];
export const RANK_KEYS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const card = (code, faceUp = false) => code * 2 + (faceUp ? 1 : 0);
export const codeOf = (v) => v >> 1;
export const isUp = (v) => (v & 1) === 1;
export const flipUp = (v) => v | 1;
export const flipDown = (v) => v & ~1;
export const rankOf = (v) => ((v >> 1) % 13) + 1;
export const suitIdx = (v) => Math.floor((v >> 1) / 13) % 4;
export const suitOf = (v) => SUIT_KEYS[suitIdx(v)];
export const isRed = (v) => {
  const s = suitIdx(v);
  return s === 1 || s === 2;
};
export const rankKey = (v) => RANK_KEYS[rankOf(v) - 1];

// Dernière carte d'une pile (le « dessus »)
export const top = (pile) => (pile && pile.length ? pile[pile.length - 1] : undefined);

// Construit la liste des codes : plusieurs copies, couleurs choisies (Araignée 1/2/4 couleurs)
export function makeCodes({ copies = 1, suits = [0, 1, 2, 3] } = {}) {
  const codes = [];
  for (let c = 0; c < copies; c += 1) {
    suits.forEach((s) => {
      for (let r = 0; r < 13; r += 1) codes.push(c * 52 + s * 13 + r);
    });
  }
  return codes;
}

// Mélange Fisher-Yates avec un générateur injectable (tests reproductibles)
export function shuffleWith(array, rng = Math.random) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Petit générateur pseudo-aléatoire à graine (mulberry32)
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Toutes les cartes de l'état (pour vérifier qu'aucune ne disparaît)
export function allCards(state) {
  return Object.values(state.piles).flat();
}

// Suite « alternée descendante » (Klondike, FreeCell) : couleurs alternées, rang -1, faces visibles
export function isAltRun(cards) {
  for (let i = 0; i < cards.length; i += 1) {
    if (!isUp(cards[i])) return false;
    if (i > 0) {
      const a = cards[i - 1];
      const b = cards[i];
      if (isRed(a) === isRed(b) || rankOf(a) !== rankOf(b) + 1) return false;
    }
  }
  return true;
}

// Suite « même couleur descendante » (Araignée)
export function isSuitRun(cards) {
  for (let i = 0; i < cards.length; i += 1) {
    if (!isUp(cards[i])) return false;
    if (i > 0) {
      const a = cards[i - 1];
      const b = cards[i];
      if (suitIdx(a) !== suitIdx(b) || rankOf(a) !== rankOf(b) + 1) return false;
    }
  }
  return true;
}

// Peut-on poser v sur la fondation f ? (As d'abord, puis même couleur +1)
export function fitsFoundation(f, v) {
  if (!f.length) return rankOf(v) === 1;
  const t = top(f);
  return suitIdx(t) === suitIdx(v) && rankOf(v) === rankOf(t) + 1;
}

// Déplacement de base : enlève pile[from][index…] et l'ajoute à pile[to]
export function moveCards(piles, from, index, to) {
  const next = { ...piles };
  const moving = piles[from].slice(index);
  next[from] = piles[from].slice(0, index);
  next[to] = [...piles[to], ...moving];
  return next;
}

// Retourne la carte du dessus d'une pile si elle est face cachée
export function revealTop(piles, id) {
  const p = piles[id];
  if (p && p.length && !isUp(top(p))) {
    const copy = [...p];
    copy[copy.length - 1] = flipUp(copy[copy.length - 1]);
    return { ...piles, [id]: copy };
  }
  return piles;
}

export const range = (n, prefix) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

// Choisit l'action au meilleur score (null si aucune avec score >= min)
export function best(scored, min = 0) {
  let pick = null;
  scored.forEach((s) => {
    if (s.score >= min && (!pick || s.score > pick.score)) pick = s;
  });
  return pick ? pick.action : null;
}
