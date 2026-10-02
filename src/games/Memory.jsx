// Memory : retrouve les paires de cartes, seul ou à deux
import { useEffect, useRef, useState } from "react";
import { RotateCcw, User, Users } from "lucide-react";
import PlayingCard from "../cards/PlayingCard.jsx";
import { RANKS, SUITS } from "../cards/deck.js";
import {
  sfx,
  shuffle,
  useLang,
  useStored,
  vibrate,
  recordGame,
} from "../lib/core.js";
import { Confetti } from "./Hangman.jsx";
import { seatName } from "../screens/PlayersSheet.jsx";

const SIZES = { 8: [4, 4], 10: [4, 5], 12: [4, 6] };

function newBoard(pairs) {
  const picked = shuffle(
    RANKS.flatMap((rank) => SUITS.map((suit) => ({ rank, suit }))),
  ).slice(0, pairs);
  return shuffle(
    picked.flatMap((c, i) => [
      { ...c, id: `${i}a`, pair: i },
      { ...c, id: `${i}b`, pair: i },
    ]),
  );
}

export default function Memory({ players }) {
  const { t } = useLang();
  const [pairs, setPairs] = useStored("bgh2_mem_pairs", 8);
  const [twoPlayers, setTwoPlayers] = useStored("bgh2_mem_twoPlayers", false);
  const [cards, setCards] = useStored("bgh2_mem_cards", () => newBoard(pairs));
  const [open, setOpen] = useStored("bgh2_mem_open", []);
  const [found, setFound] = useStored("bgh2_mem_found", {}); // pair -> joueur (1 ou 2)
  const [moves, setMoves] = useStored("bgh2_mem_moves", 0);
  const [player, setPlayer] = useStored("bgh2_mem_player", 1);
  const [seconds, setSeconds] = useStored("bgh2_mem_seconds", 0);
  const [best, setBest] = useStored("bgh2_mem_best", {});
  const lock = useRef(false);
  const done = Object.keys(found).length === pairs;
  const started = moves > 0 || open.length > 0;

  useEffect(() => {
    if (!started || done) return undefined;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, done]);

  function restart(p = pairs) {
    setCards(newBoard(p));
    setOpen([]);
    setFound({});
    setMoves(0);
    setPlayer(1);
    setSeconds(0);
    lock.current = false;
  }

  function flip(card) {
    if (
      lock.current ||
      open.includes(card.id) ||
      found[card.pair] !== undefined
    )
      return;
    sfx.flip();
    const next = [...open, card.id];
    setOpen(next);
  }

  useEffect(() => {
    if (open.length !== 2) {
      lock.current = false;
      return;
    }
    lock.current = true;
    const [a, b] = open.map((id) => cards.find((c) => c.id === id));
    if (!a || !b) {
      setOpen([]);
      return;
    }
    const timer = setTimeout(
      () => {
        setMoves((m) => m + 1);
        if (a.pair === b.pair) {
          const nextFound = { ...found, [a.pair]: player };
          setFound(nextFound);
          if (Object.keys(nextFound).length === pairs) {
            sfx.win();
            recordGame("memory", twoPlayers ? "played" : "win");
            if (!twoPlayers) {
              const key = String(pairs);
              if (!best[key] || moves + 1 < best[key])
                setBest({ ...best, [key]: moves + 1 });
            }
          } else sfx.good();
        } else if (twoPlayers) setPlayer((p) => (p === 1 ? 2 : 1));
        setOpen([]);
        lock.current = false;
      },
      a.pair === b.pair ? 450 : 900,
    );
    return () => clearTimeout(timer);
  }, [open, cards]);

  const [ncols, nrows] = SIZES[pairs];
  const p1 = Object.values(found).filter((p) => p === 1).length;
  const p2 = Object.values(found).filter((p) => p === 2).length;
  const mm = String(Math.floor(seconds / 60)).padStart(1, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="game memory">
      <div className="gameBar">
        <div className="segmented small">
          <button
            className={!twoPlayers ? "active" : ""}
            onClick={() => {
              setTwoPlayers(false);
              restart();
            }}
          >
            <User size={15} /> Solo
          </button>
          <button
            className={twoPlayers ? "active" : ""}
            onClick={() => {
              setTwoPlayers(true);
              restart();
            }}
          >
            <Users size={15} /> {t("2 joueurs", "2 players")}
          </button>
        </div>
        <div className="segmented small">
          {[8, 10, 12].map((p) => (
            <button
              key={p}
              className={pairs === p ? "active" : ""}
              onClick={() => {
                setPairs(p);
                restart(p);
              }}
            >
              {p * 2}
            </button>
          ))}
        </div>
      </div>

      <div className="scoreStrip">
        {twoPlayers ? (
          <>
            <span className={player === 1 && !done ? "turnOn p1" : "p1"}>
              {seatName(players, 0, t)} · {p1}
            </span>
            <span className={player === 2 && !done ? "turnOn p2" : "p2"}>
              {seatName(players, 1, t)} · {p2}
            </span>
          </>
        ) : (
          <>
            <span>
              {t("Coups", "Moves")} · {moves}
            </span>
            <span>
              ⏱ {mm}:{ss}
            </span>
            <span>🏆 {best[String(pairs)] || "—"}</span>
          </>
        )}
      </div>

      <div className="memWrap">
        <div
          className="memGrid"
          style={{
            gridTemplateColumns: `repeat(${ncols}, 1fr)`,
            "--ratio": (ncols * 5) / (nrows * 7.3),
          }}
        >
          {cards.map((card) => {
            const up = open.includes(card.id) || found[card.pair] !== undefined;
            return (
              <div
                key={card.id}
                className={`memCell ${found[card.pair] !== undefined ? "matched" : ""}`}
              >
                <PlayingCard
                  card={card}
                  faceUp={up}
                  width="100%"
                  onClick={() => flip(card)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {done && (
        <div className="resultBanner win">
          <strong>
            {twoPlayers
              ? p1 === p2
                ? t("Égalité!", "Tie!")
                : `${seatName(players, p1 > p2 ? 0 : 1, t)} ${t("gagne! 🎉", "wins! 🎉")}`
              : `${t("Bravo! 🎉", "Well done! 🎉")} ${moves} ${t("coups", "moves")}`}
          </strong>
        </div>
      )}
      <button className="bigAction" onClick={() => restart()}>
        <RotateCcw size={20} />
        {t("Nouvelle partie", "New game")}
      </button>
      {done && <Confetti />}
    </div>
  );
}
