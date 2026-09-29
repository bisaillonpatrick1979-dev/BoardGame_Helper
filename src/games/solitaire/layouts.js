// Mise en page des variantes : calcule la position (en px) de chaque carte et de chaque case vide
// selon la taille disponible. Fonctions pures → testables et animées par CSS (transform).
//
// Résultat : { w, h, cards: [{ v, pile, index, x, y, z }], slots: [{ pile, x, y, kind, label }],
//              drops: { pile: { x, y, w, h } }, badges: [{ x, y, text }] }
import { codeOf, isUp } from "./engines/cards.js";
import { coveredBy, rowOf, SLOTS } from "./engines/pyramid.js";

const PAD = 6;
const RATIO = 1.4; // hauteur / largeur d'une carte
const MAX_W = 104; // tablettes : cartes pas trop géantes

// Largeur de carte : limitée par la largeur (n colonnes) et par la hauteur (nombre de « hauteurs de carte » voulues)
function cardSize(W, H, cols, heightUnits, gapRatio = 0.1) {
  const byW = (W - PAD * 2) / (cols + (cols - 1) * gapRatio);
  const byH = (H - PAD * 2) / (RATIO * heightUnits);
  const w = Math.max(18, Math.min(byW, byH, MAX_W));
  const gap = Math.max(2, Math.min(w * gapRatio, 12));
  return { w, h: w * RATIO, gap };
}

// Colonnes centrées horizontalement
function columnsX(W, cols, w, gap) {
  const total = cols * w + (cols - 1) * gap;
  const left = (W - total) / 2;
  return Array.from({ length: cols }, (_, i) => left + i * (w + gap));
}

// Empile une colonne en éventail vertical qui se compresse pour ne jamais déborder :
// d'abord les cartes cachées (jusqu'à un minimum), ensuite toutes les cartes.
function fanColumn(out, pile, cards, x, y, h, availH, { down = 0.12, up = 0.3 } = {}) {
  const last = cards.length - 1;
  const room = Math.max(0, availH - h);
  const upSum = cards.filter((v, i) => i < last && isUp(v)).length * up * h;
  const downN = cards.filter((v, i) => i < last && !isUp(v)).length;
  let downOff = down * h;
  let k = 1;
  if (upSum + downN * downOff > room) {
    const minDown = Math.min(downOff, 0.05 * h);
    downOff = Math.max(minDown, downN ? (room - upSum) / downN : downOff);
    const total = upSum + downN * downOff;
    if (total > room && total > 0) k = room / total;
  }
  let cy = y;
  cards.forEach((v, i) => {
    out.push({ v, pile, index: i, x, y: cy, z: 10 + i });
    if (i < last) cy += (isUp(v) ? up * h : downOff) * k;
  });
  return cy + h; // bas de la colonne
}

// Hauteur (en hauteurs de carte) de la plus longue colonne, sans compression
function longestUnits(state, ids, { down = 0.12, up = 0.3 } = {}) {
  return ids.reduce((m, id) => {
    const p = state.piles[id];
    const u = p.reduce((a, v, i) => a + (i < p.length - 1 ? (isUp(v) ? up : down) : 1), 0);
    return Math.max(m, u);
  }, 1);
}

// Cartes plus petites (sans descendre sous 46 px) si une colonne ne tiendrait pas sinon
function fitColumns(size, W, H, cols, gapRatio, units) {
  const byW = (W - PAD * 2) / (cols + (cols - 1) * gapRatio);
  const floor = Math.min(byW, 46);
  const byH = (H - PAD * 2 - 8) / (RATIO * (1.16 + units));
  if (size.w <= byH) return size;
  const w = Math.max(floor, byH);
  if (w >= size.w) return size;
  return { w, h: w * RATIO, gap: Math.max(2, Math.min(w * gapRatio, 12)) };
}

// Paquet (talon) : légère épaisseur visible
function stackPile(out, pile, cards, x, y, zBase = 10) {
  cards.forEach((v, i) => {
    const lift = Math.min(Math.floor(i / 8), 3);
    out.push({ v, pile, index: i, x: x - lift * 0.6, y: y - lift, z: zBase + i });
  });
}

function base(W, H) {
  return { W, H, cards: [], slots: [], drops: {}, badges: [] };
}

// ---------- Klondike ----------
function klondike(state, W, H) {
  const L = base(W, H);
  const { w, h, gap } = fitColumns(cardSize(W, H, 7, 4.3), W, H, 7, 0.1, longestUnits(state, ["t0", "t1", "t2", "t3", "t4", "t5", "t6"]));
  const xs = columnsX(W, 7, w, gap);
  const topY = PAD;
  const tabY = topY + h + Math.max(8, h * 0.16);
  const p = state.piles;
  Object.assign(L, { w, h });

  // Talon
  L.slots.push({ pile: "stock", x: xs[0], y: topY, kind: p.waste.length ? "recycle" : "empty" });
  stackPile(L.cards, "stock", p.stock, xs[0], topY);
  if (p.stock.length) L.badges.push({ x: xs[0] + w - 4, y: topY + h - 4, text: String(p.stock.length) });

  // Défausse : les 3 dernières en éventail (pioche 3)
  const fanN = state.draw === 3 ? 3 : 1;
  const firstFan = Math.max(0, p.waste.length - fanN);
  p.waste.forEach((v, i) => {
    const k = Math.max(0, i - firstFan);
    L.cards.push({ v, pile: "waste", index: i, x: xs[1] + k * w * 0.3, y: topY, z: 10 + i });
  });
  L.slots.push({ pile: "waste", x: xs[1], y: topY, kind: "none" });

  // Fondations
  ["f0", "f1", "f2", "f3"].forEach((f, i) => {
    const x = xs[3 + i];
    L.slots.push({ pile: f, x, y: topY, kind: "foundation", label: "A" });
    stackPile(L.cards, f, p[f], x, topY);
    L.drops[f] = { x, y: topY, w, h };
  });

  // Colonnes
  const availH = H - PAD - tabY;
  ["t0", "t1", "t2", "t3", "t4", "t5", "t6"].forEach((t, i) => {
    L.slots.push({ pile: t, x: xs[i], y: tabY, kind: "tableau", label: "K" });
    fanColumn(L.cards, t, p[t], xs[i], tabY, h, availH);
    L.drops[t] = { x: xs[i] - gap / 2, y: tabY, w: w + gap, h: availH };
  });
  return L;
}

// ---------- FreeCell ----------
function freecell(state, W, H) {
  const L = base(W, H);
  const { w, h, gap } = fitColumns(cardSize(W, H, 8, 4.8), W, H, 8, 0.1, longestUnits(state, ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]));
  const xs = columnsX(W, 8, w, gap);
  const topY = PAD;
  const tabY = topY + h + Math.max(8, h * 0.16);
  const p = state.piles;
  Object.assign(L, { w, h });

  ["c0", "c1", "c2", "c3"].forEach((c, i) => {
    L.slots.push({ pile: c, x: xs[i], y: topY, kind: "cell" });
    stackPile(L.cards, c, p[c], xs[i], topY);
    L.drops[c] = { x: xs[i], y: topY, w, h };
  });
  ["f0", "f1", "f2", "f3"].forEach((f, i) => {
    L.slots.push({ pile: f, x: xs[4 + i], y: topY, kind: "foundation", label: "A" });
    stackPile(L.cards, f, p[f], xs[4 + i], topY);
    L.drops[f] = { x: xs[4 + i], y: topY, w, h };
  });
  const availH = H - PAD - tabY;
  for (let i = 0; i < 8; i += 1) {
    const t = `t${i}`;
    L.slots.push({ pile: t, x: xs[i], y: tabY, kind: "tableau" });
    fanColumn(L.cards, t, p[t], xs[i], tabY, h, availH, { up: 0.3 });
    L.drops[t] = { x: xs[i] - gap / 2, y: tabY, w: w + gap, h: availH };
  }
  return L;
}

// ---------- Araignée ----------
function spider(state, W, H) {
  const L = base(W, H);
  const tabIds = Array.from({ length: 10 }, (_, i) => `t${i}`);
  const { w, h, gap } = fitColumns(cardSize(W, H, 10, 4.6, 0.08), W, H, 10, 0.08, longestUnits(state, tabIds, { down: 0.1 }));
  const xs = columnsX(W, 10, w, gap);
  const topY = PAD;
  const tabY = topY + h + Math.max(8, h * 0.16);
  const p = state.piles;
  Object.assign(L, { w, h });

  // Suites terminées (à gauche) : on voit les Rois empilés
  L.slots.push({ pile: "done", x: xs[0], y: topY, kind: "done" });
  p.done.forEach((v, i) => {
    const run = Math.floor(i / 13);
    const inRun = i % 13;
    L.cards.push({ v, pile: "done", index: i, x: xs[0] + run * w * 0.22, y: topY, z: 10 + run * 20 + (13 - inRun) });
  });

  // Talon (à droite) : un petit paquet par distribution restante
  const deals = Math.ceil(p.stock.length / 10);
  L.slots.push({ pile: "stock", x: xs[9], y: topY, kind: deals ? "none" : "empty" });
  p.stock.forEach((v, i) => {
    const g = Math.floor(i / 10);
    L.cards.push({ v, pile: "stock", index: i, x: xs[9] - (deals - 1 - g) * w * 0.22, y: topY, z: 10 + i });
  });
  if (deals) L.badges.push({ x: xs[9] + w - 4, y: topY + h - 4, text: String(deals) });

  const availH = H - PAD - tabY;
  for (let i = 0; i < 10; i += 1) {
    const t = `t${i}`;
    L.slots.push({ pile: t, x: xs[i], y: tabY, kind: "tableau" });
    fanColumn(L.cards, t, p[t], xs[i], tabY, h, availH, { down: 0.1, up: 0.3 });
    L.drops[t] = { x: xs[i] - gap / 2, y: tabY, w: w + gap, h: availH };
  }
  return L;
}

// ---------- Pyramide ----------
function pyramid(state, W, H) {
  const L = base(W, H);
  const STEP = 0.44; // décalage vertical entre rangées (en hauteurs de carte)
  const pyrUnits = 1 + 6 * STEP;
  const units = pyrUnits + 0.35 + 1;
  const { w, h, gap } = cardSize(W, H, 7, units, 0.1);
  const p = state.piles;
  Object.assign(L, { w, h });
  const cx = W / 2;
  const totalH = h * units;
  const top0 = Math.max(PAD, (H - totalH) / 2);

  SLOTS.forEach((id, i) => {
    const r = rowOf(i);
    const k = i - (r * (r + 1)) / 2;
    const x = cx - ((r + 1) * w + r * gap) / 2 + k * (w + gap);
    const y = top0 + r * STEP * h;
    p[id].forEach((v, j) => {
      const cover = coveredBy(i).filter((c) => p[`p${c}`].length).length;
      L.cards.push({ v, pile: id, index: j, x, y, z: 10 + r * 2, dim: cover > 0, hideCenter: cover === 2 });
    });
  });

  const by = top0 + pyrUnits * h + 0.35 * h;
  const sx = cx - w * 1.5 - gap * 1.5;
  const wx = cx - w / 2;
  const dx = cx + w / 2 + gap * 1.5;
  L.slots.push({ pile: "stock", x: sx, y: by, kind: state.piles.waste.length && state.recycles > 0 ? "recycle" : "empty" });
  stackPile(L.cards, "stock", p.stock, sx, by);
  if (p.stock.length) L.badges.push({ x: sx + w - 4, y: by + h - 4, text: String(p.stock.length) });
  L.badges.push({ x: sx + w / 2, y: by + h + 12, text: `↻ ${state.recycles}`, plain: true });
  L.slots.push({ pile: "waste", x: wx, y: by, kind: "empty" });
  stackPile(L.cards, "waste", p.waste, wx, by);
  L.drops.waste = { x: wx, y: by, w, h };
  L.slots.push({ pile: "done", x: dx, y: by, kind: "done" });
  p.done.forEach((v, i) => L.cards.push({ v, pile: "done", index: i, x: dx + (i % 2) * 2, y: by - Math.min(Math.floor(i / 6), 4), z: 10 + i }));
  // Cibles de dépôt : chaque carte libre de la pyramide
  SLOTS.forEach((id, i) => {
    if (!p[id].length) return;
    const c = L.cards.find((cc) => cc.pile === id);
    L.drops[id] = { x: c.x, y: c.y, w, h: coveredBy(i).length ? h * STEP : h };
  });
  return L;
}

// ---------- Golf ----------
function golf(state, W, H) {
  const L = base(W, H);
  const UP = 0.3;
  const colUnits = 1 + 4 * UP;
  const units = colUnits + 0.45 + 1;
  const { w, h, gap } = cardSize(W, H, 7, units + 0.2);
  const xs = columnsX(W, 7, w, gap);
  const p = state.piles;
  Object.assign(L, { w, h });
  const totalH = h * units;
  const top0 = Math.max(PAD, (H - totalH) / 2);
  for (let i = 0; i < 7; i += 1) {
    const t = `t${i}`;
    L.slots.push({ pile: t, x: xs[i], y: top0, kind: "tableau" });
    fanColumn(L.cards, t, p[t], xs[i], top0, h, h * colUnits + 1, { up: UP });
  }
  const by = top0 + colUnits * h + 0.45 * h;
  const cx = W / 2;
  const sx = cx - w - gap * 3;
  const wx = cx - gap;
  L.slots.push({ pile: "stock", x: sx, y: by, kind: "empty" });
  stackPile(L.cards, "stock", p.stock, sx, by);
  if (p.stock.length) L.badges.push({ x: sx + w - 4, y: by + h - 4, text: String(p.stock.length) });
  // Défausse : les dernières cartes légèrement décalées vers la droite
  const n = p.waste.length;
  p.waste.forEach((v, i) => {
    const k = Math.max(0, i - (n - 3));
    L.cards.push({ v, pile: "waste", index: i, x: wx + k * w * 0.36, y: by, z: 10 + i });
  });
  L.slots.push({ pile: "waste", x: wx, y: by, kind: "none" });
  L.drops.waste = { x: wx, y: by, w: w * 1.72, h };
  return L;
}

const LAYOUTS = { klondike, freecell, spider, pyramid, golf };

export function layoutFor(state, W, H) {
  const L = LAYOUTS[state.v](state, W, H);
  L.cards.forEach((c) => (c.id = codeOf(c.v)));
  return L;
}

// Pile visée par un dépôt : celle dont la zone recouvre le plus la carte déplacée
export function dropCandidates(L, x, y) {
  const r = { x, y, w: L.w, h: L.h };
  return Object.entries(L.drops)
    .map(([pile, d]) => {
      const ox = Math.max(0, Math.min(r.x + r.w, d.x + d.w) - Math.max(r.x, d.x));
      const oy = Math.max(0, Math.min(r.y + r.h, d.y + d.h) - Math.max(r.y, d.y));
      return { pile, area: ox * oy };
    })
    .filter((c) => c.area > 0)
    .sort((a, b) => b.area - a.area)
    .map((c) => c.pile);
}
