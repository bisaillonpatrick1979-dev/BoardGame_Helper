// Tapis de jeu : dessine les cartes aux positions calculées par layouts.js,
// gère le toucher (tap) et le glisser-déposer au pointeur.
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RED_SUITS, rankLabel } from "../../cards/deck.js";
import { SuitIcon } from "../../cards/PlayingCard.jsx";
import { useLang } from "../../lib/core.js";
import { isUp, rankKey, suitOf } from "./engines/cards.js";
import { dropCandidates, layoutFor } from "./layouts.js";

// Petite enseigne vectorielle (réutilise les formes de PlayingCard)
export function Suit({ suit, className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <SuitIcon suit={suit} x={50} y={50} size={100} />
    </svg>
  );
}

// Face d'une carte : gros index lisible même à 34 px de large
function Face({ v, lang }) {
  const suit = suitOf(v);
  const rank = rankKey(v);
  const court = rank === "J" || rank === "Q" || rank === "K";
  const label = rankLabel(rank, lang);
  return (
    <div className={`sol-face ${RED_SUITS.includes(suit) ? "sol-red" : "sol-black"} ${court ? "sol-court" : ""}`}>
      <span className={`sol-rank ${label.length > 1 ? "sol-rank10" : ""}`}>{label}</span>
      <Suit suit={suit} className="sol-suit-s" />
      <div className="sol-center">
        {court && <span className="sol-court-letter">{label}</span>}
        <Suit suit={suit} className="sol-suit-big" />
      </div>
    </div>
  );
}

// Carte positionnée (mémorisée : seules les cartes qui changent sont redessinées)
export const SolCard = memo(function SolCard({ v, x, y, z, w, h, pile, index, cls = "", lang, dragging }) {
  const up = isUp(v);
  const transform = dragging
    ? `translate3d(calc(${x}px + var(--sol-dx, 0px)), calc(${y}px + var(--sol-dy, 0px)), 0)`
    : `translate3d(${x}px, ${y}px, 0)`;
  return (
    <div
      className={`sol-card ${up ? "sol-up" : "sol-down"} ${cls}`}
      data-pile={pile}
      data-index={index}
      style={{ width: w, height: h, zIndex: z, transform, "--cw": `${w}px` }}
    >
      {up ? <Face key="f" v={v} lang={lang} /> : <div key="b" className="sol-back" />}
    </div>
  );
});

const SLOT_ICON = { foundation: "A", tableau: "", cell: "", recycle: "↻", empty: "", done: "✓" };

export default function Board({ state, selection, highlight, shakeId, onTap, onDrop, canDrag, overlay, children }) {
  const { lang } = useLang();
  const boxRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(null);
  const drag = useRef(null);
  // Cartes qui viennent de bouger : passent au-dessus des autres pendant l'animation
  const prevPos = useRef(new Map());
  const liftUntil = useRef(new Map());

  // Mesure de la zone disponible (ResizeObserver)
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.w - r.width) > 0.5 || Math.abs(s.h - r.height) > 0.5 ? { w: r.width, h: r.height } : s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = size.w > 0 ? layoutFor(state, size.w, size.h) : null;

  // Après l'animation, un rendu de plus remet les cartes « soulevées » à leur niveau normal
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setTick((n) => n + 1), 360);
    return () => clearTimeout(id);
  }, [state]);

  // ---------- Pointeur : toucher ou glisser ----------
  function targetOf(e) {
    const el = e.target.closest && e.target.closest("[data-pile]");
    if (!el) return { pile: null, index: -1 };
    return { pile: el.dataset.pile, index: Number(el.dataset.index) };
  }

  function resetVars() {
    const el = boxRef.current;
    if (el) {
      el.style.removeProperty("--sol-dx");
      el.style.removeProperty("--sol-dy");
    }
  }

  function onPointerDown(e) {
    if (e.button > 0 || drag.current) return;
    // Les boutons du panneau de fin gardent leur clic normal (pas de capture du pointeur)
    if (e.target.closest && e.target.closest(".sol-overlay")) return;
    const { pile, index } = targetOf(e);
    drag.current = {
      pile,
      index,
      x0: e.clientX,
      y0: e.clientY,
      id: e.pointerId,
      active: false,
      can: pile != null && index >= 0 && canDrag(pile, index)
    };
    try {
      boxRef.current.setPointerCapture(e.pointerId);
    } catch {
      // Capture non disponible : le glisser fonctionne quand même dans la zone
    }
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !d.can) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.active && Math.hypot(dx, dy) > 9) {
      d.active = true;
      setDragging({ pile: d.pile, index: d.index });
    }
    if (d.active) {
      d.dx = dx;
      d.dy = dy;
      boxRef.current.style.setProperty("--sol-dx", `${dx}px`);
      boxRef.current.style.setProperty("--sol-dy", `${dy}px`);
    }
  }

  function onPointerUp(e) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.active) {
      const c = L && L.cards.find((cc) => cc.pile === d.pile && cc.index === d.index);
      const cands = c ? dropCandidates(L, c.x + d.dx, c.y + d.dy).filter((p) => p !== d.pile) : [];
      resetVars();
      setDragging(null);
      onDrop({ pile: d.pile, index: d.index }, cands);
    } else {
      onTap(d.pile, d.index);
    }
  }

  function onPointerCancel() {
    drag.current = null;
    resetVars();
    setDragging(null);
  }

  // ---------- Rendu ----------
  const now = Date.now();
  const hlCards = highlight ? highlight.cards : null;
  const hlPiles = highlight ? highlight.piles : null;
  const cards = [];
  if (L) {
    L.cards.forEach((c) => {
      const prev = prevPos.current.get(c.id);
      if (prev && (Math.abs(prev.x - c.x) > 1 || Math.abs(prev.y - c.y) > 1) && !(dragging && c.pile === dragging.pile)) {
        liftUntil.current.set(c.id, now + 320);
      }
      prevPos.current.set(c.id, { x: c.x, y: c.y });
      const isDragged = dragging && c.pile === dragging.pile && c.index >= dragging.index;
      const isSel = selection && c.pile === selection.pile && c.index >= selection.index;
      const lifted = (liftUntil.current.get(c.id) || 0) > now;
      let z = c.z;
      if (isDragged) z = 2000 + c.index;
      else if (lifted) z = 1000 + c.z;
      const cls = [
        isDragged ? "sol-dragging" : "",
        isSel ? "sol-sel" : "",
        hlCards && hlCards.includes(c.id) ? "sol-hint" : "",
        c.dim ? "sol-dim" : "",
        c.hideCenter ? "sol-covered" : "",
        shakeId === c.id ? "sol-shake" : ""
      ]
        .filter(Boolean)
        .join(" ");
      cards.push(
        <SolCard
          key={c.id}
          v={c.v}
          x={c.x}
          y={c.y}
          z={z}
          w={L.w}
          h={L.h}
          pile={c.pile}
          index={c.index}
          cls={cls}
          lang={lang}
          dragging={isDragged}
        />
      );
    });
  }

  return (
    <div
      ref={boxRef}
      className={`sol-board ${dragging ? "sol-board-dragging" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {L &&
        L.slots
          .filter((s) => s.kind !== "none")
          .map((s) => (
            <div
              key={`slot-${s.pile}`}
              className={`sol-slot sol-slot-${s.kind} ${hlPiles && hlPiles.includes(s.pile) ? "sol-hint" : ""}`}
              data-pile={s.pile}
              data-index={-1}
              style={{ width: L.w, height: L.h, transform: `translate3d(${s.x}px, ${s.y}px, 0)`, "--cw": `${L.w}px` }}
            >
              {SLOT_ICON[s.kind]}
            </div>
          ))}
      {cards}
      {L &&
        L.badges.map((b, i) => (
          <span key={`b${i}`} className={`sol-badge ${b.plain ? "sol-badge-plain" : ""}`} style={{ left: b.x, top: b.y }}>
            {b.text}
          </span>
        ))}
      {overlay}
      {children}
    </div>
  );
}
