import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Active le mode hors ligne (seulement en production)
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Service worker non enregistré :", error);
      });
    }
  });
}
