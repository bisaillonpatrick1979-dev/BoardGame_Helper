// Poker en réseau : Texas Hold'em ou Omaha, chaque joueur sur son téléphone.
// L'hôte fait tourner le moteur (engine.js) ; chacun ne reçoit que SES cartes.
import { act, botDecision, legalActions, startHand } from "../../games/poker/engine.js";

const BOT_NAMES = ["Lia", "Max", "Rosie", "Zack", "Nora", "Théo", "Mia"];

export default {
  id: "poker",
  emoji: "♠️",
  name: { fr: "Poker", en: "Poker" },
  desc: { fr: "Hold'em ou Omaha, tes cartes restent secrètes", en: "Hold'em or Omaha, your cards stay secret" },
  min: 1,
  max: 8,
  defaultOpts: { variant: "holdem", limit: "nl", bots: 0, chips: 1000 },

  // Nouvelle table : joueurs humains assis + ordinateurs pour compléter
  setup({ seats, names, opts }) {
    const bots = Math.max(seats.length < 2 ? 1 : 0, Math.min(opts.bots || 0, 8 - seats.length));
    const players = seats.map((id) => ({ id, name: names[id] || "?", chips: opts.chips || 1000, isBot: false }));
    for (let i = 0; i < bots; i += 1) {
      players.push({ id: `bot${i}`, name: `🤖 ${BOT_NAMES[i]}`, chips: opts.chips || 1000, isBot: true, style: [0.35, 0.55, 0.2, 0.45, 0.3, 0.4, 0.25][i] });
    }
    const table = {
      players,
      dealer: Math.floor(Math.random() * players.length),
      smallBlind: 10,
      bigBlind: 20,
      handNo: 0,
      stage: "idle",
      variant: opts.variant === "omaha" ? "omaha" : "holdem",
      limit: opts.limit === "pl" ? "pl" : "nl"
    };
    return startHand(table);
  },

  apply(gs, pid, action) {
    if (!action || typeof action !== "object") return null;
    // Main suivante (n'importe quel joueur assis, une fois la main terminée)
    if (action.type === "next") {
      if (gs.stage !== "done") return null;
      if (!gs.players.some((p) => p.id === pid)) return null;
      const withChips = gs.players.filter((p) => p.chips > 0);
      if (withChips.length < 2) return null;
      return startHand(gs);
    }
    if (gs.stage === "done" || gs.toAct < 0) return null;
    const actor = gs.players[gs.toAct];
    if (!actor || actor.id !== pid) return null; // pas ton tour
    if (!["fold", "check", "call", "raise"].includes(action.type)) return null;
    const legal = legalActions(gs);
    if (action.type === "check" && !legal.canCheck) return null;
    if (action.type === "raise") {
      const to = Math.round(Number(action.to));
      if (!Number.isFinite(to) || legal.maxRaiseTo <= gs.currentBet) return null;
      return act(gs, { type: "raise", to });
    }
    return act(gs, { type: action.type });
  },

  // Ordinateurs et joueurs déconnectés : l'hôte joue à leur place
  tick(gs, { online }) {
    if (gs.stage === "done" || gs.toAct < 0) return null;
    const p = gs.players[gs.toAct];
    if (p.isBot) return { delay: 850, pid: p.id, action: botDecision(gs) };
    if (!online.has(p.id)) {
      const legal = legalActions(gs);
      return { delay: 8000, pid: p.id, action: { type: legal.canCheck ? "check" : "fold" } };
    }
    return null;
  },

  // Vue personnelle : on cache le paquet et les cartes des autres (sauf à l'abattage)
  view(gs, pid) {
    const showdown = gs.stage === "done" && gs.winners?.some((w) => w.hand !== null && w.hand !== undefined);
    const players = gs.players.map((p) => {
      const visible = p.id === pid || (showdown && p.inHand && !p.folded);
      return {
        id: p.id,
        name: p.name,
        chips: p.chips,
        bet: p.bet,
        total: p.total,
        inHand: p.inHand,
        folded: p.folded,
        allIn: p.allIn,
        isBot: p.isBot,
        lastAction: p.lastAction,
        hole: visible ? p.hole : p.hole.map(() => null),
        best: visible ? p.best : null
      };
    });
    const me = gs.players.findIndex((p) => p.id === pid);
    return {
      players,
      me,
      dealer: gs.dealer,
      toAct: gs.toAct,
      stage: gs.stage,
      board: gs.board,
      currentBet: gs.currentBet,
      minRaise: gs.minRaise,
      smallBlind: gs.smallBlind,
      bigBlind: gs.bigBlind,
      handNo: gs.handNo,
      variant: gs.variant,
      limit: gs.limit,
      winners: gs.winners,
      legal: me >= 0 && gs.toAct === me && gs.stage !== "done" ? legalActions(gs) : null
    };
  }
};
