// Sablier : le sable coule vraiment, et on peut le retourner en pleine partie
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCw } from "lucide-react";
import { sfx, useLang, useStored, vibrate } from "../lib/core.js";

const PRESETS = [30, 60, 90, 120, 180, 300];

export default function Hourglass() {
  const { t } = useLang();
  const [duration, setDuration] = useStored("bgh2_hourglass", 60);
  const [elapsed, setElapsed] = useState(0); // secondes de sable tombées en bas
  const [running, setRunning] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const startRef = useRef({ at: 0, from: 0 });

  const remaining = Math.max(0, duration - elapsed);
  const topFrac = Math.min(1, Math.max(0, remaining / duration));
  const botFrac = 1 - topFrac;

  useEffect(() => {
    if (!running) return undefined;
    startRef.current = { at: performance.now(), from: elapsed };
    let raf;
    let lastTick = Math.ceil(remaining);
    const tick = (now) => {
      const e = Math.max(0, Math.min(duration, startRef.current.from + (now - startRef.current.at) / 1000));
      setElapsed(e);
      const left = Math.ceil(duration - e);
      if (left !== lastTick) {
        lastTick = left;
        if (left <= 5 && left > 0) sfx.tap();
      }
      if (e >= duration) {
        setRunning(false);
        sfx.win();
        vibrate([300, 120, 300, 120, 300]);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, duration]);

  // Retourner : le sable du bas devient celui du haut
  function flip() {
    if (flipping) return;
    setFlipping(true);
    sfx.flip();
    const wasRunning = running;
    setRunning(false);
    setTimeout(() => {
      setElapsed((e) => Math.max(0, duration - e));
      setFlipping(false);
      setRunning(wasRunning || elapsed >= duration || elapsed === 0);
    }, 550);
  }

  function choose(s) {
    setDuration(s);
    setElapsed(0);
    setRunning(false);
  }

  const mm = Math.floor(Math.ceil(remaining) / 60);
  const ss = String(Math.ceil(remaining) % 60).padStart(2, "0");
  // Hauteurs du sable dans chaque bulbe (en unités du dessin)
  const topH = 118 * Math.sqrt(topFrac);
  const botH = 118 * Math.sqrt(botFrac);

  return (
    <div className="tool hourglassTool">
      <div className="hourglassStage" onClick={flip}>
        <svg viewBox="0 0 200 330" className={`hourglass ${flipping ? "flipping" : ""} ${remaining === 0 ? "done" : ""}`}>
          <defs>
            <clipPath id="glassInside">
              <path d="M38 28 C38 110 96 140 96 165 C96 190 38 220 38 302 L162 302 C162 220 104 190 104 165 C104 140 162 110 162 28 Z" />
            </clipPath>
            <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fcd34d" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="0.3" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="1" stopColor="rgba(255,255,255,0.18)" />
            </linearGradient>
          </defs>
          {/* Bois haut et bas */}
          <rect x="18" y="8" width="164" height="20" rx="6" className="wood" />
          <rect x="18" y="302" width="164" height="20" rx="6" className="wood" />
          <rect x="24" y="28" width="8" height="274" rx="3" className="wood pillar" />
          <rect x="168" y="28" width="8" height="274" rx="3" className="wood pillar" />
          {/* Sable */}
          <g clipPath="url(#glassInside)">
            <rect x="30" y={160 - topH} width="140" height={topH + 5} fill="url(#sand)" />
            <path d={`M30 302 L30 ${302 - botH * 0.7} Q100 ${302 - botH * 1.25} 170 ${302 - botH * 0.7} L170 302 Z`} fill="url(#sand)" />
            {running && topFrac > 0 && <rect x="98.5" y="158" width="3" height={302 - 158 - botH * 0.9} fill="#fbbf24" className="stream" />}
          </g>
          {/* Verre */}
          <path
            d="M38 28 C38 110 96 140 96 165 C96 190 38 220 38 302 L162 302 C162 220 104 190 104 165 C104 140 162 110 162 28 Z"
            fill="url(#glass)"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="3"
          />
        </svg>
        <div className="hourglassTime">
          <strong>
            {mm}:{ss}
          </strong>
          <small>{remaining === 0 ? t("Temps écoulé! Touche pour retourner", "Time's up! Tap to flip") : t("Touche le sablier pour le retourner", "Tap the hourglass to flip it")}</small>
        </div>
      </div>

      <div className="presetRow">
        {PRESETS.map((s) => (
          <button key={s} className={duration === s ? "active" : ""} onClick={() => choose(s)}>
            {s < 60 ? `${s}s` : s % 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : `${s / 60} min`}
          </button>
        ))}
      </div>

      <div className="actionRow">
        <button className="bigAction secondary" onClick={flip}>
          <RotateCw size={20} />
          {t("Retourner", "Flip")}
        </button>
        <button
          className="bigAction"
          onClick={() => {
            if (remaining === 0) setElapsed(0);
            setRunning(!running);
            sfx.tap();
          }}
        >
          {running ? <Pause size={22} /> : <Play size={22} />}
          {running ? t("Pause", "Pause") : t("Démarrer", "Start")}
        </button>
      </div>
    </div>
  );
}
