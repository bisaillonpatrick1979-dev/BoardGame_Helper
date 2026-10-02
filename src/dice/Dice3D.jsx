// Composant React qui affiche le plateau de dés 3D
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { DiceEngine } from "./DiceEngine.js";
import { DICE_PALETTES } from "./diceGeometry.js";
import { isHexColor } from "./customDice.js";

import SimpleDice from "./SimpleDice.jsx";
import { useStored } from "../lib/core.js";

const PhysicsDice3D = forwardRef(function PhysicsDice3D(
  {
    sides = 6,
    count = 1,
    paletteId = "ivory",
    customPalette = null,
    felt = "#16325c",
    sound = true,
    compact = false,
    className = "",
    onRollStart,
    onResult,
    hint,
    canRoll,
    canHold,
    initialDice,
    onUnavailable,
  },
  ref,
) {
  const hostRef = useRef(null);
  const engineRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const firstDice = useRef(initialDice);
  const resetting = useRef(false);
  const [rolling, setRolling] = useState(false);
  const [webglError, setWebglError] = useState(false);

  // Garde les callbacks à jour sans recréer le moteur
  const callbacks = useRef({ onRollStart, onResult, canRoll, canHold });
  callbacks.current = { onRollStart, onResult, canRoll, canHold };

  useEffect(() => {
    let engine;
    try {
      firstDice.current = initialDice;
      engine = new DiceEngine(hostRef.current, {
        felt,
        sound,
        onRollStart: () => {
          setRolling(true);
          callbacks.current.onRollStart?.();
        },
        onResult: (result) => {
          if (resetting.current) return;
          if (!result.silent) setRolling(false);
          callbacks.current.onResult?.(result);
        },
        onLabels: setLabels,
        // Permet à un jeu (ex. Yam's) de bloquer les lancers ou les dés gardés
        canRoll: () =>
          callbacks.current.canRoll ? callbacks.current.canRoll() : true,
        canHold: () =>
          callbacks.current.canHold ? callbacks.current.canHold() : true,
      });
    } catch (error) {
      console.warn("3D unavailable; using static dice", error);
      setWebglError(true);
      onUnavailable?.();
      return undefined;
    }
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetDice = () => {
    // Dé personnalisé (faces texte/couleur) ou couleur standard
    const palette =
      customPalette ||
      DICE_PALETTES.find((p) => p.id === paletteId) ||
      DICE_PALETTES[0];
    resetting.current = true;
    engineRef.current?.setDice(sides, count, palette);
    if (firstDice.current?.values?.length === count)
      engineRef.current?.restoreDice(firstDice.current);
    firstDice.current = null;
    resetting.current = false;
    engineRef.current?.emitResult(true);
    setRolling(false);
  };

  useEffect(() => {
    resetDice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sides, count, paletteId, customPalette?.id]);

  useEffect(() => {
    engineRef.current?.setFelt(felt);
  }, [felt]);

  useEffect(() => {
    engineRef.current?.setSound(sound);
  }, [sound]);

  useImperativeHandle(ref, () => ({
    roll: () => engineRef.current?.roll(),
    releaseAll: () => engineRef.current?.releaseAll(),
    reset: resetDice,
  }));

  if (webglError) {
    return (
      <div className="diceTray diceTrayError">
        3D non disponible sur cet appareil.
      </div>
    );
  }

  return (
    <div
      className={`diceTray ${compact ? "diceTrayCompact" : ""} ${className}`}
    >
      <div ref={hostRef} className="diceTrayCanvas" />
      {!rolling &&
        labels.map((label, index) => (
          <span
            key={`${index}-${label.value}`}
            className={`diceLabel ${label.held ? "diceLabelHeld" : ""}`}
            style={{ left: `${label.x}px`, top: `${label.y}px` }}
          >
            {customPalette?.labels ? (
              isHexColor(customPalette.labels[label.value - 1]) ? (
                <b className="colorBadge">
                  <i
                    style={{
                      background: customPalette.labels[label.value - 1],
                    }}
                  />
                </b>
              ) : (
                <b>{customPalette.labels[label.value - 1]}</b>
              )
            ) : (
              <b>{label.value}</b>
            )}
          </span>
        ))}
      {hint && <div className="diceTrayHint">{hint}</div>}
    </div>
  );
});

const Dice3D = forwardRef(function Dice3D(props, ref) {
  const [reduced] = useStored("bgh2_reduced_motion", false);
  const [unavailable, setUnavailable] = useState(false);
  const snapshot = useRef(props.initialDice);
  const Component = reduced || unavailable ? SimpleDice : PhysicsDice3D;
  return (
    <Component
      {...props}
      ref={ref}
      initialDice={snapshot.current}
      onUnavailable={() => setUnavailable(true)}
      onResult={(result) => {
        snapshot.current = result;
        props.onResult?.(result);
      }}
    />
  );
});
export default Dice3D;
