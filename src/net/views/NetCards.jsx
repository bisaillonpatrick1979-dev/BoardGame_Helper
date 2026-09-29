// Table de cartes libre en réseau : paquet et centre partagés, ma main sur mon téléphone
import { useMemo, useState } from "react";
import { Eye, EyeOff, Hand, Layers, Minus, Plus, RotateCcw, Send, Shuffle, X, ArrowUpDown } from "lucide-react";
import PlayingCard from "../../cards/PlayingCard.jsx";
import { DeckPile } from "../../screens/CardsScreen.jsx";
import { SUITS, RANKS } from "../../cards/deck.js";
import { sfx, useLang, vibrate } from "../../lib/core.js";

// Tri local de ma main (par couleur puis valeur)
function sortHand(cards) {
  const rankOf = (c) => (c.rank === "JOKER" ? 99 : RANKS.indexOf(c.rank));
  const suitOf = (c) => (c.rank === "JOKER" ? 9 : SUITS.indexOf(c.suit));
  return [...cards].sort((a, b) => suitOf(a) - suitOf(b) || rankOf(a) - rankOf(b));
}

export default function NetCards({ view, send, online }) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState([]);
  const [sorted, setSorted] = useState(false);
  const [menu, setMenu] = useState(null); // null | "deal" | "give" | "collect"
  const [dealN, setDealN] = useState(5);
  const onlineSet = new Set(online);

  const hand = view.myHand || [];
  const shown = useMemo(() => (sorted ? sortHand(hand) : hand), [hand, sorted]);
  const spectator = !view.myHand;
  // Sélection nettoyée si des cartes ont quitté ma main
  const sel = selected.filter((id) => hand.some((c) => c.id === id));

  const toggle = (id) => {
    sfx.tap();
    setSelected(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  };

  function act(action, sound = "deal") {
    send(action);
    sfx[sound]?.();
    vibrate(15);
  }

  // Largeur des cartes de ma main : se resserrent quand j'en ai beaucoup
  const cardW = hand.length > 13 ? 54 : 62;
  const overlap = hand.length <= 5 ? 0.15 : hand.length <= 10 ? 0.5 : 0.62;
  const last = view.log[view.log.length - 1];

  return (
    <div className="game netCards">
      <div className="nc-others">
        {view.others.map((o) => (
          <div key={o.id} className={`nc-other ${onlineSet.has(o.id) ? "" : "away"}`}>
            <strong>{o.name}</strong>
            <span>
              🂠 {o.count}
            </span>
            {o.cards && (
              <div className="nc-reveal">
                {o.cards.slice(0, 12).map((c) => (
                  <PlayingCard key={c.id} card={c} width={22} />
                ))}
              </div>
            )}
          </div>
        ))}
        {!view.others.length && <div className="muted">{t("Personne d'autre à la table", "Nobody else at the table")}</div>}
      </div>

      <div className="nc-felt">
        <div className="nc-deck">
          <DeckPile count={view.deckCount} width={62} onClick={() => !spectator && act({ type: "draw", n: 1 }, "flip")} />
          <small>
            {view.deckCount} · {t("touche pour piger", "tap to draw")}
          </small>
        </div>
        <div className="nc-table">
          {view.table.length ? (
            <div className="nc-pile">
              {view.table.map((c, k) => (
                <div key={c.id} className="nc-pileCard" style={{ transform: `translate(${(k - view.table.length + 1) * 14}px, ${((k * 37) % 7) - 3}px) rotate(${((k * 53) % 13) - 6}deg)` }}>
                  <PlayingCard card={c} width={62} />
                </div>
              ))}
            </div>
          ) : (
            <div className="nc-empty">{t("Centre", "Table")}</div>
          )}
          {!spectator && view.table.length > 0 && (
            <button className="chipButton nc-take" onClick={() => act({ type: "take" }, "flip")}>
              <Hand size={14} /> {t("Prendre", "Take")}
            </button>
          )}
          <small>{view.tableCount} {t("au centre", "on table")}</small>
        </div>
      </div>

      {last && (
        <div className="nc-log">
          <b>{last.name}</b> {lang === "fr" ? last.fr : last.en}
        </div>
      )}

      {spectator ? (
        <div className="pokerWaiting">{t("Tu regardes la partie (elle a commencé sans toi)", "You're watching (the game started without you)")}</div>
      ) : (
        <>
          <div className="nc-hand">
            {shown.map((c, k) => (
              <div key={c.id} className={`nc-handCard ${sel.includes(c.id) ? "up" : ""}`} style={{ marginLeft: k ? -cardW * overlap : 0, zIndex: k }}>
                <PlayingCard card={c} width={cardW} onClick={() => toggle(c.id)} selected={sel.includes(c.id)} />
              </div>
            ))}
            {!hand.length && <div className="muted nc-emptyHand">{t("Ta main est vide — pige ou distribue!", "Your hand is empty — draw or deal!")}</div>}
          </div>

          {menu === "deal" ? (
            <div className="nc-menu">
              <span>{t("Cartes à chacun", "Cards each")}</span>
              <div className="stepper small">
                <button onClick={() => setDealN(Math.max(1, dealN - 1))}>
                  <Minus size={16} />
                </button>
                <strong>{dealN}</strong>
                <button onClick={() => setDealN(Math.min(26, dealN + 1))}>
                  <Plus size={16} />
                </button>
              </div>
              <button className="bigAction compact" onClick={() => { act({ type: "deal", n: dealN }); setMenu(null); }}>
                {t("Distribuer", "Deal")}
              </button>
              <button className="iconButton" onClick={() => setMenu(null)} aria-label={t("Fermer", "Close")}>
                <X size={18} />
              </button>
            </div>
          ) : menu === "give" ? (
            <div className="nc-menu">
              <span>{t("Donner à", "Give to")}</span>
              {view.others.map((o) => (
                <button
                  key={o.id}
                  className="chipButton"
                  onClick={() => {
                    sel.forEach((id) => send({ type: "give", id, to: o.id }));
                    sfx.deal();
                    setSelected([]);
                    setMenu(null);
                  }}
                >
                  {o.name}
                </button>
              ))}
              <button className="iconButton" onClick={() => setMenu(null)} aria-label={t("Fermer", "Close")}>
                <X size={18} />
              </button>
            </div>
          ) : menu === "collect" ? (
            <div className="nc-menu">
              <span>{t("Ramasser TOUTES les cartes et mélanger?", "Collect ALL cards and shuffle?")}</span>
              <button className="bigAction compact dangerBg" onClick={() => { act({ type: "collect" }, "flip"); setMenu(null); setSelected([]); }}>
                {t("Oui", "Yes")}
              </button>
              <button className="iconButton" onClick={() => setMenu(null)} aria-label={t("Fermer", "Close")}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="nc-actions">
              {sel.length > 0 ? (
                <>
                  <button className="bigAction" onClick={() => { act({ type: "play", ids: sel }); setSelected([]); }}>
                    {t("Jouer", "Play")} {sel.length > 1 ? `(${sel.length})` : ""}
                  </button>
                  {view.others.length > 0 && (
                    <button className="bigAction secondary" onClick={() => setMenu("give")}>
                      <Send size={16} /> {t("Donner", "Give")}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="chipButton" onClick={() => setMenu("deal")}>
                    <Layers size={14} /> {t("Distribuer", "Deal")}
                  </button>
                  <button className="chipButton" onClick={() => setSorted(!sorted)}>
                    <ArrowUpDown size={14} /> {sorted ? t("Ordre reçu", "As dealt") : t("Trier", "Sort")}
                  </button>
                  <button className="chipButton" onClick={() => act({ type: "reveal", on: !view.revealedMine }, "tap")}>
                    {view.revealedMine ? <EyeOff size={14} /> : <Eye size={14} />} {view.revealedMine ? t("Cacher", "Hide") : t("Montrer", "Show")}
                  </button>
                  <button className="chipButton" onClick={() => act({ type: "clearTable" }, "tap")} disabled={!view.tableCount}>
                    <RotateCcw size={14} /> {t("Centre → paquet", "Table → deck")}
                  </button>
                  <button className="chipButton" onClick={() => setMenu("collect")}>
                    <Shuffle size={14} /> {t("Tout ramasser", "Collect all")}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
