import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Service worker : mode hors ligne + mises à jour automatiques.
// Quand une nouvelle version est publiée, l'app la télécharge et se recharge
// toute seule (une seule fois) pour que le joueur voie tout de suite les nouveautés.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  // Pas de rechargement à la toute première visite (aucune ancienne version)
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded || !hadController) return;
    reloaded = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        const announce = () => {
          if (reg.waiting && navigator.serviceWorker.controller)
            window.dispatchEvent(
              new CustomEvent("bgh-update-ready", { detail: reg.waiting }),
            );
        };
        announce();
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed") announce();
          });
        });
        const check = () =>
          reg
            .update()
            .then(announce)
            .catch(() => {});
        check();
        // Revérifie quand on revient dans l'app (téléphone sorti de veille, etc.)
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        setInterval(check, 30 * 60 * 1000);
      })
      .catch((error) => {
        console.warn("Service worker non enregistré :", error);
      });
  });
}
