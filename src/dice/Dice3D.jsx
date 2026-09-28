// Composant React qui affiche le plateau de dés 3D
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { DiceEngine } from "./DiceEngine.js";
import { DICE_PALETTES } from "./diceGeometry.js";

const Dice3D = forwardRef(function Dice3D(
  { sides = 6, count = 1, paletteId = "ivory", felt = "#16325c", sound = true, compact = false, onRollStart, onResult, hint },
  ref
) {
  const hostRef = useRef(null);
  const engineRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [webglError, setWebglError] = useState(false);

  // Garde les callbacks à jour sans recréer le moteur
  const callbacks = useRef({ onRollStart, onResult });
  callbacks.current = { onRollStart, onResult };

  useEffect(() => {
    let engine;
    try {
      engine = new DiceEngine(hostRef.current, {
        felt,
        sound,
        onRollStart: () => {
          setRolling(true);
          callbacks.current.onRollStart?.();
        },
        onResult: (result) => {
          if (!result.silent) setRolling(false);
          callbacks.current.onResult?.(result);
        },
        onLabels: setLabels
      });
    } catch (error) {
      console.error(error);
      setWebglError(true);
      return undefined;
    }
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const palette = DICE_PALETTES.find((p) => p.id === paletteId) || DICE_PALETTES[0];
    engineRef.current?.setDice(sides, count, palette);
    setRolling(false);
  }, [sides, count, paletteId]);

  useEffect(() => {
    engineRef.current?.setFelt(felt);
  }, [felt]);

  useEffect(() => {
    engineRef.current?.setSound(sound);
  }, [sound]);

  useImperativeHandle(ref, () => ({
    roll: () => engineRef.current?.roll(),
    releaseAll: () => engineRef.current?.releaseAll()
  }));

  if (webglError) {
    return <div className="diceTray diceTrayError">3D non disponible sur cet appareil.</div>;
  }

  return (
    <div className={`diceTray ${compact ? "diceTrayCompact" : ""}`}>
      <div ref={hostRef} className="diceTrayCanvas" />
      {!rolling &&
        labels.map((label, index) => (
          <span
            key={`${index}-${label.value}`}
            className={`diceLabel ${label.held ? "diceLabelHeld" : ""}`}
            style={{ left: `${label.x}px`, top: `${label.y}px` }}
          >
            <b>{label.value}</b>
          </span>
        ))}
      {hint && <div className="diceTrayHint">{hint}</div>}
    </div>
  );
});

export default Dice3D;
