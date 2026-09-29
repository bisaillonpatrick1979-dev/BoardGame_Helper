// Dés personnalisés : conversion vers un vrai dé 3D quand le nombre de faces le permet
const POLYHEDRA = [4, 6, 8, 10, 12, 20];

export const isHexColor = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim());

// Couleur de texte lisible sur la couleur du dé
export function inkFor(hex) {
  const n = parseInt((hex || "#ffffff").slice(1), 16);
  const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  return lum > 150 ? "#111827" : "#ffffff";
}

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

// Renvoie { sides, labels, palette } ou null si aucun polyèdre ne convient
// (ex. 2 faces → D6 avec chaque face répétée 3 fois)
export function to3D(die) {
  if (!die || !die.faces?.length) return null;
  const n = die.faces.length;
  const sides = POLYHEDRA.find((p) => p >= n && p % n === 0);
  if (!sides) return null;
  const labels = Array.from({ length: sides }, (_, i) => die.faces[i % n]);
  return {
    sides,
    labels,
    palette: {
      id: `custom-${die.id}-${hash(JSON.stringify([die.faces, die.color]))}`,
      body: die.color || "#f8fafc",
      ink: inkFor(die.color),
      labels,
      roughness: 0.35
    }
  };
}
