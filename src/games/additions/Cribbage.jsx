import { useEffect, useState } from "react";
import { useLang, useStored, recordGame } from "../../lib/core.js";
import { shuffledDeck, cardName } from "../../cards/deck.js";
import PlayingCard from "../../cards/PlayingCard.jsx";
import { pipValue } from "./rules.js";
import { cribbageDeal, cribbageAction } from "./cribbageRules.js";
import { GameFrame } from "./shared.jsx";
export default function Cribbage() {
  const { t, lang } = useLang();
  const [g, setG] = useStored("bgh2_cribbage", () =>
    cribbageDeal(shuffledDeck()),
  );
  const [selected, setSelected] = useState([]);
  const names = [t("Toi", "You"), t("Ordinateur", "Computer")];
  const total = g.sequence.reduce((s, c) => s + pipValue(c), 0);
  function action(player, a) {
    const next = cribbageAction(g, player, a);
    if (!next) return;
    if (next.winner !== null)
      recordGame(
        "cribbage",
        next.winner === 0 ? "win" : "loss",
        next.scores[0],
      );
    setG(next);
  }
  useEffect(() => {
    if (g.phase !== "peg" || g.turn !== 1 || g.winner !== null) return;
    const timer = setTimeout(() => {
      const i = g.hands[1].findIndex((c) => total + pipValue(c) <= 31);
      action(1, i >= 0 ? { type: "play", index: i } : { type: "go" });
    }, 600);
    return () => clearTimeout(timer);
  }, [g]);
  return (
    <GameFrame
      title="Cribbage"
      onNew={() => {
        setG(cribbageDeal(shuffledDeck()));
        setSelected([]);
      }}
      rules={t(
        "Contre l’ordinateur, première personne à 121 points. Choisis deux cartes pour le crib du donneur. Pendant le jeu, pose une carte sans dépasser 31 : 15 ou 31 = 2 points; paires, triples, quadruples et suites marquent aussi. Dis « Go » si aucune carte ne passe. Ensuite, on compte la main du non-donneur, celle du donneur, puis son crib. Le donneur alterne à chaque manche.",
        "Against the computer, first to 121. Discard two cards to the dealer’s crib. During pegging, play without exceeding 31: 15 or 31 scores 2; pairs, triples, quads and runs also score. Say Go when no card fits. Then count the non-dealer’s hand, dealer’s hand and crib. Dealer alternates each round.",
      )}
    >
      <div className="scoreStrip">
        {g.scores.map((v, i) => (
          <span key={i}>
            {names[i]}: <b>{v}/121</b> {g.dealer === i ? "🂠" : ""}
          </span>
        ))}
      </div>
      <p role="status">
        {g.winner !== null
          ? `${t("Gagnant", "Winner")}: ${names[g.winner]}`
          : g.phase === "discard"
            ? t("Choisis 2 cartes pour le crib", "Choose 2 cards for the crib")
            : g.phase === "peg"
              ? `${t("Tour de", "Turn:")} ${names[g.turn]} · ${total}/31`
              : t("Compte des mains", "Counting hands")}
      </p>
      {g.phase !== "discard" && (
        <div className="cardCenter">
          <span>{t("Carte de départ", "Starter")}</span>
          <PlayingCard card={g.starter} width={64} />
        </div>
      )}
      {g.phase === "peg" && (
        <div className="cardHand">
          {g.sequence.map((c) => (
            <PlayingCard key={c.id} card={c} width={48} />
          ))}
        </div>
      )}
      <div className="cardHand">
        {g.hands[0].map((c, i) => (
          <button
            key={c.id}
            aria-label={cardName(c, lang)}
            aria-pressed={selected.includes(i)}
            className={selected.includes(i) ? "selected" : ""}
            disabled={
              g.winner !== null ||
              (g.phase === "peg" &&
                (g.turn !== 0 || total + pipValue(c) > 31)) ||
              !["peg", "discard"].includes(g.phase)
            }
            onClick={() =>
              g.phase === "discard"
                ? setSelected((v) =>
                    v.includes(i)
                      ? v.filter((k) => k !== i)
                      : v.length < 2
                        ? [...v, i]
                        : v,
                  )
                : action(0, { type: "play", index: i })
            }
          >
            <PlayingCard card={c} width={64} />
          </button>
        ))}
      </div>
      {g.phase === "discard" && (
        <button
          className="bigAction"
          disabled={selected.length !== 2}
          onClick={() => {
            action(0, { type: "discard", indices: selected });
            setSelected([]);
          }}
        >
          {t("Mettre au crib", "Discard to crib")}
        </button>
      )}
      {g.phase === "peg" && (
        <button
          className="chipButton"
          disabled={
            g.turn !== 0 || g.hands[0].some((c) => total + pipValue(c) <= 31)
          }
          onClick={() => action(0, { type: "go" })}
        >
          Go
        </button>
      )}
      {g.notice && (
        <p>
          {names[g.notice.player]}: +{g.notice.points ?? g.notice.total} (
          {g.notice.kind === "crib"
            ? "crib"
            : g.notice.kind === "hand"
              ? t("main", "hand")
              : g.notice.kind === "last"
                ? t("dernière carte", "last card")
                : g.notice.kind === "heels"
                  ? t("valet de départ", "starter jack")
                  : g.notice.kind}
          )
          {g.notice.total !== undefined && (
            <>
              <br />
              {t("Quinze", "Fifteens")}: {g.notice.fifteens} ·{" "}
              {t("Paires", "Pairs")}: {g.notice.pairs} · {t("Suites", "Runs")}:{" "}
              {g.notice.runs} · {t("Couleur", "Flush")}: {g.notice.flush} ·
              Nobs: {g.notice.nobs}
            </>
          )}
        </p>
      )}
      {g.phase === "count" && (
        <>
          <div className="cardHand">
            {(g.countIndex === 2
              ? g.crib
              : g.original[g.countIndex === 0 ? 1 - g.dealer : g.dealer]
            ).map((c) => (
              <PlayingCard key={c.id} card={c} width={60} />
            ))}
          </div>
          <button
            className="bigAction"
            onClick={() => action(0, { type: "count" })}
          >
            {g.countIndex === 2
              ? t("Compter le crib", "Count crib")
              : `${t("Compter la main de", "Count hand for")} ${names[g.countIndex === 0 ? 1 - g.dealer : g.dealer]}`}
          </button>
        </>
      )}
      {g.phase === "round" && (
        <button
          className="bigAction"
          onClick={() =>
            setG(cribbageDeal(shuffledDeck(), 1 - g.dealer, g.scores))
          }
        >
          {t("Manche suivante", "Next round")}
        </button>
      )}
    </GameFrame>
  );
}
