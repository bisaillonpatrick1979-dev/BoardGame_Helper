// Joueurs à la table : ajouter les amis présents, renommer, couleur.
// Cette liste est utilisée partout (jeux, scores, banque, compteurs, ordre de jeu…)
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useLang } from "../lib/core.js";

export const PLAYER_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];
export const MAX_PLAYERS = 8;

export const playerColor = (player, index) => player?.color || PLAYER_COLORS[index % PLAYER_COLORS.length];

// Nom d'un joueur par sa position (avec un nom par défaut si la liste est trop courte)
export function seatName(players, index, t) {
  return players?.[index]?.name || `${t("Joueur", "Player")} ${index + 1}`;
}

export function PlayerChips({ players, onOpen }) {
  const { t } = useLang();
  return (
    <button className="playerChips" onClick={onOpen} aria-label={t("Joueurs", "Players")}>
      {players.slice(0, 6).map((p, i) => (
        <span key={p.id} className="chipAvatar" style={{ background: playerColor(p, i) }}>
          {(p.name || "?").slice(0, 1).toUpperCase()}
        </span>
      ))}
      {players.length > 6 && <span className="chipAvatar more">+{players.length - 6}</span>}
      <span className="chipAdd">
        <Plus size={16} />
      </span>
    </button>
  );
}

export default function PlayersSheet({ players, setPlayers, onClose }) {
  const { t } = useLang();
  const [name, setName] = useState("");

  function add(e) {
    e?.preventDefault();
    if (players.length >= MAX_PLAYERS) return;
    const clean = name.trim() || `${t("Joueur", "Player")} ${players.length + 1}`;
    const used = players.map((p) => p.color);
    const color = PLAYER_COLORS.find((c) => !used.includes(c)) || PLAYER_COLORS[players.length % PLAYER_COLORS.length];
    setPlayers([...players, { id: Date.now(), name: clean, score: 0, money: 1500, color }]);
    setName("");
  }

  const update = (id, patch) => setPlayers(players.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  function move(index, dir) {
    const next = [...players];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setPlayers(next);
  }

  return (
    <div className="sheetBackdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheetHeader">
          <h2>
            {t("Joueurs à la table", "Players at the table")} ({players.length})
          </h2>
          <button className="iconButton" onClick={onClose} aria-label={t("Fermer", "Close")}>
            <X size={22} />
          </button>
        </div>
        <p className="muted">
          {t(
            "Ajoute tes amis qui jouent avec toi. Leurs noms servent dans les jeux, les scores, la banque, les compteurs et l'ordre de jeu.",
            "Add the friends playing with you. Their names are used in games, scores, bank, counters and turn order."
          )}
        </p>

        <div className="editList">
          {players.map((p, i) => (
            <div className="playerEditRow" key={p.id}>
              <span className="chipAvatar big" style={{ background: playerColor(p, i) }}>
                {(p.name || "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="playerEditMain">
                <input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} aria-label={t("Nom", "Name")} />
                <div className="colorDots">
                  {PLAYER_COLORS.map((c) => (
                    <i key={c} className={playerColor(p, i) === c ? "active" : ""} style={{ background: c }} onClick={() => update(p.id, { color: c })} />
                  ))}
                </div>
              </div>
              <div className="playerEditBtns">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("Monter", "Up")}>
                  <ArrowUp size={15} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === players.length - 1} aria-label={t("Descendre", "Down")}>
                  <ArrowDown size={15} />
                </button>
                <button onClick={() => setPlayers(players.filter((x) => x.id !== p.id))} disabled={players.length <= 1} aria-label={t("Retirer", "Remove")}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {players.length < MAX_PLAYERS && (
          <form className="addRow" onSubmit={add}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Nom de l'ami(e)", "Friend's name")} />
            <button className="iconButton accentBg" type="submit" aria-label={t("Ajouter", "Add")}>
              <Plus size={20} />
            </button>
          </form>
        )}
        <button className="bigAction" onClick={onClose}>
          {t("C'est bon!", "Done!")}
        </button>
      </div>
    </div>
  );
}
