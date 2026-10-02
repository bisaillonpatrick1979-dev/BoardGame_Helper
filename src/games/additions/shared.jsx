import { useState } from "react";
import { useLang } from "../../lib/core.js";
export function GameFrame({ title, rules, children, onNew }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <div className="newGame">
      <div className="newGameHeader">
        <h2>{title}</h2>
        <button
          className="chipButton"
          aria-expanded={show}
          onClick={() => setShow(!show)}
        >
          {t("Règles", "Rules")}
        </button>
        {onNew && (
          <button
            className="chipButton"
            onClick={() => {
              if (
                window.confirm(
                  t(
                    "Remplacer la partie en cours?",
                    "Replace the current game?",
                  ),
                )
              )
                onNew();
            }}
          >
            {t("Nouvelle", "New")}
          </button>
        )}
      </div>
      {show && <p className="rulesPanel">{rules}</p>}
      {children}
    </div>
  );
}
export function PassDevice({ name, onReady }) {
  const { t } = useLang();
  return (
    <div className="privacyCover">
      <h2>
        {t("Passe le téléphone à", "Pass the phone to")} {name}
      </h2>
      <p>
        {t(
          "Les autres joueurs regardent ailleurs.",
          "Other players look away.",
        )}
      </p>
      <button className="bigAction" onClick={onReady}>
        {t("Je suis prêt", "I am ready")}
      </button>
    </div>
  );
}
export function playerNames(players, count = 2, t) {
  return Array.from(
    { length: count },
    (_, i) => players?.[i]?.name || `${t("Joueur", "Player")} ${i + 1}`,
  );
}
