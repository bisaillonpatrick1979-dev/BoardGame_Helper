import { useLang, useStored, randomInt, recordGame } from "../../lib/core.js";
import { GameFrame } from "./shared.jsx";
import { TALES } from "./tales.js";
export default function TaleBooks() {
  const { t, lang } = useLang();
  const [g, setG] = useStored("bgh2_talebooks", null);
  const tale = TALES.find((b) => b.id === g?.id);
  const node = tale?.nodes[g.node];
  function begin(id) {
    setG({
      id,
      node: "start",
      life: 3,
      items: [],
      visited: ["start"],
      roll: null,
      done: false,
    });
  }
  function choose(c) {
    let roll = null,
      to = c.to;
    if (c.test) {
      roll = randomInt(6) + 1;
      if (roll < c.test) to = c.fail;
    }
    const next = tale.nodes[to];
    const first = !g.visited.includes(to);
    const life = Math.min(
      3,
      g.life - (first ? next.damage || 0 : 0) + (first ? next.heal || 0 : 0),
    );
    const items =
      next.item && !g.items.includes(next.item)
        ? [...g.items, next.item]
        : g.items;
    const done = life <= 0 || !!next.end;
    if (done && !g.done) recordGame("talebooks", life > 0 ? "win" : "loss");
    setG({
      ...g,
      node: to,
      life,
      items,
      visited: [...g.visited, to],
      roll,
      done,
    });
  }
  return (
    <GameFrame
      title={t("Livres-jeux hors ligne", "Offline gamebooks")}
      onNew={g ? () => setG(null) : null}
      rules={t(
        "Choisis ton chemin. Tu as 3 points de résistance. Les objets ouvrent certains passages. Les tests lancent un dé à six faces; une blessure retire 1 point. Tout est sauvegardé automatiquement.",
        "Choose your path. You have 3 resilience points. Items unlock some routes. Tests roll a six-sided die; injuries cost 1 point. Progress is saved automatically.",
      )}
    >
      {!tale || !node ? (
        <>
          {TALES.map((b) => (
            <button
              className="rulesPanel"
              key={b.id}
              onClick={() => begin(b.id)}
            >
              <h3>{b.title[lang]}</h3>
              <p>{b.intro[lang]}</p>
            </button>
          ))}
        </>
      ) : (
        <>
          <h3>{tale.title[lang]}</h3>
          <p>
            ❤️ {g.life}/3 · 🎒{" "}
            {g.items
              .map(
                (id) =>
                  ({
                    rope: t("corde", "rope"),
                    key: t("clé", "key"),
                    oil: t("huile", "oil"),
                    battery: t("batterie", "battery"),
                    crystal: t("cristal", "crystal"),
                    access: t("carte d’accès", "access card"),
                  })[id],
              )
              .join(", ") || t("vide", "empty")}
          </p>
          {g.roll && <p role="status">🎲 {g.roll}</p>}
          <p className="rulesPanel">{node.text[lang]}</p>
          {g.life <= 0 ? (
            <p>
              {t(
                "Tu dois abandonner la mission. Essaie un autre chemin.",
                "You must abandon the mission. Try another path.",
              )}
            </p>
          ) : node.end ? (
            <p>{t("Mission accomplie!", "Mission accomplished!")}</p>
          ) : (
            node.choices.map((c, i) => (
              <button
                key={i}
                className="bigAction secondary"
                disabled={c.requires && !g.items.includes(c.requires)}
                onClick={() => choose(c)}
              >
                {c.text[lang]}
                {c.requires && !g.items.includes(c.requires) ? " 🔒" : ""}
              </button>
            ))
          )}
          {g.done && (
            <button className="bigAction" onClick={() => setG(null)}>
              {t("Choisir une autre aventure", "Choose another adventure")}
            </button>
          )}
        </>
      )}
    </GameFrame>
  );
}
