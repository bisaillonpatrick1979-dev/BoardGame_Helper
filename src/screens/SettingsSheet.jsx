// Feuille de réglages : langue, thème, son
import { Check, Volume2, VolumeX, X } from "lucide-react";
import { useLang } from "../lib/core.js";

// Version affichée dans les réglages (à monter à chaque publication)
export const APP_VERSION = "2.4.0";

export const THEMES = [
  { id: "classic", fr: "Néon classique", en: "Classic Neon", bg: "#070b1d", colors: ["#2563eb", "#7c3aed"], felt: "#163a6b" },
  { id: "casino", fr: "Casino", en: "Casino", bg: "#04150e", colors: ["#15803d", "#b45309"], felt: "#0e5a32" },
  { id: "cabin", fr: "Chalet", en: "Cabin", bg: "#140d08", colors: ["#b45309", "#1e3a8a"], felt: "#4a2c17" },
  { id: "future", fr: "Futur", en: "Future", bg: "#020617", colors: ["#0891b2", "#7c3aed"], felt: "#0b2a3d" },
  { id: "fantasy", fr: "Fantaisie", en: "Fantasy", bg: "#120b1c", colors: ["#7c3aed", "#be185d"], felt: "#34165c" },
  { id: "arcade", fr: "Arcade", en: "Arcade", bg: "#0f0a1a", colors: ["#db2777", "#7c3aed"], felt: "#3d1152" },
  { id: "pirate", fr: "Pirate", en: "Pirate", bg: "#15110c", colors: ["#b45309", "#78350f"], felt: "#4a3419" },
  { id: "halloween", fr: "Halloween", en: "Halloween", bg: "#0c0806", colors: ["#ea580c", "#7c2d12"], felt: "#3a1a08" }
];

export function feltFor(theme) {
  return (THEMES.find((item) => item.id === theme) || THEMES[0]).felt;
}

export default function SettingsSheet({ onClose, lang, setLang, theme, setTheme, sound, setSound }) {
  const { t } = useLang();
  return (
    <div className="sheetBackdrop" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheetHeader">
          <h2>{t("Réglages", "Settings")}</h2>
          <button className="iconButton" onClick={onClose} aria-label={t("Fermer", "Close")}>
            <X size={22} />
          </button>
        </div>

        <h3 className="sheetLabel">{t("Langue", "Language")}</h3>
        <div className="segmented">
          <button className={lang === "fr" ? "active" : ""} onClick={() => setLang("fr")}>
            Français
          </button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
            English
          </button>
        </div>

        <h3 className="sheetLabel">{t("Son", "Sound")}</h3>
        <button className={`toggleRow ${sound ? "on" : ""}`} onClick={() => setSound(!sound)}>
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span>{sound ? t("Sons activés", "Sound on") : t("Sons coupés", "Sound off")}</span>
          <i className="switch" />
        </button>

        <h3 className="sheetLabel">{t("Thème", "Theme")}</h3>
        <div className="themeGrid">
          {THEMES.map((item) => (
            <button
              key={item.id}
              className={`themeChip ${theme === item.id ? "active" : ""}`}
              style={{ background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})` }}
              onClick={() => setTheme(item.id)}
            >
              <span>{item[lang]}</span>
              {theme === item.id && <Check size={18} />}
            </button>
          ))}
        </div>

        {/* Numéro de version : permet de vérifier qu'on a bien la dernière mise à jour */}
        <p className="appVersion">Board Game Helper v{APP_VERSION}</p>
      </div>
    </div>
  );
}
