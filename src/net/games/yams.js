import {
  YAMS_CATEGORIES,
  yamsScore,
  yamsTotal,
} from "../../games/additions/rules.js";
export default {
  id: "yams",
  emoji: "🎲",
  name: { fr: "Yam’s", en: "Yahtzee" },
  desc: {
    fr: "Chacun sa feuille, dés et scores partagés",
    en: "Your own sheet, shared dice and scores",
  },
  min: 1,
  max: 6,
  defaultOpts: {},
  setup({ seats }) {
    return {
      seats: seats.slice(0, 6),
      sheets: seats.slice(0, 6).map(() => ({})),
      turn: 0,
      dice: [],
      held: [false, false, false, false, false],
      rolls: 3,
      done: false,
    };
  },
  apply(s, pid, a) {
    if (s.done || s.seats[s.turn] !== pid) return null;
    if (
      a?.type === "hold" &&
      s.dice.length &&
      s.rolls > 0 &&
      Number.isInteger(a.index) &&
      a.index >= 0 &&
      a.index < 5
    )
      return { ...s, held: s.held.map((v, i) => (i === a.index ? !v : v)) };
    if (a?.type === "roll" && s.rolls > 0 && !s.held.every(Boolean)) {
      const buf = new Uint32Array(1);
      const die = () => {
        do {
          crypto.getRandomValues(buf);
        } while (buf[0] >= 4294967292);
        return (buf[0] % 6) + 1;
      };
      return {
        ...s,
        dice: Array.from({ length: 5 }, (_, i) =>
          s.held[i] ? s.dice[i] : die(),
        ),
        rolls: s.rolls - 1,
      };
    }
    if (
      a?.type === "score" &&
      s.dice.length &&
      YAMS_CATEGORIES.includes(a.category) &&
      s.sheets[s.turn][a.category] === undefined
    ) {
      const sheets = s.sheets.map((v, i) =>
        i === s.turn
          ? { ...v, [a.category]: yamsScore(a.category, s.dice) }
          : v,
      );
      return {
        ...s,
        sheets,
        turn: (s.turn + 1) % s.seats.length,
        dice: [],
        held: [false, false, false, false, false],
        rolls: 3,
        done: sheets.every((v) => Object.keys(v).length === 13),
      };
    }
    return null;
  },
  view(s, pid, { names }) {
    return {
      ...s,
      mySeat: s.seats.indexOf(pid),
      names: s.seats.map((id) => names[id] || "?"),
      totals: s.sheets.map(yamsTotal),
    };
  },
};
