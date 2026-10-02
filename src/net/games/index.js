// Liste des jeux jouables en réseau (plusieurs téléphones)
import poker from "./poker.js";
import cards from "./cards.js";
import dice from "./dice.js";
import connect4 from "./connect4.js";

import yams from "./yams.js";

import naval from "./naval.js";

export const NET_GAMES = [poker, cards, dice, connect4, yams, naval];

export const netGame = (id) => NET_GAMES.find((g) => g.id === id) || null;
