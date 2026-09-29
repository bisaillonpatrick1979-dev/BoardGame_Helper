// Moteur des jeux de mots : fonctions pures (aucun React), testables dans node.
// - normalizeWord : mot affiché → lettres de grille A à Z
// - generateCrossword : place des mots qui se croisent dans une grille carrée
// - generateWordSearch : cache des mots dans une grille de lettres
// - lineCells / snapLine : outils de sélection en ligne droite pour les mots cachés

// ---------- Outils ----------

// « Écureuil » → « ECUREUIL », « Arc-en-ciel » → « ARCENCIEL », « Cœur » → « COEUR »
export function normalizeWord(word) {
  return String(word)
    .toUpperCase()
    .replace(/Œ/g, "OE")
    .replace(/Æ/g, "AE")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z]/g, "");
}

// Générateur pseudo-aléatoire reproductible (pour les tests) : mulberry32
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// ---------- Mots croisés ----------

// Réglages par niveau : taille de grille, longueurs permises, nombre de mots visé
export const CROSSWORD_LEVELS = {
  easy: { size: 9, minLen: 3, maxLen: 6, target: 14 },
  medium: { size: 10, minLen: 3, maxLen: 8, target: 18 },
  hard: { size: 11, minLen: 3, maxLen: 11, target: 22 }
};

// Direction : "A" = horizontal (across), "D" = vertical (down)
const STEP = { A: [0, 1], D: [1, 0] };

// Une tentative : on part d'un mot au centre, puis on greffe les autres en croisement
function crosswordAttempt(pool, size, target, rng) {
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  // Pour chaque case, les directions déjà occupées par un mot
  const used = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ A: false, D: false })));
  const placed = [];
  const keys = new Set();

  const inside = (r, c) => r >= 0 && c >= 0 && r < size && c < size;
  const empty = (r, c) => !inside(r, c) || grid[r][c] === "";

  // Vérifie si « key » peut être posé à (r,c) dans la direction dir ; renvoie le nombre de croisements ou -1
  function fit(key, r, c, dir) {
    const [dr, dc] = STEP[dir];
    const len = key.length;
    const endR = r + dr * (len - 1);
    const endC = c + dc * (len - 1);
    if (!inside(r, c) || !inside(endR, endC)) return -1;
    // Les cases juste avant et juste après le mot doivent rester vides
    if (!empty(r - dr, c - dc) || !empty(endR + dr, endC + dc)) return -1;
    let crossings = 0;
    for (let i = 0; i < len; i += 1) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const cell = grid[rr][cc];
      if (cell) {
        if (cell !== key[i] || used[rr][cc][dir]) return -1;
        crossings += 1;
      } else {
        // Nouvelle lettre : ses voisines perpendiculaires doivent être vides
        // (sinon on créerait des mots parasites)
        if (!empty(rr + dc, cc + dr) || !empty(rr - dc, cc - dr)) return -1;
      }
    }
    return crossings === len ? -1 : crossings;
  }

  function put(entry, r, c, dir) {
    const [dr, dc] = STEP[dir];
    for (let i = 0; i < entry.key.length; i += 1) {
      grid[r + dr * i][c + dc * i] = entry.key[i];
      used[r + dr * i][c + dc * i][dir] = true;
    }
    placed.push({ ...entry, row: r, col: c, dir });
    keys.add(entry.key);
  }

  // Premier mot : un des plus longs, à l'horizontale au milieu
  const longest = pool.filter((e) => e.key.length >= Math.min(size - 2, 7));
  const first = (longest.length ? longest : pool)[Math.floor(rng() * (longest.length || pool.length))];
  const firstRow = Math.floor(size / 2) + (rng() < 0.5 ? 0 : -1);
  const firstCol = Math.floor((size - first.key.length) * rng());
  // Horizontal sur la ligne du milieu, ou vertical sur la colonne du milieu
  if (rng() < 0.5) put(first, firstRow, firstCol, "A");
  else put(first, firstCol, firstRow, "D");

  const candidates = shuffled(pool, rng);
  let progress = true;
  while (placed.length < target && progress) {
    progress = false;
    for (const entry of candidates) {
      if (placed.length >= target) break;
      if (keys.has(entry.key)) continue;
      // Cherche toutes les positions qui croisent une lettre déjà posée
      let best = null;
      let bestScore = -1;
      for (const p of placed) {
        const [pdr, pdc] = STEP[p.dir];
        const dir = p.dir === "A" ? "D" : "A";
        const [dr, dc] = STEP[dir];
        for (let i = 0; i < p.key.length; i += 1) {
          const cr = p.row + pdr * i;
          const cc = p.col + pdc * i;
          const letter = p.key[i];
          for (let j = 0; j < entry.key.length; j += 1) {
            if (entry.key[j] !== letter) continue;
            const r = cr - dr * j;
            const c = cc - dc * j;
            const crossings = fit(entry.key, r, c, dir);
            if (crossings < 1) continue;
            // Préfère plusieurs croisements, puis la proximité du centre (grille compacte)
            const mid = (size - 1) / 2;
            const centerR = r + (dr * (entry.key.length - 1)) / 2;
            const centerC = c + (dc * (entry.key.length - 1)) / 2;
            const score = crossings * 10 - (Math.abs(centerR - mid) + Math.abs(centerC - mid)) * 0.6 + rng() * 2;
            if (score > bestScore) {
              bestScore = score;
              best = { r, c, dir };
            }
          }
        }
      }
      if (best) {
        put(entry, best.r, best.c, best.dir);
        progress = true;
      }
    }
  }

  const letters = placed.reduce((sum, p) => sum + p.key.length, 0);
  const filled = grid.flat().filter(Boolean).length;
  const crossings = letters - filled;
  return { grid, placed, filled, crossings };
}

// Recentre le contenu de la grille (décale la boîte englobante au milieu)
function recenter(attempt, size) {
  let minR = size, maxR = -1, minC = size, maxC = -1;
  attempt.grid.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (!ch) return;
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    })
  );
  const offR = Math.floor((size - (maxR - minR + 1)) / 2) - minR;
  const offC = Math.floor((size - (maxC - minC + 1)) / 2) - minC;
  const grid = Array.from({ length: size }, () => Array(size).fill(""));
  attempt.grid.forEach((row, r) => row.forEach((ch, c) => { if (ch) grid[r + offR][c + offC] = ch; }));
  const placed = attempt.placed.map((p) => ({ ...p, row: p.row + offR, col: p.col + offC }));
  return { ...attempt, grid, placed };
}

/**
 * Génère une grille de mots croisés.
 * @param {{word:string, clue:string}[]} bank banque de mots
 * @param {"easy"|"medium"|"hard"} level niveau
 * @param {{rng?:Function, budgetMs?:number, maxAttempts?:number}} options
 * @returns {{size:number, solution:string[], words:object[], level:string}}
 */
export function generateCrossword(bank, level = "medium", options = {}) {
  const cfg = CROSSWORD_LEVELS[level] || CROSSWORD_LEVELS.medium;
  const rng = options.rng || Math.random;
  const budget = options.budgetMs ?? 120;
  const maxAttempts = options.maxAttempts ?? 400;
  const { size, target } = cfg;

  // Banque filtrée : longueur permise, sans doublons de lettres
  const seen = new Set();
  const pool = [];
  for (const item of bank) {
    const key = normalizeWord(item.word);
    if (key.length < cfg.minLen || key.length > Math.min(cfg.maxLen, size) || seen.has(key)) continue;
    seen.add(key);
    pool.push({ key, word: item.word, clue: item.clue });
  }

  const start = now();
  let best = null;
  let bestScore = -Infinity;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    // Chaque tentative pioche un sous-ensemble différent de la banque
    const sample = shuffled(pool, rng).slice(0, 90);
    const result = crosswordAttempt(sample, size, target, rng);
    const score = result.placed.length * 100 + result.crossings * 12 + result.filled;
    if (score > bestScore) {
      bestScore = score;
      best = result;
    }
    if (now() - start > budget && best && best.placed.length >= Math.min(target, 6)) break;
  }

  const final = recenter(best, size);
  return buildCrosswordPuzzle(final, size, level);
}

// Numérote les cases (style classique) et construit l'objet de la grille
function buildCrosswordPuzzle({ grid, placed }, size, level) {
  const solution = grid.map((row) => row.map((ch) => ch || ".").join(""));
  const numbers = {};
  let n = 0;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (placed.some((p) => p.row === r && p.col === c)) {
        n += 1;
        numbers[`${r},${c}`] = n;
      }
    }
  }
  const words = placed
    .map((p) => ({
      num: numbers[`${p.row},${p.col}`],
      dir: p.dir,
      row: p.row,
      col: p.col,
      len: p.key.length,
      answer: p.key,
      word: p.word,
      clue: p.clue
    }))
    .sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === "A" ? -1 : 1))
    .map((w, i) => ({ ...w, id: i }));
  return { size, level, solution, words };
}

// Cases (index r*size+c) occupées par un mot de la grille de mots croisés
export function wordCells(word, size) {
  const [dr, dc] = STEP[word.dir];
  return Array.from({ length: word.len }, (_, i) => (word.row + dr * i) * size + (word.col + dc * i));
}

// Toutes les suites de 2 lettres ou plus lues dans la grille (sert aux tests)
export function readRuns(solution) {
  const size = solution.length;
  const runs = [];
  for (let r = 0; r < size; r += 1) {
    let c = 0;
    while (c < size) {
      if (solution[r][c] === ".") { c += 1; continue; }
      let e = c;
      while (e < size && solution[r][e] !== ".") e += 1;
      if (e - c >= 2) runs.push({ dir: "A", row: r, col: c, text: solution[r].slice(c, e) });
      c = e;
    }
  }
  for (let c = 0; c < size; c += 1) {
    let r = 0;
    while (r < size) {
      if (solution[r][c] === ".") { r += 1; continue; }
      let e = r;
      let text = "";
      while (e < size && solution[e][c] !== ".") { text += solution[e][c]; e += 1; }
      if (e - r >= 2) runs.push({ dir: "D", row: r, col: c, text });
      r = e;
    }
  }
  return runs;
}

// ---------- Mots cachés ----------

// Les 8 directions [dr, dc]
export const DIRECTIONS = {
  E: [0, 1], S: [1, 0], SE: [1, 1], NE: [-1, 1],
  W: [0, -1], N: [-1, 0], NW: [-1, -1], SW: [1, -1]
};

export const WORDSEARCH_LEVELS = {
  easy: { size: 10, count: 8, dirs: ["E", "S"] },
  medium: { size: 11, count: 11, dirs: ["E", "S", "SE", "NE", "W"] },
  hard: { size: 12, count: 14, dirs: ["E", "S", "SE", "NE", "W", "N", "NW", "SW"] }
};

// Lettres de remplissage : fréquence proche du français / anglais pour que ça ait l'air naturel
const FILL = {
  fr: "EEEEEEAAAAASSSSIIIIINNNNTTTTRRRRUUUULLLOOOODDDCCCPPMMMVGFBHQJXYZK",
  en: "EEEEEEETTTTTAAAAOOOOIIIINNNNSSSSHHHRRRRDDDLLLCCUUMMWFGYPBVKJXQZ"
};

// Compte combien de fois « key » peut se lire dans la grille (8 directions)
export function countOccurrences(grid, key) {
  const size = grid.length;
  let count = 0;
  const dirs = Object.values(DIRECTIONS);
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (grid[r][c] !== key[0]) continue;
      for (const [dr, dc] of dirs) {
        let ok = true;
        for (let i = 1; i < key.length; i += 1) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size || grid[rr][cc] !== key[i]) { ok = false; break; }
        }
        if (ok) count += 1;
      }
    }
  }
  // Un palindrome se lit deux fois au même endroit : on ne le compte qu'une fois
  const palindrome = key === [...key].reverse().join("");
  return palindrome ? count / 2 : count;
}

// Choisit des mots du thème : bonne longueur, et aucun mot contenu dans un autre
function pickWords(words, cfg, rng) {
  const list = shuffled(
    words
      .map((w) => ({ word: w, key: normalizeWord(w) }))
      .filter((w) => w.key.length >= 3 && w.key.length <= cfg.size),
    rng
  );
  const chosen = [];
  for (const w of list) {
    if (chosen.length >= cfg.count) break;
    const clash = chosen.some((o) => o.key.includes(w.key) || w.key.includes(o.key) ||
      o.key.includes([...w.key].reverse().join("")));
    if (!clash) chosen.push(w);
  }
  return chosen;
}

/**
 * Génère une grille de mots cachés.
 * @param {string[]} words mots du thème (accents permis)
 * @param {"easy"|"medium"|"hard"} level
 * @param {{rng?:Function, lang?:"fr"|"en"}} options
 * @returns {{size:number, grid:string[], words:{word,key,row,col,dr,dc,len}[]}}
 */
export function generateWordSearch(words, level = "medium", options = {}) {
  const cfg = WORDSEARCH_LEVELS[level] || WORDSEARCH_LEVELS.medium;
  const rng = options.rng || Math.random;
  const fill = FILL[options.lang] || FILL.fr;
  const { size } = cfg;
  let fallback = null;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    // Les plus longs d'abord : ils sont les plus difficiles à caser
    const chosen = pickWords(words, cfg, rng).sort((a, b) => b.key.length - a.key.length);
    const grid = Array.from({ length: size }, () => Array(size).fill(""));
    const placed = [];

    for (const w of chosen) {
      const options2 = [];
      for (const d of cfg.dirs) {
        const [dr, dc] = DIRECTIONS[d];
        for (let r = 0; r < size; r += 1) {
          for (let c = 0; c < size; c += 1) {
            const endR = r + dr * (w.key.length - 1);
            const endC = c + dc * (w.key.length - 1);
            if (endR < 0 || endC < 0 || endR >= size || endC >= size) continue;
            let overlap = 0;
            let ok = true;
            for (let i = 0; i < w.key.length; i += 1) {
              const cell = grid[r + dr * i][c + dc * i];
              if (cell && cell !== w.key[i]) { ok = false; break; }
              if (cell) overlap += 1;
            }
            if (ok && overlap < w.key.length) options2.push({ r, c, dr, dc, overlap });
          }
        }
      }
      if (!options2.length) continue;
      // Un peu de chevauchement rend la grille plus serrée, mais on garde du hasard
      const withOverlap = options2.filter((o) => o.overlap > 0);
      const pickFrom = withOverlap.length && rng() < 0.45 ? withOverlap : options2;
      const o = pickFrom[Math.floor(rng() * pickFrom.length)];
      for (let i = 0; i < w.key.length; i += 1) grid[o.r + o.dr * i][o.c + o.dc * i] = w.key[i];
      placed.push({ word: w.word, key: w.key, row: o.r, col: o.c, dr: o.dr, dc: o.dc, len: w.key.length });
    }

    if (placed.length < Math.min(cfg.count, chosen.length)) continue;

    // Remplissage des cases vides ; on refait le remplissage si un mot apparaît en double
    for (let tryFill = 0; tryFill < 8; tryFill += 1) {
      const full = grid.map((row) => row.map((ch) => ch || fill[Math.floor(rng() * fill.length)]));
      const unique = placed.every((p) => countOccurrences(full, p.key) === 1);
      const result = {
        size,
        level,
        grid: full.map((row) => row.join("")),
        words: placed.sort((a, b) => a.word.localeCompare(b.word))
      };
      if (unique) return result;
      fallback = fallback || result;
    }
  }
  return fallback;
}

// Cases [r,c] d'une ligne partant de (r,c) dans la direction (dr,dc) sur len cases
export function lineCells(r, c, dr, dc, len) {
  return Array.from({ length: len }, (_, i) => [r + dr * i, c + dc * i]);
}

// Aligne une sélection du doigt sur l'une des 8 directions et la garde dans la grille
export function snapLine(r0, c0, r1, c1, size) {
  const dRow = r1 - r0;
  const dCol = c1 - c0;
  if (dRow === 0 && dCol === 0) return { row: r0, col: c0, dr: 0, dc: 0, len: 1 };
  const angle = Math.atan2(dRow, dCol);
  const octant = Math.round(angle / (Math.PI / 4));
  const dr = Math.round(Math.sin((octant * Math.PI) / 4));
  const dc = Math.round(Math.cos((octant * Math.PI) / 4));
  let len = Math.max(Math.abs(dRow), Math.abs(dCol)) + 1;
  // Raccourcit la ligne si elle sortirait de la grille
  while (len > 1) {
    const er = r0 + dr * (len - 1);
    const ec = c0 + dc * (len - 1);
    if (er >= 0 && ec >= 0 && er < size && ec < size) break;
    len -= 1;
  }
  return { row: r0, col: c0, dr, dc, len };
}

// Vérifie si une sélection correspond à un mot non trouvé (dans un sens ou dans l'autre)
export function matchSelection(puzzle, sel, foundIds) {
  if (!sel || sel.len < 2) return -1;
  const text = lineCells(sel.row, sel.col, sel.dr, sel.dc, sel.len)
    .map(([r, c]) => puzzle.grid[r][c])
    .join("");
  const reversed = [...text].reverse().join("");
  return puzzle.words.findIndex((w, i) => !foundIds.includes(i) && (w.key === text || w.key === reversed));
}
