import {
  newNaval,
  fireNaval,
  navalView,
} from "../../games/additions/navalRules.js";
export default {
  id: "naval",
  emoji: "🚢",
  name: { fr: "Bataille navale", en: "Battleship" },
  desc: {
    fr: "Deux grilles privées, un tir par tour",
    en: "Two private grids, one shot per turn",
  },
  min: 2,
  max: 2,
  defaultOpts: {},
  setup({ seats }) {
    return newNaval(seats.slice(0, 2));
  },
  apply(s, pid, a) {
    const seat = s.seats.indexOf(pid);
    return seat >= 0 && a?.type === "fire" ? fireNaval(s, seat, a.cell) : null;
  },
  view(s, pid, { names }) {
    return {
      ...navalView(s, s.seats.indexOf(pid)),
      names: s.seats.map((id) => names[id] || "?"),
    };
  },
};
