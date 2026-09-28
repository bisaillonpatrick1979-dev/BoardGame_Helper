// Carte à jouer réaliste dessinée en SVG (face + dos), avec retournement 3D
import { useId } from "react";
import { RED_SUITS, rankLabel } from "./deck.js";
import { useLang } from "../lib/core.js";

// Formes des enseignes (dessinées dans une boîte de 100 x 100)
const SUIT_PATHS = {
  hearts: "M50 90 C22 68 4 50 4 31 C4 15 16 5 29 5 C39 5 46 11 50 20 C54 11 61 5 71 5 C84 5 96 15 96 31 C96 50 78 68 50 90 Z",
  diamonds: "M50 3 Q68 28 90 50 Q68 72 50 97 Q32 72 10 50 Q32 28 50 3 Z",
  spades:
    "M50 4 C78 30 96 44 96 61 C96 75 86 84 73 84 C64 84 57 80 53 73 C54 83 58 90 66 96 L34 96 C42 90 46 83 47 73 C43 80 36 84 27 84 C14 84 4 75 4 61 C4 44 22 30 50 4 Z",
  clubs:
    "M50 6 C62 6 71 15 71 27 C71 33 69 37 66 41 C70 39 74 38 78 38 C89 38 97 47 97 58 C97 70 88 78 77 78 C67 78 60 73 54 65 C55 78 59 88 67 96 L33 96 C41 88 45 78 46 65 C40 73 33 78 23 78 C12 78 3 70 3 58 C3 47 11 38 22 38 C26 38 30 39 34 41 C31 37 29 33 29 27 C29 15 38 6 50 6 Z"
};

const RED = "#c8102e";
const BLACK = "#16161d";

export function SuitIcon({ suit, x, y, size, flip = false, color }) {
  const fill = color || (RED_SUITS.includes(suit) ? RED : BLACK);
  const s = size / 100;
  const transform = `translate(${x} ${y}) ${flip ? "rotate(180)" : ""} translate(${-size / 2} ${-size / 2}) scale(${s})`;
  return <path d={SUIT_PATHS[suit]} fill={fill} transform={transform} />;
}

// Positions des enseignes sur les cartes 2 à 10 (colonnes 78/125/172)
const L = 78;
const C = 125;
const R = 172;
const PIPS = {
  2: [[C, 78], [C, 272]],
  3: [[C, 78], [C, 175], [C, 272]],
  4: [[L, 78], [R, 78], [L, 272], [R, 272]],
  5: [[L, 78], [R, 78], [C, 175], [L, 272], [R, 272]],
  6: [[L, 78], [R, 78], [L, 175], [R, 175], [L, 272], [R, 272]],
  7: [[L, 78], [R, 78], [C, 126], [L, 175], [R, 175], [L, 272], [R, 272]],
  8: [[L, 78], [R, 78], [C, 126], [L, 175], [R, 175], [C, 224], [L, 272], [R, 272]],
  9: [[L, 78], [R, 78], [L, 143], [R, 143], [C, 175], [L, 207], [R, 207], [L, 272], [R, 272]],
  10: [[L, 78], [R, 78], [C, 110], [L, 143], [R, 143], [L, 207], [R, 207], [C, 240], [L, 272], [R, 272]]
};

// Petits ornements des figures (dessinés autour de 0,0)
function CourtIcon({ rank, color }) {
  if (rank === "K") {
    return (
      <g stroke="#5a3c00" strokeWidth="2" strokeLinejoin="round">
        <path d="M-32 14 L-32 -10 L-16 4 L0 -20 L16 4 L32 -10 L32 14 Z" fill="#e0b12a" />
        <rect x="-34" y="12" width="68" height="9" rx="2" fill={color} />
        {[-32, 0, 32].map((cx) => (
          <circle key={cx} cx={cx} cy={cx === 0 ? -22 : -12} r="4.5" fill="#fff4c2" />
        ))}
      </g>
    );
  }
  if (rank === "Q") {
    return (
      <g stroke="#5a3c00" strokeWidth="2" strokeLinejoin="round">
        <path d="M-30 16 Q-26 -14 0 -18 Q26 -14 30 16 Z" fill="#e0b12a" />
        <path d="M-22 16 Q0 -2 22 16" fill="none" stroke={color} strokeWidth="4" />
        <circle cx="0" cy="-20" r="6" fill={color} />
        <circle cx="-18" cy="-6" r="3.5" fill="#fff4c2" />
        <circle cx="18" cy="-6" r="3.5" fill="#fff4c2" />
      </g>
    );
  }
  return (
    <g stroke="#5a3c00" strokeWidth="2" strokeLinejoin="round">
      <path d="M-26 16 L-22 -4 Q0 -14 22 -4 L26 16 Z" fill={color} />
      <path d="M14 -6 C22 -30 40 -34 46 -28 C34 -24 28 -14 20 -2 Z" fill="#e0b12a" />
      <rect x="-28" y="12" width="56" height="8" rx="2" fill="#e0b12a" />
    </g>
  );
}

function CardFace({ card, lang, uid }) {
  const isJoker = card.rank === "JOKER";
  const red = isJoker ? card.suit === "red" : RED_SUITS.includes(card.suit);
  const ink = red ? RED : BLACK;
  const label = isJoker ? "" : rankLabel(card.rank, lang);
  const isCourt = ["J", "Q", "K"].includes(card.rank);
  const accent = red ? "#1f4fa8" : RED;

  const corner = (
    <g>
      {isJoker ? (
        <text x="24" y="40" fill={ink} fontSize="22" fontWeight="900" fontFamily="Georgia, serif" textAnchor="middle">
          <tspan x="24" dy="0">J</tspan>
          <tspan x="24" dy="22">O</tspan>
          <tspan x="24" dy="22">K</tspan>
          <tspan x="24" dy="22">E</tspan>
          <tspan x="24" dy="22">R</tspan>
        </text>
      ) : (
        <>
          <text
            x="26"
            y="46"
            fill={ink}
            fontSize={label === "10" ? 34 : 40}
            fontWeight="800"
            fontFamily="Georgia, 'Times New Roman', serif"
            textAnchor="middle"
            letterSpacing={label === "10" ? -3 : 0}
          >
            {label}
          </text>
          <SuitIcon suit={card.suit} x={26} y={70} size={26} />
        </>
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 250 350" className="pcardSvg" aria-hidden="true">
      <defs>
        <linearGradient id={`paper-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1ede4" />
        </linearGradient>
        <linearGradient id={`court-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8e6" />
          <stop offset="1" stopColor="#f5e6c4" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="247" height="347" rx="18" fill={`url(#paper-${uid})`} stroke="#cfc8b8" strokeWidth="3" />

      {corner}
      <g transform="rotate(180 125 175)">{corner}</g>

      {/* Cartes numérotées : enseignes à leur place réelle */}
      {PIPS[card.rank] &&
        PIPS[card.rank].map(([x, y], i) => <SuitIcon key={i} suit={card.suit} x={x} y={y} size={44} flip={y > 175} />)}

      {/* As : grande enseigne au centre */}
      {card.rank === "A" && (
        <g>
          {card.suit === "spades" && <circle cx="125" cy="175" r="72" fill="none" stroke={BLACK} strokeWidth="2" strokeDasharray="4 6" />}
          <SuitIcon suit={card.suit} x={125} y={175} size={card.suit === "spades" ? 118 : 96} />
        </g>
      )}

      {/* Figures : cadre, ornement et lettre, en miroir haut/bas */}
      {isCourt && (
        <g>
          <rect x="52" y="40" width="146" height="270" rx="10" fill={`url(#court-${uid})`} stroke={ink} strokeWidth="3" />
          <rect x="60" y="48" width="130" height="254" rx="6" fill="none" stroke={accent} strokeWidth="1.5" />
          {[0, 180].map((rot) => (
            <g key={rot} transform={`rotate(${rot} 125 175)`}>
              <g transform="translate(125 86)">
                <CourtIcon rank={card.rank} color={accent} />
              </g>
              <text x="125" y="160" fill={ink} fontSize="62" fontWeight="800" fontFamily="Georgia, serif" textAnchor="middle">
                {label}
              </text>
              <SuitIcon suit={card.suit} x={84} y={78} size={24} />
            </g>
          ))}
          <line x1="60" y1="175" x2="190" y2="175" stroke={accent} strokeWidth="2" />
          <circle cx="125" cy="175" r="7" fill={accent} />
        </g>
      )}

      {/* Joker */}
      {isJoker && (
        <g>
          <path
            d="M125 95 L142 150 L198 152 L153 185 L170 240 L125 207 L80 240 L97 185 L52 152 L108 150 Z"
            fill={red ? RED : BLACK}
            stroke="#e0b12a"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="125" cy="170" r="16" fill="#e0b12a" />
          <text x="125" y="290" fill={ink} fontSize="30" fontWeight="900" fontFamily="Georgia, serif" textAnchor="middle" letterSpacing="4">
            JOKER
          </text>
        </g>
      )}
    </svg>
  );
}

export function CardBack({ uid, color = "blue" }) {
  const palette = color === "red" ? ["#8e1b2b", "#5c0f1b", "#e7b95a"] : ["#1f3f8f", "#0f2257", "#e7b95a"];
  return (
    <svg viewBox="0 0 250 350" className="pcardSvg" aria-hidden="true">
      <defs>
        <pattern id={`lattice-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="18" height="18" fill={palette[0]} />
          <path d="M0 9 H18 M9 0 V18" stroke={palette[1]} strokeWidth="3" />
          <circle cx="9" cy="9" r="2" fill={palette[2]} opacity="0.55" />
        </pattern>
      </defs>
      <rect x="1.5" y="1.5" width="247" height="347" rx="18" fill="#fbf8f1" stroke="#cfc8b8" strokeWidth="3" />
      <rect x="14" y="14" width="222" height="322" rx="10" fill={`url(#lattice-${uid})`} />
      <rect x="22" y="22" width="206" height="306" rx="7" fill="none" stroke={palette[2]} strokeWidth="2" opacity="0.8" />
      <g transform="translate(125 175)">
        <ellipse rx="52" ry="64" fill={palette[1]} stroke={palette[2]} strokeWidth="3" />
        <rect x="-24" y="-24" width="48" height="48" rx="10" fill="#fbf8f1" transform="rotate(12)" />
        <g transform="rotate(12)" fill={palette[1]}>
          <circle cx="-11" cy="-11" r="5" />
          <circle cx="0" cy="0" r="5" fill={RED} />
          <circle cx="11" cy="11" r="5" />
        </g>
      </g>
    </svg>
  );
}

// Carte complète : face visible ou dos, avec retournement animé
export default function PlayingCard({ card, faceUp = true, width = 90, back = "blue", className = "", onClick, selected = false, style }) {
  const { lang } = useLang();
  const uid = useId().replace(/:/g, "");
  return (
    <div
      className={`pcard ${selected ? "pcardSelected" : ""} ${onClick ? "pcardClickable" : ""} ${className}`}
      style={{ width, ...style }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className={`pcardInner ${faceUp && card ? "" : "pcardDown"}`}>
        <div className="pcardFace pcardFront">{card && <CardFace card={card} lang={lang} uid={uid} />}</div>
        <div className="pcardFace pcardBack">
          <CardBack uid={uid} color={back} />
        </div>
      </div>
    </div>
  );
}
