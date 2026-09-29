// Liste des jeux jouables en réseau (plusieurs téléphones)
import poker from "./poker.js";
import cards from "./cards.js";
import dice from "./dice.js";
import connect4 from "./connect4.js";

export const NET_GAMES = [poker, cards, dice, connect4];

export const netGame = (id) => NET_GAMES.find((g) => g.id === id) || null;
