// Écran des dés 3D : le plateau occupe l'écran, les réglages tiennent en bas
import { useRef, useState } from "react";
import { Dice5, Hand, History, Minus, Pencil, Plus, Sparkles, X } from "lucide-react";
import Dice3D from "../dice/Dice3D.jsx";
import { DICE_PALETTES } from "../dice/diceGeometry.js";
import { useLang, useStored } from "../lib/core.js";
import { feltFor } from "./SettingsSheet.jsx";
import { isHexColor, to3D } from "../dice/customDice.js";
import { defaultCustomDice } from "../tools/CustomDice.jsx";

const DICE_TYPES = [4, 6, 8, 10, 12, 20];

export default function DiceScreen({ theme, sound, onTool }) {
  const { t, lang } = useLang();
  const diceRef = useRef(null);
  const [sides, setSides] = useStored("bgh2_dice_sides", 6);
  const [count, setCount] = useStored("bgh2_dice_count", 2);
  const [color, setColor] = useStored("bgh2_dice_color", "ivory");
  const [rolling, setRolling] = useState(false);
  const [values, setValues] = useState([]);
  const [held, setHeld] = useState([]);
  const [history, setHistory] = useState([]);
  const [panel, setPanel] = useState(null); // "history" | "color" | "custom" | null
  const [customDice] = useStored("bgh2_custom_dice", () => defaultCustomDice(lang));
  const [customId, setCustomId] = useStored("bgh2_dice_custom_id", null);

  // Dé spécial choisi (faces texte/couleur en 3D)
  const customDie = customId ? customDice.find((d) => d.id === customId) : null;
  const custom = customDie ? to3D(customDie) : null;
  const effectiveSides = custom ? custom.sides : sides;
  const labelOf = (v) => (custom ? custom.labels[v - 1] : v);

  const total = values.reduce((sum, v) => sum + v, 0);
  const heldCount = held.filter(Boolean).length;

  function handleResult(result) {
    setValues(result.values);
    setHeld(result.held);
    if (result.silent) return;
    setRolling(false);
    setHistory((old) => [{ id: Date.now(), sides: effectiveSides, name: customDie?.name, values: result.values, labels: custom ? result.values.map(labelOf) : null }, ...old].slice(0, 20));
  }

  const palette = DICE_PALETTES.find((p) => p.id === color) || DICE_PALETTES[0];

  return (
    <div className="diceScreen">
      <Dice3D
        ref={diceRef}
        className="diceTrayFill"
        sides={effectiveSides}
        count={count}
        paletteId={color}
        customPalette={custom?.palette || null}
        felt={feltFor(theme)}
        sound={sound}
        hint={t("Touche le tapis ou glisse pour lancer • Touche un dé pour le garder", "Tap or swipe to throw • Tap a die to keep it")}
        onRollStart={() => setRolling(true)}
        onResult={handleResult}
      />

      <div className="diceResultBar">
        {custom ? (
          <div className="diceValues customValues">
            {rolling
              ? t("Ça roule…", "Rolling…")
              : values.map((v, i) => {
                  const label = labelOf(v);
                  return isHexColor(label) ? <i key={i} className="colorDot" style={{ background: label }} /> : <span key={i}>{label}</span>;
                })}
          </div>
        ) : (
          <>
            <div className="diceTotal">
              <small>{t("Total", "Total")}</small>
              <strong key={rolling ? "r" : `${total}-${history[0]?.id}`} className={rolling ? "pulse" : "pop"}>
                {rolling ? "…" : total}
              </strong>
            </div>
            <div className="diceValues">{rolling ? t("Ça roule…", "Rolling…") : values.join(" + ")}</div>
          </>
        )}
        {heldCount > 0 && (
          <button className="chipButton accent" onClick={() => diceRef.current?.releaseAll()}>
            <Hand size={15} />
            {heldCount}
          </button>
        )}
        <button className="iconButton soft" onClick={() => setPanel("history")} aria-label={t("Historique", "History")}>
          <History size={20} />
        </button>
      </div>

      <div className="dieTypes">
        {DICE_TYPES.map((d) => (
          <button
            key={d}
            className={!custom && sides === d ? "active" : ""}
            onClick={() => {
              setSides(d);
              setCustomId(null);
            }}
          >
            D{d}
          </button>
        ))}
        <button className={custom ? "active special" : "special"} onClick={() => setPanel("custom")} aria-label={t("Dés spéciaux", "Special dice")}>
          <Sparkles size={16} />
        </button>
      </div>

      <div className="diceControls">
        <div className="stepper">
          <button onClick={() => setCount(Math.max(1, count - 1))} aria-label="-">
            <Minus size={18} />
          </button>
          <strong>{count}</strong>
          <button onClick={() => setCount(Math.min(12, count + 1))} aria-label="+">
            <Plus size={18} />
          </button>
        </div>
        {!custom && (
        <button
          className="colorButton"
          style={{ background: `radial-gradient(circle at 35% 30%, ${palette.ink}66, ${palette.body} 50%)` }}
          onClick={() => setPanel("color")}
          aria-label={t("Couleur des dés", "Dice color")}
        />
        )}
        <button className="bigAction" onClick={() => diceRef.current?.roll()} disabled={rolling}>
          <Dice5 size={22} />
          {t("Lancer", "Roll")}
        </button>
      </div>

      {panel && (
        <div className="sheetBackdrop" onClick={() => setPanel(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>{panel === "history" ? t("Derniers lancers", "Recent rolls") : panel === "custom" ? t("Dés spéciaux", "Special dice") : t("Couleur des dés", "Dice color")}</h2>
              <button className="iconButton" onClick={() => setPanel(null)}>
                <X size={22} />
              </button>
            </div>
            {panel === "history" && (
              <div className="historyList">
                {history.length === 0 && <p className="muted">{t("Aucun lancer pour l'instant.", "No rolls yet.")}</p>}
                {history.map((item) => (
                  <div className="historyRow" key={item.id}>
                    {item.labels ? (
                      <span>
                        {item.values.length} × {item.name} — {item.labels.map((l) => (isHexColor(l) ? "●" : l)).join(" · ")}
                      </span>
                    ) : (
                      <>
                        <span>
                          {item.values.length} × D{item.sides} — {item.values.join(" + ")}
                        </span>
                        <strong>{item.values.reduce((s, v) => s + v, 0)}</strong>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {panel === "custom" && (
              <div className="editList">
                <p className="muted">
                  {t("Tes dés spéciaux se lancent en 3D (jusqu'à 20 faces).", "Your special dice roll in 3D (up to 20 faces).")}
                </p>
                {customDice.map((d) => {
                  const ok = to3D(d);
                  return (
                    <button
                      key={d.id}
                      className={`customPick ${customId === d.id ? "active" : ""}`}
                      disabled={!ok}
                      onClick={() => {
                        setCustomId(d.id);
                        setPanel(null);
                      }}
                    >
                      <i style={{ background: d.color }} />
                      <span>{d.name}</span>
                      <small>{ok ? `${d.faces.length} ${t("faces", "faces")} → D${ok.sides}` : t("trop de faces pour la 3D", "too many faces for 3D")}</small>
                    </button>
                  );
                })}
                <button className="bigAction secondary" onClick={() => { setPanel(null); onTool?.("customdice"); }}>
                  <Pencil size={16} /> {t("Créer ou modifier mes dés", "Create or edit my dice")}
                </button>
                {custom && (
                  <button className="linkButton" onClick={() => { setCustomId(null); setPanel(null); }}>
                    {t("Revenir aux dés normaux", "Back to regular dice")}
                  </button>
                )}
              </div>
            )}
            {panel === "color" && (
              <div className="swatchGrid">
                {DICE_PALETTES.map((p) => (
                  <button
                    key={p.id}
                    className={color === p.id ? "active" : ""}
                    onClick={() => {
                      setColor(p.id);
                      setPanel(null);
                    }}
                  >
                    <i style={{ background: `radial-gradient(circle at 35% 30%, ${p.ink}66, ${p.body} 50%)` }} />
                    <span>{p[lang]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
