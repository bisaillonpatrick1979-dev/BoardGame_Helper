// Dés personnalisés : n'importe quelles faces (couleurs, lettres, symboles, actions…)
import { useState } from "react";
import { Dice5, Pencil, Plus, Trash2, X } from "lucide-react";
import { randomInt, sfx, useLang, useStored, vibrate } from "../lib/core.js";

const isColor = (face) => /^#[0-9a-f]{6}$/i.test(face.trim());

const PRESETS = [
  { id: "colors", fr: "Couleurs", en: "Colors", faces: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#f97316", "#a855f7"], color: "#f8fafc" },
  { id: "yesno", fr: "Oui / Non", en: "Yes / No", faces: ["OUI", "NON", "OUI", "NON", "PEUT-ÊTRE", "RELANCE"], color: "#1e293b" },
  { id: "arrows", fr: "Directions", en: "Directions", faces: ["↑", "↓", "←", "→", "↺", "★"], color: "#0f766e" },
  { id: "letters", fr: "Lettres", en: "Letters", faces: "ABCDEFGHIJKLMNOPRSTU".split(""), color: "#fde68a" },
  { id: "party", fr: "Mime / Dessine / Explique", en: "Mime / Draw / Explain", faces: ["MIME 🎭", "DESSINE ✏️", "EXPLIQUE 💬", "MIME 🎭", "DESSINE ✏️", "EXPLIQUE 💬"], color: "#7c3aed" },
  { id: "d2", fr: "Pile ou face", en: "Heads or tails", faces: ["PILE", "FACE"], color: "#ca8a04" },
  { id: "d3", fr: "Dé à 3 faces", en: "3-sided die", faces: ["1", "2", "3", "1", "2", "3"], color: "#dc2626" },
  { id: "dots", fr: "Dé à 0-5", en: "0-5 die", faces: ["0", "1", "2", "3", "4", "5"], color: "#2563eb" }
];

// Texte lisible sur la couleur du dé
const inkFor = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const lum = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  return lum > 150 ? "#111827" : "#ffffff";
};

function Face({ die, value, rolling }) {
  return (
    <div className={`customDie ${rolling ? "tumbling" : "landed"}`} style={{ "--die": die.color, color: inkFor(die.color) }}>
      {isColor(value) ? <i className="colorFace" style={{ background: value }} /> : <span className={value.length > 4 ? "long" : ""}>{value}</span>}
    </div>
  );
}

export default function CustomDice() {
  const { t, lang } = useLang();
  const [dice, setDice] = useStored("bgh2_custom_dice", () => [
    { ...PRESETS[0], id: 1, name: PRESETS[0][lang] },
    { ...PRESETS[1], id: 2, name: PRESETS[1][lang] }
  ]);
  const [selected, setSelected] = useState(() => dice.map((d) => d.id).slice(0, 1));
  const [results, setResults] = useState({});
  const [rolling, setRolling] = useState(false);
  const [editor, setEditor] = useState(null); // dé en cours de modification

  const active = dice.filter((d) => selected.includes(d.id));

  function roll() {
    if (!active.length || rolling) return;
    setRolling(true);
    sfx.flip();
    vibrate(30);
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      const next = {};
      active.forEach((d) => (next[d.id] = d.faces[randomInt(d.faces.length)]));
      setResults(next);
      if (ticks > 9) {
        clearInterval(id);
        setRolling(false);
        sfx.drop();
      }
    }, 80);
  }

  function saveDie(die) {
    const faces = die.facesText
      .split(/\n|,/)
      .map((f) => f.trim())
      .filter(Boolean)
      .slice(0, 30);
    if (faces.length < 2 || !die.name.trim()) return;
    const clean = { id: die.id || Date.now(), name: die.name.trim(), faces, color: die.color };
    setDice(die.id ? dice.map((d) => (d.id === die.id ? clean : d)) : [...dice, clean]);
    if (!die.id) setSelected([...selected, clean.id]);
    setEditor(null);
  }

  return (
    <div className="tool">
      <div className="dieChips">
        {dice.map((d) => (
          <button
            key={d.id}
            className={selected.includes(d.id) ? "active" : ""}
            style={{ "--die": d.color }}
            onClick={() => setSelected(selected.includes(d.id) ? selected.filter((x) => x !== d.id) : [...selected, d.id])}
          >
            <i />
            {d.name}
          </button>
        ))}
        <button className="addChip" onClick={() => setEditor({ name: "", facesText: "", color: "#f8fafc" })}>
          <Plus size={16} /> {t("Créer", "Create")}
        </button>
      </div>

      <div className="customTray" onClick={roll}>
        {active.length === 0 && <p className="muted">{t("Choisis au moins un dé en haut.", "Pick at least one die above.")}</p>}
        {active.map((d) => (
          <div key={d.id} className="customSlot">
            <Face die={d} value={results[d.id] ?? d.faces[0]} rolling={rolling} />
            <small>
              {d.name}
              <button onClick={(e) => { e.stopPropagation(); setEditor({ ...d, facesText: d.faces.join("\n") }); }} aria-label={t("Modifier", "Edit")}>
                <Pencil size={12} />
              </button>
            </small>
          </div>
        ))}
      </div>

      <button className="bigAction" onClick={roll} disabled={!active.length || rolling}>
        <Dice5 size={22} />
        {t("Lancer", "Roll")} {active.length > 1 ? `(${active.length})` : ""}
      </button>

      {editor && (
        <div className="sheetBackdrop" onClick={() => setEditor(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>{editor.id ? t("Modifier le dé", "Edit die") : t("Nouveau dé", "New die")}</h2>
              <button className="iconButton" onClick={() => setEditor(null)}>
                <X size={22} />
              </button>
            </div>
            {!editor.id && (
              <>
                <h3 className="sheetLabel">{t("Modèles", "Templates")}</h3>
                <div className="templateGrid">
                  {PRESETS.map((p) => (
                    <button key={p.id} onClick={() => setEditor({ name: p[lang], facesText: p.faces.join("\n"), color: p.color })}>
                      {p[lang]}
                      <small>{p.faces.length} {t("faces", "faces")}</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="authForm">
              <input value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} placeholder={t("Nom du dé", "Die name")} />
              <textarea
                rows={5}
                value={editor.facesText}
                onChange={(e) => setEditor({ ...editor, facesText: e.target.value })}
                placeholder={t("Une face par ligne (2 à 30). Astuce : #ff0000 = face rouge", "One face per line (2 to 30). Tip: #ff0000 = red face")}
              />
              <div className="colorDots big">
                {["#f8fafc", "#1e293b", "#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#7c3aed", "#0f766e", "#fde68a"].map((c) => (
                  <i key={c} className={editor.color === c ? "active" : ""} style={{ background: c }} onClick={() => setEditor({ ...editor, color: c })} />
                ))}
              </div>
              <button className="bigAction" onClick={() => saveDie(editor)}>
                {t("Enregistrer", "Save")}
              </button>
              {editor.id && (
                <button
                  className="linkButton danger"
                  onClick={() => {
                    setDice(dice.filter((d) => d.id !== editor.id));
                    setEditor(null);
                  }}
                >
                  <Trash2 size={14} /> {t("Supprimer ce dé", "Delete this die")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
