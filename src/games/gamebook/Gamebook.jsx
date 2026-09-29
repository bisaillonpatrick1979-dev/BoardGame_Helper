// Livre dont tu es le héros : lecture, choix, combats aux dés, tests de chance.
// La partie est sauvegardée (et synchronisée avec le compte).
import { useEffect, useRef, useState } from "react";
import { Backpack, Drumstick, RotateCcw, X } from "lucide-react";
import PipDie from "../../components/PipDie.jsx";
import { randomInt, recordGame, sfx, useLang, useStored, vibrate } from "../../lib/core.js";
import { Confetti } from "../Hangman.jsx";
import { ITEMS, STORY } from "./story.js";

const d6 = () => 1 + randomInt(6);

// Deux dés animés qui roulent puis s'arrêtent
function useDiceRoll() {
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  function roll(n = 2) {
    return new Promise((resolve) => {
      setRolling(true);
      sfx.flip();
      let k = 0;
      clearInterval(timer.current);
      timer.current = setInterval(() => {
        k += 1;
        setDice(Array.from({ length: n }, d6));
        if (k > 8) {
          clearInterval(timer.current);
          const final = Array.from({ length: n }, d6);
          setDice(final);
          setRolling(false);
          sfx.drop();
          resolve(final);
        }
      }, 70);
    });
  }
  return { dice, rolling, roll };
}

function newHero(name) {
  return { name, stage: "create", section: STORY.start, stats: null, max: null, gold: 5, prov: 3, items: [], applied: {}, boss: { handicap: 0, weakened: 0 }, log: [] };
}

function Stats({ hero, onEat, t, lang, onBag }) {
  const skillBonus = hero.items.includes("sword") ? 1 : 0;
  return (
    <div className="gbStats">
      <span title={t("Endurance", "Stamina")}>
        ❤️ {hero.stats.end}/{hero.max.end}
      </span>
      <span title={t("Habileté", "Skill")}>
        ⚔️ {hero.stats.skill + skillBonus}
      </span>
      <span title={t("Chance", "Luck")}>🍀 {hero.stats.luck}</span>
      <span>🪙 {hero.gold}</span>
      <button onClick={onEat} disabled={!hero.prov || hero.stats.end >= hero.max.end} title={t("Manger (+4 endurance)", "Eat (+4 stamina)")}>
        <Drumstick size={14} /> {hero.prov}
      </button>
      <button onClick={onBag} aria-label={t("Sac", "Bag")}>
        <Backpack size={14} /> {hero.items.length}
      </button>
    </div>
  );
}

function Creation({ hero, setHero, t }) {
  const { dice, rolling, roll } = useDiceRoll();
  const [rolled, setRolled] = useState({});

  async function rollStat(key) {
    if (rolling || rolled[key]) return;
    const n = key === "end" ? 2 : 1;
    const r = await roll(n);
    const base = { skill: 6, end: 12, luck: 6 }[key];
    setRolled((old) => ({ ...old, [key]: base + r.reduce((a, b) => a + b, 0) }));
  }

  const all = rolled.skill && rolled.end && rolled.luck;
  const rows = [
    ["skill", "⚔️", t("Habileté", "Skill"), "1 dé + 6", "1 die + 6", t("pour combattre", "to fight")],
    ["end", "❤️", t("Endurance", "Stamina"), "2 dés + 12", "2 dice + 12", t("ta vie", "your life")],
    ["luck", "🍀", t("Chance", "Luck"), "1 dé + 6", "1 die + 6", t("pour les coups du sort", "for twists of fate")]
  ];

  return (
    <div className="gbCreate">
      <div className="gbDice">
        {dice.map((v, i) => (
          <PipDie key={i} value={v} rolling={rolling} size={56} />
        ))}
      </div>
      {rows.map(([key, icon, label, fr, en, why]) => (
        <button key={key} className={`gbStatRow ${rolled[key] ? "done" : ""}`} onClick={() => rollStat(key)} disabled={rolling}>
          <span className="gbStatIcon">{icon}</span>
          <span className="gbStatText">
            <strong>{label}</strong>
            <small>
              {t(fr, en)} — {why}
            </small>
          </span>
          <b>{rolled[key] ?? t("Lancer", "Roll")}</b>
        </button>
      ))}
      <button
        className="bigAction"
        disabled={!all}
        onClick={() =>
          setHero({
            ...hero,
            stage: "play",
            stats: { skill: rolled.skill, end: rolled.end, luck: rolled.luck },
            max: { skill: rolled.skill, end: rolled.end, luck: rolled.luck }
          })
        }
      >
        {t("Commencer l'aventure", "Begin the adventure")}
      </button>
    </div>
  );
}

export default function Gamebook({ players }) {
  const { t, lang } = useLang();
  const [hero, setHero] = useStored("bgh2_gamebook", null);
  const [fight, setFight] = useState(null); // combat en cours
  const [testResult, setTestResult] = useState(null);
  const [bag, setBag] = useState(false);
  const { dice, rolling, roll } = useDiceRoll();
  const textRef = useRef(null);

  const section = hero ? STORY.sections[hero.section] : null;

  // Effets d'une section appliqués une seule fois
  useEffect(() => {
    if (!hero || hero.stage !== "play" || !section || hero.applied[hero.section]) return;
    const e = section.effects || {};
    const stats = { ...hero.stats };
    if (e.end) stats.end = Math.min(hero.max.end, stats.end + e.end);
    if (e.luck) stats.luck += e.luck;
    if (e.skill) stats.skill += e.skill;
    let items = [...hero.items];
    if (e.add && !items.includes(e.add)) items.push(e.add);
    if (e.remove) items = items.filter((i) => i !== e.remove);
    const next = { ...hero, stats, items, gold: hero.gold + (e.gold || 0), prov: hero.prov + (e.prov || 0), applied: { ...hero.applied, [hero.section]: true } };
    if (e.end < 0) vibrate(80);
    if (stats.end <= 0) next.stage = "dead";
    if (section.end === "win") {
      next.stage = "won";
      sfx.win();
      recordGame("gamebook", "win");
    }
    setHero(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero?.section, hero?.stage]);

  useEffect(() => {
    textRef.current?.scrollTo?.({ top: 0 });
    setTestResult(null);
    if (section?.combat && hero?.stage === "play") {
      const c = section.combat;
      const handicap = c.boss ? hero.boss.handicap : 0;
      const weak = c.boss ? hero.boss.weakened : 0;
      setFight({ enemy: { ...c, skill: c.skill - weak, stamina: c.stamina - handicap, max: c.stamina }, log: [], over: false });
    } else setFight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero?.section, hero?.stage === "play"]);

  if (!hero) {
    return (
      <div className="game gbStart">
        <div className="gbCover">
          <div className="gbCoverArt">🐦‍⬛</div>
          <h2>{STORY.title[lang]}</h2>
          <p>{STORY.intro[lang]}</p>
          <button className="bigAction" onClick={() => setHero(newHero(players?.[0]?.name || t("Héros", "Hero")))}>
            {t("Créer mon héros", "Create my hero")}
          </button>
        </div>
      </div>
    );
  }

  if (hero.stage === "create") {
    return (
      <div className="game">
        <p className="muted center">{t("Lance les dés pour chaque qualité de ton héros.", "Roll the dice for each of your hero's qualities.")}</p>
        <Creation hero={hero} setHero={setHero} t={t} />
      </div>
    );
  }

  const goTo = (choice) => {
    const boss = { ...hero.boss };
    if (choice.bossHandicap) boss.handicap += choice.bossHandicap;
    if (choice.bossWeakened) boss.weakened += choice.bossWeakened;
    setHero({ ...hero, section: choice.to, boss });
    sfx.tap();
  };

  function buy(offer) {
    if (hero.gold < offer.cost || hero.items.includes(offer.item)) return;
    setHero({ ...hero, gold: hero.gold - offer.cost, items: [...hero.items, offer.item] });
    sfx.good();
  }

  function eat() {
    if (!hero.prov || fight) return;
    setHero({ ...hero, prov: hero.prov - 1, stats: { ...hero.stats, end: Math.min(hero.max.end, hero.stats.end + 4) } });
    sfx.good();
  }

  // Un assaut : 2 dés + habileté de chaque côté
  async function attack() {
    if (!fight || fight.over || rolling) return;
    const mine = await roll(2);
    const skillBonus = hero.items.includes("sword") ? 1 : 0;
    const heroAtk = mine[0] + mine[1] + hero.stats.skill + skillBonus;
    const enemyAtk = d6() + d6() + fight.enemy.skill;
    const enemy = { ...fight.enemy };
    const stats = { ...hero.stats };
    let line;
    if (heroAtk > enemyAtk) {
      enemy.stamina -= 2;
      line = { fr: `Tu touches! (${heroAtk} contre ${enemyAtk}) — ${enemy.name.fr} perd 2`, en: `You hit! (${heroAtk} vs ${enemyAtk}) — ${enemy.name.en} loses 2`, kind: "hit" };
      sfx.good();
    } else if (enemyAtk > heroAtk) {
      stats.end -= 2;
      line = { fr: `Tu es blessé! (${heroAtk} contre ${enemyAtk}) — tu perds 2`, en: `You're wounded! (${heroAtk} vs ${enemyAtk}) — you lose 2`, kind: "hurt" };
      sfx.bad();
      vibrate(60);
    } else {
      line = { fr: `Parade! (${heroAtk} partout)`, en: `Parried! (${heroAtk} each)`, kind: "tie" };
    }
    const over = enemy.stamina <= 0 || stats.end <= 0;
    setFight({ ...fight, enemy, log: [line, ...fight.log].slice(0, 4), over, last: line.kind, usedLuck: false });
    const next = { ...hero, stats };
    if (stats.end <= 0) {
      next.stage = "dead";
      sfx.lose();
      recordGame("gamebook", "loss");
    }
    setHero(next);
  }

  // Tester sa chance pendant un combat : double les dégâts donnés ou réduit ceux reçus
  async function luckInFight() {
    if (!fight || fight.over || rolling || !fight.last || fight.last === "tie" || fight.usedLuck) return;
    const r = await roll(2);
    const lucky = r[0] + r[1] <= hero.stats.luck;
    const stats = { ...hero.stats, luck: hero.stats.luck - 1 };
    const enemy = { ...fight.enemy };
    let line;
    if (fight.last === "hit") {
      if (lucky) enemy.stamina -= 2;
      else enemy.stamina += 1;
      line = lucky ? { fr: "Chanceux! Coup critique (-2 de plus)", en: "Lucky! Critical hit (-2 more)" } : { fr: "Malchance : ton coup n'était qu'une égratignure (+1 pour lui)", en: "Unlucky: only a scratch (+1 back)" };
    } else {
      if (lucky) stats.end = Math.min(hero.max.end, stats.end + 1);
      else stats.end -= 1;
      line = lucky ? { fr: "Chanceux! La blessure est légère (+1)", en: "Lucky! Just a light wound (+1)" } : { fr: "Malchance : la blessure est grave (-1)", en: "Unlucky: a deep wound (-1)" };
    }
    const over = enemy.stamina <= 0 || stats.end <= 0;
    setFight({ ...fight, enemy, log: [{ ...line, kind: lucky ? "hit" : "hurt" }, ...fight.log].slice(0, 4), over, usedLuck: true });
    setHero({ ...hero, stats, stage: stats.end <= 0 ? "dead" : hero.stage });
  }

  function flee() {
    if (!section.combat?.flee) return;
    setHero({ ...hero, stats: { ...hero.stats, end: hero.stats.end - 2 }, section: section.combat.flee });
    sfx.bad();
  }

  async function doTest() {
    if (rolling || testResult) return;
    const r = await roll(2);
    const total = r[0] + r[1];
    const isLuck = section.test.type === "luck";
    const target = isLuck ? hero.stats.luck : hero.stats.skill + (hero.items.includes("sword") ? 1 : 0);
    const ok = total <= target;
    setTestResult({ ok, total, target });
    if (isLuck) setHero({ ...hero, stats: { ...hero.stats, luck: hero.stats.luck - 1 } });
    if (ok) sfx.good();
    else sfx.bad();
  }

  const restart = () => {
    setHero(null);
    setFight(null);
  };

  return (
    <div className="game gamebook">
      <Stats hero={hero} onEat={eat} onBag={() => setBag(true)} t={t} lang={lang} />

      <div className="gbPage" ref={textRef}>
        <div className="gbSectionNo">§ {hero.section}</div>
        <p>{section.text[lang]}</p>

        {section.shop && hero.stage === "play" && (
          <div className="gbShop">
            {section.shop.map((offer) => {
              const owned = hero.items.includes(offer.item);
              return (
                <button key={offer.item} onClick={() => buy(offer)} disabled={owned || hero.gold < offer.cost}>
                  <span>{ITEMS[offer.item].icon}</span>
                  {ITEMS[offer.item][lang]}
                  <small>{owned ? "✓" : `${offer.cost} 🪙`}</small>
                </button>
              );
            })}
          </div>
        )}

        {fight && (
          <div className="gbFight">
            <div className="gbEnemy">
              <strong>{fight.enemy.name[lang]}</strong>
              <span>
                ⚔️ {fight.enemy.skill} · ❤️ {Math.max(0, fight.enemy.stamina)}/{fight.enemy.max}
              </span>
              <div className="gbBar">
                <i style={{ width: `${Math.max(0, (fight.enemy.stamina / fight.enemy.max) * 100)}%` }} />
              </div>
            </div>
            <div className="gbFightLog">
              {fight.log.map((l, i) => (
                <div key={i} className={`gbLog ${l.kind}`}>
                  {l[lang]}
                </div>
              ))}
            </div>
          </div>
        )}

        {section.test && testResult && (
          <div className={`gbTest ${testResult.ok ? "ok" : "fail"}`}>
            {testResult.total} {testResult.ok ? "≤" : ">"} {testResult.target} — {testResult.ok ? t("Réussi!", "Success!") : t("Raté!", "Failed!")}
          </div>
        )}
      </div>

      {(fight || section.test) && hero.stage === "play" && (
        <div className="gbDice small">
          {dice.map((v, i) => (
            <PipDie key={i} value={v} rolling={rolling} size={44} />
          ))}
        </div>
      )}

      <div className="gbActions">
        {hero.stage === "dead" && (
          <div className="resultBanner lose">
            <strong>☠️ {t("Ton aventure se termine ici…", "Your adventure ends here…")}</strong>
            <button className="bigAction" onClick={restart}>
              <RotateCcw size={18} /> {t("Nouveau héros", "New hero")}
            </button>
          </div>
        )}
        {hero.stage === "won" && (
          <div className="resultBanner win">
            <strong>🏆 {t("Tu as vaincu le Roi-Corbeau!", "You defeated the Raven King!")}</strong>
            <button className="bigAction" onClick={restart}>
              <RotateCcw size={18} /> {t("Rejouer", "Play again")}
            </button>
          </div>
        )}

        {hero.stage === "play" && fight && !fight.over && (
          <>
            <div className="actionRow">
              <button className="bigAction" onClick={attack} disabled={rolling}>
                ⚔️ {t("Attaquer", "Attack")}
              </button>
              <button className="bigAction secondary" onClick={luckInFight} disabled={rolling || !fight.last || fight.last === "tie" || fight.usedLuck}>
                🍀 {t("Chance", "Luck")}
              </button>
            </div>
            {section.combat.flee && (
              <button className="linkButton" onClick={flee}>
                {t("Fuir (−2 endurance)", "Flee (−2 stamina)")}
              </button>
            )}
          </>
        )}
        {hero.stage === "play" && fight && fight.over && (
          <button className="bigAction gold" onClick={() => goTo({ to: section.combat.win })}>
            {t("Victoire! Continuer", "Victory! Continue")}
          </button>
        )}

        {hero.stage === "play" && section.test && !testResult && (
          <button className="bigAction" onClick={doTest} disabled={rolling}>
            🎲 {section.test.type === "luck" ? t("Tenter ma chance", "Test my luck") : t("Tester mon habileté", "Test my skill")}
          </button>
        )}
        {hero.stage === "play" && section.test && testResult && (
          <button className="bigAction" onClick={() => goTo({ to: testResult.ok ? section.test.success : section.test.fail })}>
            {t("Continuer", "Continue")}
          </button>
        )}

        {hero.stage === "play" &&
          !fight &&
          !section.test &&
          (section.choices || []).map((choice, i) => {
            const locked = choice.requires && !hero.items.includes(choice.requires);
            return (
              <button key={i} className={`gbChoice ${locked ? "locked" : ""}`} disabled={locked} onClick={() => goTo(choice)}>
                {choice.text[lang]}
                {choice.requires && <small>{ITEMS[choice.requires].icon} {locked ? t("il te faut", "requires") : ""} {ITEMS[choice.requires][lang]}</small>}
              </button>
            );
          })}
      </div>

      {bag && (
        <div className="sheetBackdrop" onClick={() => setBag(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>🎒 {hero.name}</h2>
              <button className="iconButton" onClick={() => setBag(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="statTotals">
              <div>
                <strong>{hero.stats.skill}</strong>
                <small>{t("habileté", "skill")}</small>
              </div>
              <div>
                <strong>
                  {hero.stats.end}/{hero.max.end}
                </strong>
                <small>{t("endurance", "stamina")}</small>
              </div>
              <div>
                <strong>{hero.stats.luck}</strong>
                <small>{t("chance", "luck")}</small>
              </div>
            </div>
            <div className="editList">
              {hero.items.length === 0 && <p className="muted">{t("Ton sac est vide.", "Your bag is empty.")}</p>}
              {hero.items.map((item) => (
                <div className="editRow" key={item}>
                  <span>
                    {ITEMS[item].icon} {ITEMS[item][lang]}
                  </span>
                </div>
              ))}
              <div className="editRow">
                <span>🍖 {t("Provisions (+4 endurance, hors combat)", "Provisions (+4 stamina, not in combat)")}</span>
                <b>{hero.prov}</b>
              </div>
            </div>
            <button className="linkButton danger" onClick={() => { restart(); setBag(false); }}>
              {t("Abandonner et recommencer", "Give up and restart")}
            </button>
          </div>
        </div>
      )}
      {hero.stage === "won" && <Confetti />}
    </div>
  );
}
