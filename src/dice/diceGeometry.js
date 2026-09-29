// Géométrie des dés : vrais polyèdres (D4, D6, D8, D10, D12, D20)
// avec arêtes arrondies (chanfrein lissé) et textures dessinées sur canvas.
import * as THREE from "three";

const PHI = (1 + Math.sqrt(5)) / 2;
const INSET = 0.14; // largeur du chanfrein (fraction de la face)
const TEX_SIZE = 256;

// ---------- Outils vectoriels ----------
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function signs2(fn) {
  const out = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) out.push(...fn(a, b));
  return out;
}

function cubeCorners() {
  const out = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) out.push(v3(a, b, c));
  return out;
}

// Trie les sommets d'une face dans le sens antihoraire vu de l'extérieur
function sortFace(indices, verts) {
  const c = new THREE.Vector3();
  indices.forEach((i) => c.add(verts[i]));
  c.divideScalar(indices.length);
  const n = c.clone().normalize();
  const e1 = verts[indices[0]].clone().sub(c).normalize();
  const e2 = new THREE.Vector3().crossVectors(n, e1);
  return [...indices].sort((a, b) => {
    const pa = verts[a].clone().sub(c);
    const pb = verts[b].clone().sub(c);
    return Math.atan2(pa.dot(e2), pa.dot(e1)) - Math.atan2(pb.dot(e2), pb.dot(e1));
  });
}

// Sélectionne les sommets les plus alignés avec chaque normale (faces d'un solide platonicien)
function facesFromNormals(verts, normals, perFace) {
  return normals.map((n) => {
    const picked = verts
      .map((v, i) => ({ i, d: v.dot(n) }))
      .sort((a, b) => b.d - a.d)
      .slice(0, perFace)
      .map((s) => s.i);
    return sortFace(picked, verts);
  });
}

// Numérote les faces : les faces opposées totalisent N + 1 (comme un vrai dé)
function assignOpposite(normals) {
  const values = new Array(normals.length).fill(0);
  let next = 1;
  const N = normals.length;
  normals.forEach((n, i) => {
    if (values[i]) return;
    let best = -1;
    let bestDot = 2;
    normals.forEach((m, j) => {
      if (j === i || values[j]) return;
      const d = n.dot(m);
      if (d < bestDot) {
        bestDot = d;
        best = j;
      }
    });
    values[i] = next;
    if (best >= 0) values[best] = N + 1 - next;
    next += 1;
  });
  return values;
}

function faceNormal(face, verts) {
  const a = verts[face[0]];
  const b = verts[face[1]];
  const c = verts[face[2]];
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
  const centroid = new THREE.Vector3();
  face.forEach((i) => centroid.add(verts[i]));
  if (n.dot(centroid) < 0) n.negate();
  return n;
}

// ---------- Définitions des dés ----------
function buildDefinition(sides) {
  let verts;
  let faces;
  let mode = "face"; // "face" : on lit la face du dessus ; "vertex" : la pointe du dessus (D4)

  if (sides === 4) {
    verts = [v3(1, 1, 1), v3(1, -1, -1), v3(-1, 1, -1), v3(-1, -1, 1)];
    faces = facesFromNormals(verts, verts.map((v) => v.clone().negate().normalize()), 3);
    mode = "vertex";
  } else if (sides === 6) {
    verts = cubeCorners();
    const normals = [v3(1, 0, 0), v3(-1, 0, 0), v3(0, 1, 0), v3(0, -1, 0), v3(0, 0, 1), v3(0, 0, -1)];
    faces = facesFromNormals(verts, normals, 4);
  } else if (sides === 8) {
    verts = [v3(1, 0, 0), v3(-1, 0, 0), v3(0, 1, 0), v3(0, -1, 0), v3(0, 0, 1), v3(0, 0, -1)];
    faces = facesFromNormals(verts, cubeCorners().map((v) => v.normalize()), 3);
  } else if (sides === 10) {
    // Trapézoèdre pentagonal : deux pôles + deux anneaux décalés de 36°
    const h = 1.05;
    const c36 = Math.cos(Math.PI / 5);
    const e = (h * (1 - c36)) / (1 + c36); // hauteur des anneaux pour des faces planes
    verts = [v3(0, h, 0), v3(0, -h, 0)];
    for (let k = 0; k < 5; k += 1) {
      const a = (2 * Math.PI * k) / 5;
      verts.push(v3(Math.cos(a), e, Math.sin(a)));
    }
    for (let k = 0; k < 5; k += 1) {
      const a = (2 * Math.PI * k) / 5 + Math.PI / 5;
      verts.push(v3(Math.cos(a), -e, Math.sin(a)));
    }
    const U = (k) => 2 + (k % 5);
    const L = (k) => 7 + (k % 5);
    faces = [];
    for (let k = 0; k < 5; k += 1) faces.push(sortFace([0, U(k), L(k), U(k + 1)], verts));
    for (let k = 0; k < 5; k += 1) faces.push(sortFace([1, L(k), U(k + 1), L(k + 1)], verts));
    // Le pôle en premier : le chiffre pointera vers la pointe
    faces = faces.map((f) => {
      const p = f.findIndex((i) => i === 0 || i === 1);
      return [...f.slice(p), ...f.slice(0, p)];
    });
  } else if (sides === 12) {
    verts = cubeCorners();
    signs2((a, b) => [v3(0, a / PHI, b * PHI), v3(a / PHI, b * PHI, 0), v3(a * PHI, 0, b / PHI)]).forEach((v) => verts.push(v));
    const normals = signs2((a, b) => [v3(0, a * PHI, b), v3(a * PHI, b, 0), v3(a, 0, b * PHI)]).map((v) => v.normalize());
    faces = facesFromNormals(verts, normals, 5);
  } else {
    verts = signs2((a, b) => [v3(0, a, b * PHI), v3(a, b * PHI, 0), v3(a * PHI, 0, b)]);
    const normals = cubeCorners();
    signs2((a, b) => [v3(0, a * PHI, b / PHI), v3(a * PHI, b / PHI, 0), v3(a / PHI, 0, b * PHI)]).forEach((v) => normals.push(v));
    faces = facesFromNormals(verts, normals.map((v) => v.normalize()), 3);
  }

  // Normalise pour un rayon maximal de 1
  const maxR = Math.max(...verts.map((v) => v.length()));
  verts = verts.map((v) => v.clone().divideScalar(maxR));

  const normals = faces.map((f) => faceNormal(f, verts));
  const faceValues = mode === "face" ? assignOpposite(normals) : null;
  const vertexValues = mode === "vertex" ? [1, 2, 3, 4] : null;

  return { sides, verts, faces, normals, faceValues, vertexValues, mode };
}

const definitionCache = new Map();
export function getDefinition(sides) {
  if (!definitionCache.has(sides)) definitionCache.set(sides, buildDefinition(sides));
  return definitionCache.get(sides);
}

// Taille visuelle par type (rayon en unités de scène)
export const DIE_RADIUS = { 4: 1.45, 6: 1.3, 8: 1.3, 10: 1.25, 12: 1.3, 20: 1.35 };

// ---------- Repère 2D d'une face (pour la texture) ----------
function faceFrame(face, verts, normal) {
  const c = new THREE.Vector3();
  face.forEach((i) => c.add(verts[i]));
  c.divideScalar(face.length);
  const up = verts[face[0]].clone().sub(c).normalize();
  const right = new THREE.Vector3().crossVectors(up, normal);
  const rMax = Math.max(...face.map((i) => verts[i].distanceTo(c)));
  const k = (TEX_SIZE * 0.49) / rMax;
  // Projette un point 3D dans les coordonnées du canvas
  const toCanvas = (p) => {
    const d = p.clone().sub(c);
    return { x: TEX_SIZE / 2 + d.dot(right) * k, y: TEX_SIZE / 2 - d.dot(up) * k };
  };
  return { c, toCanvas };
}

// ---------- Textures ----------
const textureCache = new Map();

function drawNumber(ctx, text, x, y, size, angle, ink, underline) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `900 ${size}px "Arial Black", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Effet gravé : ombre claire en bas, sombre en haut
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillText(text, 0, size * 0.04 + 1.5);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillText(text, 0, -1.5);
  ctx.fillStyle = ink;
  ctx.fillText(text, 0, 0);
  if (underline) {
    ctx.fillRect(-size * 0.22, size * 0.42, size * 0.44, Math.max(3, size * 0.07));
  }
  ctx.restore();
}

function drawPip(ctx, x, y, r, ink) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.55, ink);
  g.addColorStop(1, ink);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  // Petit reflet sur le bord inférieur (trou percé)
  ctx.beginPath();
  ctx.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

const PIP_LAYOUT = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.25], [0.27, 0.5], [0.27, 0.75], [0.73, 0.25], [0.73, 0.5], [0.73, 0.75]]
};

// Texte d'une face personnalisée : taille ajustée à la longueur, sur 1 ou 2 lignes
function drawLabel(ctx, text, x, y, maxW, baseSize, angle, ink) {
  const words = text.split(/\s+/);
  const lines = text.length > 7 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [text];
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(baseSize, (maxW / Math.max(1, longest)) * 1.6, lines.length > 1 ? baseSize * 0.62 : baseSize);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `900 ${size}px "Arial Black", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    const ly = (i - (lines.length - 1) / 2) * size * 1.05;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillText(line, 0, ly - 1.5);
    ctx.fillStyle = ink;
    ctx.fillText(line, 0, ly);
  });
  ctx.restore();
}

const isHexColor = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim());

function makeFaceTexture(def, faceIndex, palette) {
  const key = `${def.sides}-${faceIndex}-${palette.id}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement("canvas");
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext("2d");
  const face = def.faces[faceIndex];
  const { toCanvas } = faceFrame(face, def.verts, def.normals[faceIndex]);
  const pts = face.map((i) => toCanvas(def.verts[i]));
  const cx = TEX_SIZE / 2;
  const cy = TEX_SIZE / 2;

  // Fond : couleur du dé + léger dégradé pour donner du relief
  ctx.fillStyle = palette.body;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  const shade = ctx.createRadialGradient(cx * 0.8, cy * 0.7, 10, cx, cy, TEX_SIZE * 0.6);
  shade.addColorStop(0, "rgba(255,255,255,0.10)");
  shade.addColorStop(1, "rgba(0,0,0,0.10)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  if (palette.speckle) {
    // Effet marbré / pailleté
    for (let i = 0; i < 260; i += 1) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.arc(Math.random() * TEX_SIZE, Math.random() * TEX_SIZE, Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (palette.labels) {
    // Dé personnalisé : texte ou couleur sur chaque face
    if (def.mode === "vertex") {
      face.forEach((vi, j) => {
        const q = pts[j];
        const label = palette.labels[def.vertexValues[vi] - 1] || "";
        const x = cx + (q.x - cx) * 0.56;
        const y = cy + (q.y - cy) * 0.56;
        const angle = Math.atan2(q.x - cx, -(q.y - cy));
        if (isHexColor(label)) {
          ctx.beginPath();
          ctx.arc(x, y, TEX_SIZE * 0.09, 0, Math.PI * 2);
          ctx.fillStyle = label;
          ctx.fill();
        } else drawLabel(ctx, label, x, y, TEX_SIZE * 0.3, TEX_SIZE * 0.17, angle, palette.ink);
      });
    } else {
      const label = palette.labels[def.faceValues[faceIndex] - 1] || "";
      if (isHexColor(label)) {
        // Face entièrement colorée, avec un petit reflet
        ctx.fillStyle = label;
        ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
        const gloss = ctx.createRadialGradient(cx * 0.7, cy * 0.6, 4, cx, cy, TEX_SIZE * 0.55);
        gloss.addColorStop(0, "rgba(255,255,255,0.28)");
        gloss.addColorStop(1, "rgba(0,0,0,0.12)");
        ctx.fillStyle = gloss;
        ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
      } else {
        const widthBySides = { 4: 0.5, 6: 0.62, 8: 0.42, 10: 0.4, 12: 0.5, 20: 0.36 };
        const offsetY = def.sides === 10 ? TEX_SIZE * 0.06 : def.sides === 8 || def.sides === 20 ? TEX_SIZE * 0.04 : 0;
        drawLabel(ctx, label, cx, cy + offsetY, TEX_SIZE * (widthBySides[def.sides] || 0.45), TEX_SIZE * (def.sides >= 20 ? 0.26 : 0.34), 0, palette.ink);
      }
    }
  } else if (def.sides === 6) {
    const value = def.faceValues[faceIndex];
    const [p0, p1, , p3] = pts;
    const at = (s, t) => ({
      x: p0.x + (p1.x - p0.x) * s + (p3.x - p0.x) * t,
      y: p0.y + (p1.y - p0.y) * s + (p3.y - p0.y) * t
    });
    const side = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    PIP_LAYOUT[value].forEach(([s, t]) => {
      const p = at(s, t);
      const pipInk = value === 1 && palette.redOne ? "#c1121f" : palette.ink;
      drawPip(ctx, p.x, p.y, side * (value === 1 ? 0.13 : 0.085), pipInk);
    });
  } else if (def.mode === "vertex") {
    // D4 : trois chiffres, chacun près de sa pointe
    face.forEach((vi, j) => {
      const q = pts[j];
      const x = cx + (q.x - cx) * 0.56;
      const y = cy + (q.y - cy) * 0.56;
      const angle = Math.atan2(q.x - cx, -(q.y - cy));
      drawNumber(ctx, String(def.vertexValues[vi]), x, y, TEX_SIZE * 0.2, angle, palette.ink, false);
    });
  } else {
    const value = def.faceValues[faceIndex];
    const sizeBySides = { 8: 0.34, 10: 0.3, 12: 0.34, 20: 0.27 };
    const size = TEX_SIZE * (sizeBySides[def.sides] || 0.3) * (value >= 10 ? 0.92 : 1);
    // D10 : le chiffre est décalé vers le centre visuel du cerf-volant
    const offsetY = def.sides === 10 ? TEX_SIZE * 0.06 : def.sides === 8 || def.sides === 20 ? TEX_SIZE * 0.03 : 0;
    const underline = (value === 6 || value === 9) && def.sides >= 8;
    drawNumber(ctx, String(value), cx, cy + offsetY, size, 0, palette.ink, underline);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}

// ---------- Maillage 3D avec arêtes arrondies ----------
const geometryCache = new Map();

export function getDieGeometry(sides, radius) {
  const key = `${sides}-${radius.toFixed(3)}`;
  if (geometryCache.has(key)) return geometryCache.get(key);

  const def = getDefinition(sides);
  const verts = def.verts.map((v) => v.clone().multiplyScalar(radius));
  const positions = [];
  const normalsOut = [];
  const uvs = [];
  const geometry = new THREE.BufferGeometry();

  const push = (p, n, uv) => {
    positions.push(p.x, p.y, p.z);
    normalsOut.push(n.x, n.y, n.z);
    uvs.push(uv ? uv.x : 0, uv ? uv.y : 0);
  };

  // Ajoute un triangle en s'assurant qu'il est orienté vers l'extérieur
  const addTri = (a, b, c, hint) => {
    const cross = new THREE.Vector3().subVectors(b.p, a.p).cross(new THREE.Vector3().subVectors(c.p, a.p));
    const list = cross.dot(hint) >= 0 ? [a, b, c] : [a, c, b];
    list.forEach((x) => push(x.p, x.n, x.uv));
  };

  // Points en retrait de chaque face (le chanfrein relie ces points)
  const inset = def.faces.map((face, fi) => {
    const n = def.normals[fi];
    const { c, toCanvas } = faceFrame(face, verts, n);
    return face.map((vi) => {
      const p = verts[vi].clone().lerp(c, INSET);
      const q = toCanvas(p);
      return { vi, p, n, uv: new THREE.Vector2(q.x / TEX_SIZE, 1 - q.y / TEX_SIZE) };
    });
  });

  // 1) Faces (une texture par face)
  let start = 0;
  inset.forEach((pts, fi) => {
    for (let i = 1; i < pts.length - 1; i += 1) addTri(pts[0], pts[i], pts[i + 1], def.normals[fi]);
    const count = (pts.length - 2) * 3;
    geometry.addGroup(start, count, fi);
    start += count;
  });

  const bodyStart = start;

  // 2) Bandes d'arêtes : normales interpolées entre deux faces = arête arrondie
  const edges = new Map();
  inset.forEach((pts, fi) => {
    pts.forEach((pt, j) => {
      const next = pts[(j + 1) % pts.length];
      const key2 = pt.vi < next.vi ? `${pt.vi}_${next.vi}` : `${next.vi}_${pt.vi}`;
      if (!edges.has(key2)) edges.set(key2, []);
      edges.get(key2).push({ fi, a: pt, b: next });
    });
  });
  edges.forEach((list) => {
    if (list.length !== 2) return;
    const [f, g] = list;
    const aG = g.a.vi === f.a.vi ? g.a : g.b;
    const bG = g.a.vi === f.a.vi ? g.b : g.a;
    const hint = def.normals[f.fi].clone().add(def.normals[g.fi]);
    addTri(f.a, f.b, bG, hint);
    addTri(f.a, bG, aG, hint);
  });

  // 3) Coins : petit polygone arrondi autour de chaque sommet
  verts.forEach((v, vi) => {
    const around = [];
    inset.forEach((pts) => pts.forEach((pt) => pt.vi === vi && around.push(pt)));
    if (around.length < 3) return;
    const dir = v.clone().normalize();
    const e1 = around[0].p.clone().sub(v).projectOnPlane(dir).normalize();
    const e2 = new THREE.Vector3().crossVectors(dir, e1);
    around.sort((a, b) => {
      const da = a.p.clone().sub(v);
      const db = b.p.clone().sub(v);
      return Math.atan2(da.dot(e2), da.dot(e1)) - Math.atan2(db.dot(e2), db.dot(e1));
    });
    for (let i = 1; i < around.length - 1; i += 1) addTri(around[0], around[i], around[i + 1], dir);
  });

  geometry.addGroup(bodyStart, positions.length / 3 - bodyStart, def.faces.length);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normalsOut, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();

  const result = { geometry, verts, def };
  geometryCache.set(key, result);
  return result;
}

// ---------- Matériaux ----------
const materialCache = new Map();

export function getDieMaterials(sides, palette) {
  const key = `${sides}-${palette.id}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const def = getDefinition(sides);
  const common = {
    roughness: palette.roughness ?? 0.32,
    metalness: palette.metalness ?? 0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12
  };
  const list = def.faces.map((_, fi) => new THREE.MeshPhysicalMaterial({ ...common, map: makeFaceTexture(def, fi, palette) }));
  list.push(new THREE.MeshPhysicalMaterial({ ...common, color: new THREE.Color(palette.body) }));
  materialCache.set(key, list);
  return list;
}

// Palettes de couleurs proposées
export const DICE_PALETTES = [
  { id: "ivory", fr: "Ivoire", en: "Ivory", body: "#f3ede2", ink: "#17171c", redOne: true },
  { id: "ruby", fr: "Rubis", en: "Ruby", body: "#a8112b", ink: "#fff4e0", speckle: true },
  { id: "sapphire", fr: "Saphir", en: "Sapphire", body: "#1a44c2", ink: "#ffffff", speckle: true },
  { id: "emerald", fr: "Émeraude", en: "Emerald", body: "#0d7148", ink: "#fbf5dc", speckle: true },
  { id: "onyx", fr: "Onyx", en: "Onyx", body: "#1a1a1f", ink: "#f2c14e" },
  { id: "amethyst", fr: "Améthyste", en: "Amethyst", body: "#5b21b6", ink: "#fde68a", speckle: true },
  { id: "gold", fr: "Or", en: "Gold", body: "#c9971c", ink: "#241400", metalness: 0.55, roughness: 0.28 }
];
