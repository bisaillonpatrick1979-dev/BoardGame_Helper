// Dés partagés : chacun lance sur son téléphone, tout le monde voit le résultat en direct.
// Le hasard est tiré par l'hôte (personne ne peut tricher sur son propre lancer).
const SIDES = [4, 6, 8, 10, 12, 20, 100];

function roll(sides) {
  // Hasard cryptographique, sans biais
  const limit = Math.floor(0x100000000 / sides) * sides;
  const buf = new Uint32Array(1);
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return (x % sides) + 1;
}

export default {
  id: "dice",
  emoji: "🎲",
  name: { fr: "Dés partagés", en: "Shared dice" },
  desc: { fr: "Tout le monde voit tous les lancers, impossible de tricher", en: "Everyone sees every roll, no cheating" },
  min: 1,
  max: 10,
  defaultOpts: {},

  setup({ seats }) {
    return { rolls: [], seats: [...seats], n: 0 };
  },

  apply(prev, pid, action, { names }) {
    if (!prev.seats.includes(pid) || action?.type !== "roll") return null;
    const dice = (Array.isArray(action.dice) ? action.dice : []).slice(0, 10).filter((s) => SIDES.includes(s));
    if (!dice.length) return null;
    const bonus = Math.max(-50, Math.min(50, Math.round(Number(action.bonus) || 0)));
    const values = dice.map((sides) => ({ sides, value: roll(sides) }));
    const total = values.reduce((s, d) => s + d.value, 0) + bonus;
    const entry = { n: prev.n + 1, pid, name: names[pid] || "?", dice: values, bonus, total, at: Date.now() };
    return { ...prev, n: prev.n + 1, rolls: [...prev.rolls, entry].slice(-20) };
  },

  view(gs) {
    return { rolls: gs.rolls };
  }
};

export { SIDES };
