import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { randomInt, useLang } from "../lib/core.js";
import { isHexColor } from "./customDice.js";
// Static dice for reduced motion and devices without WebGL.
const SimpleDice = forwardRef(function SimpleDice(
  {
    sides = 6,
    count = 1,
    initialDice,
    onRollStart,
    onResult,
    canRoll,
    canHold,
    customPalette,
    className = "",
    hint,
  },
  ref,
) {
  const { t } = useLang();
  const [state, setState] = useState(() => ({
    values:
      initialDice?.values?.length === count
        ? initialDice.values
        : Array(count).fill(1),
    held:
      initialDice?.held?.length === count
        ? initialDice.held
        : Array(count).fill(false),
  }));
  const latest = useRef(state);
  latest.current = state;
  const values =
    state.values.length === count ? state.values : Array(count).fill(1);
  const held =
    state.held.length === count ? state.held : Array(count).fill(false);
  function update(values, held, silent) {
    const next = { values, held };
    latest.current = next;
    setState(next);
    onResult?.({ ...next, silent, total: values.reduce((a, b) => a + b, 0) });
  }
  function roll() {
    if ((canRoll && !canRoll()) || held.every(Boolean)) return;
    onRollStart?.();
    update(
      values.map((v, i) => (held[i] ? v : 1 + randomInt(sides))),
      held,
      false,
    );
  }
  function hold(i) {
    if (canHold && !canHold()) return;
    update(
      values,
      held.map((v, k) => (k === i ? !v : v)),
      true,
    );
  }
  useImperativeHandle(ref, () => ({
    roll,
    releaseAll: () =>
      update(latest.current.values, Array(count).fill(false), true),
    reset: () => update(Array(count).fill(1), Array(count).fill(false), true),
  }));
  return (
    <div className={`simpleDice ${className}`}>
      <div className="diceButtons">
        {values.map((v, i) => {
          const label = customPalette?.labels?.[v - 1];
          return (
            <button
              key={i}
              aria-pressed={held[i]}
              aria-label={`${t("Dé", "Die")} ${i + 1}: ${label || v}`}
              className={held[i] ? "selected" : ""}
              onClick={() => hold(i)}
            >
              {label && isHexColor(label) ? (
                <span className="staticColor" style={{ background: label }} />
              ) : (
                label || v
              )}
              {held[i] ? " 🔒" : ""}
            </button>
          );
        })}
      </div>
      <button className="chipButton" onClick={roll}>
        {t("Lancer les dés", "Roll dice")}
      </button>
      {hint && <p>{hint}</p>}
    </div>
  );
});
export default SimpleDice;
