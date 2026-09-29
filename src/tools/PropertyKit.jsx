// Kit immobilier : remplace les cartes événement et les titres de propriété
// perdus des jeux d'immobilier. Texte original, et tout est modifiable par le joueur.
import { useMemo, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { randomInt, sfx, useLang, useStored, vibrate } from "../lib/core.js";

const DECKS = {
  surprise: {
    color: "#f97316",
    icon: "❓",
    name: { fr: "Surprise", en: "Surprise" },
    cards: {
      fr: [
        "Avance jusqu'à la case Départ. Réclame ton salaire.",
        "Recule de 3 cases.",
        "Excès de vitesse! Paie 15 $.",
        "Ta mise de fonds rapporte : reçois 50 $.",
        "Avance jusqu'au prochain terminus. Si quelqu'un le possède, paie-lui le double.",
        "Va directement en prison. Ne passe pas par Départ.",
        "Libéré! Garde cette carte pour sortir de prison.",
        "Rénovations : paie 25 $ par maison et 100 $ par hôtel.",
        "Tu es élu président du quartier : paie 50 $ à chaque joueur.",
        "Ton prêt immobilier arrive à échéance : reçois 150 $.",
        "Avance jusqu'à la propriété la plus chère du plateau.",
        "Fais un tour en taxi : avance jusqu'au prochain service public.",
        "Amende de stationnement : paie 20 $.",
        "Tu gagnes un concours de mots croisés : reçois 100 $.",
        "Avance de 5 cases.",
        "Dividende de la banque : reçois 50 $."
      ],
      en: [
        "Advance to Start. Collect your salary.",
        "Go back 3 spaces.",
        "Speeding ticket! Pay $15.",
        "Your investment pays off: collect $50.",
        "Advance to the next station. If owned, pay the owner double.",
        "Go directly to jail. Do not pass Start.",
        "Released! Keep this card to get out of jail.",
        "Renovations: pay $25 per house and $100 per hotel.",
        "You're elected neighbourhood president: pay each player $50.",
        "Your building loan matures: collect $150.",
        "Advance to the most expensive property on the board.",
        "Take a cab: advance to the next utility.",
        "Parking fine: pay $20.",
        "You win a crossword contest: collect $100.",
        "Move forward 5 spaces.",
        "Bank dividend: collect $50."
      ]
    }
  },
  chest: {
    color: "#2563eb",
    icon: "🎁",
    name: { fr: "Coffre", en: "Treasure" },
    cards: {
      fr: [
        "Avance jusqu'à la case Départ. Réclame ton salaire.",
        "Erreur de la banque en ta faveur : reçois 200 $.",
        "Frais de dentiste : paie 50 $.",
        "Vente de garage : reçois 50 $.",
        "Libéré! Garde cette carte pour sortir de prison.",
        "Va directement en prison. Ne passe pas par Départ.",
        "C'est ton anniversaire : chaque joueur te donne 10 $.",
        "Remboursement d'impôt : reçois 20 $.",
        "Assurance habitation : paie 50 $.",
        "Tu hérites de ta tante : reçois 100 $.",
        "Frais de scolarité : paie 50 $.",
        "Prix de beauté du quartier : reçois 10 $.",
        "Réparations de rue : paie 40 $ par maison et 115 $ par hôtel.",
        "Consultation : reçois 25 $.",
        "Placement arrivé à terme : reçois 100 $.",
        "Facture de chauffage : paie 100 $."
      ],
      en: [
        "Advance to Start. Collect your salary.",
        "Bank error in your favour: collect $200.",
        "Dentist bill: pay $50.",
        "Garage sale: collect $50.",
        "Released! Keep this card to get out of jail.",
        "Go directly to jail. Do not pass Start.",
        "It's your birthday: every player gives you $10.",
        "Tax refund: collect $20.",
        "Home insurance: pay $50.",
        "You inherit from your aunt: collect $100.",
        "School fees: pay $50.",
        "Neighbourhood beauty prize: collect $10.",
        "Street repairs: pay $40 per house and $115 per hotel.",
        "Consulting fee: collect $25.",
        "Investment matures: collect $100.",
        "Heating bill: pay $100."
      ]
    }
  }
};

// Titres de propriété d'exemple (noms et prix inventés, entièrement modifiables)
const GROUPS = [
  ["#8b5a2b", ["Rue des Pins", "Rue des Érables"], 60],
  ["#7dd3fc", ["Chemin du Lac", "Rue du Moulin", "Avenue du Parc"], 110],
  ["#db2777", ["Rue Saint-Louis", "Boulevard du Fleuve", "Place du Marché"], 150],
  ["#f97316", ["Rue des Tanneurs", "Côte de la Montagne", "Rue du Quai"], 190],
  ["#dc2626", ["Avenue des Artistes", "Rue du Théâtre", "Boulevard Central"], 230],
  ["#eab308", ["Rue des Jardins", "Promenade du Port", "Place Royale"], 270],
  ["#16a34a", ["Avenue du Golf", "Chemin des Cèdres", "Rue des Étoiles"], 310],
  ["#1e3a8a", ["Promenade des Falaises", "Boulevard du Château"], 360]
];

function defaultDeeds() {
  const deeds = [];
  GROUPS.forEach(([color, names, base], g) => {
    names.forEach((name, k) => {
      const price = base + k * 20;
      const rent = Math.round(price / 12);
      deeds.push({
        id: `d${g}-${k}`,
        name,
        color,
        price,
        rents: [rent, rent * 5, rent * 15, rent * 40, rent * 55, rent * 70],
        house: 50 + g * 25,
        owner: null,
        mortgaged: false,
        houses: 0
      });
    });
  });
  ["Terminus Nord", "Terminus Est", "Terminus Sud", "Terminus Ouest"].forEach((name, k) =>
    deeds.push({ id: `t${k}`, name, color: "#111827", price: 200, rents: [25, 50, 100, 200], house: 0, owner: null, mortgaged: false, houses: 0, kind: "station" })
  );
  ["Hydroélectricité", "Aqueduc"].forEach((name, k) =>
    deeds.push({ id: `u${k}`, name, color: "#64748b", price: 150, rents: [0], house: 0, owner: null, mortgaged: false, houses: 0, kind: "utility" })
  );
  return deeds;
}

function EventDecks() {
  const { t, lang } = useLang();
  const [decks, setDecks] = useStored("bgh2_prop_decks", () => ({ surprise: DECKS.surprise.cards[lang], chest: DECKS.chest.cards[lang] }));
  const [current, setCurrent] = useState(null); // { deck, text, key }
  const [editing, setEditing] = useState(null);
  const [input, setInput] = useState("");
  const [discard, setDiscard] = useState({ surprise: [], chest: [] });

  // Pige sans remise : on vide le paquet avant de le rebrasser
  function draw(deckId) {
    const list = decks[deckId];
    if (!list.length) return;
    let used = discard[deckId];
    if (used.length >= list.length) used = [];
    const available = list.map((_, i) => i).filter((i) => !used.includes(i));
    const idx = available[randomInt(available.length)];
    setDiscard({ ...discard, [deckId]: [...used, idx] });
    setCurrent({ deck: deckId, text: list[idx], key: Date.now() });
    sfx.flip();
    vibrate(20);
  }

  const deck = current ? DECKS[current.deck] : null;

  return (
    <>
      <div className="eventStage">
        {current ? (
          <div key={current.key} className="propEvent flipIn" style={{ "--ev": deck.color }}>
            <div className="propEventHead">
              {deck.icon} {deck.name[lang]}
            </div>
            <p>{current.text}</p>
          </div>
        ) : (
          <p className="muted center">{t("Touche un paquet pour piger une carte.", "Tap a deck to draw a card.")}</p>
        )}
      </div>

      <div className="deckPair">
        {Object.entries(DECKS).map(([id, d]) => (
          <div key={id} className="deckCol">
            <button className="propDeck" style={{ "--ev": d.color }} onClick={() => draw(id)}>
              <span>{d.icon}</span>
              <strong>{d.name[lang]}</strong>
              <small>
                {decks[id].length - (discard[id].length >= decks[id].length ? 0 : discard[id].length)}/{decks[id].length}
              </small>
            </button>
            <button className="linkButton small" onClick={() => setEditing(id)}>
              <Pencil size={12} /> {t("Modifier", "Edit")}
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="sheetBackdrop" onClick={() => setEditing(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>
                {DECKS[editing].icon} {DECKS[editing].name[lang]}
              </h2>
              <button className="iconButton" onClick={() => setEditing(null)}>
                <X size={22} />
              </button>
            </div>
            <p className="muted">{t("Recopie ici le texte de la carte qui te manque.", "Type in the text of the card you're missing.")}</p>
            <form
              className="addRow"
              onSubmit={(e) => {
                e.preventDefault();
                if (!input.trim()) return;
                setDecks({ ...decks, [editing]: [...decks[editing], input.trim()] });
                setInput("");
              }}
            >
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("Texte de la carte", "Card text")} />
              <button className="iconButton accentBg" type="submit">
                <Plus size={20} />
              </button>
            </form>
            <div className="editList">
              {decks[editing].map((text, i) => (
                <div className="editRow" key={`${i}-${text}`}>
                  <span>{text}</span>
                  <button className="iconButton soft" onClick={() => setDecks({ ...decks, [editing]: decks[editing].filter((_, j) => j !== i) })}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button className="linkButton" onClick={() => setDecks({ ...decks, [editing]: DECKS[editing].cards[lang] })}>
              <RotateCcw size={14} /> {t("Remettre les cartes d'origine", "Restore default cards")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DeedCard({ deed, t }) {
  const rentLabels =
    deed.kind === "station"
      ? [t("1 terminus", "1 station"), t("2 terminus", "2 stations"), t("3 terminus", "3 stations"), t("4 terminus", "4 stations")]
      : [t("Loyer", "Rent"), t("1 maison", "1 house"), t("2 maisons", "2 houses"), t("3 maisons", "3 houses"), t("4 maisons", "4 houses"), t("Hôtel", "Hotel")];
  return (
    <div className={`deedCard ${deed.mortgaged ? "mortgaged" : ""}`}>
      <div className="deedHead" style={{ background: deed.color }}>
        <small>{t("TITRE DE PROPRIÉTÉ", "TITLE DEED")}</small>
        <strong>{deed.name}</strong>
      </div>
      {deed.kind === "utility" ? (
        <p className="deedNote">{t("Loyer : 4 × le total des dés (10 × si les deux services appartiennent au même joueur).", "Rent: 4 × dice total (10 × if both utilities are owned by the same player).")}</p>
      ) : (
        <table>
          <tbody>
            {deed.rents.map((r, i) => (
              <tr key={i} className={deed.kind !== "station" && deed.houses === i ? "cur" : ""}>
                <td>{rentLabels[i]}</td>
                <td>{r} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="deedFoot">
        <span>
          {t("Prix", "Price")} {deed.price} $
        </span>
        {deed.house > 0 && (
          <span>
            {t("Maison", "House")} {deed.house} $
          </span>
        )}
        <span>
          {t("Hypothèque", "Mortgage")} {Math.round(deed.price / 2)} $
        </span>
      </div>
      {deed.mortgaged && <div className="mortgageStamp">{t("HYPOTHÉQUÉE", "MORTGAGED")}</div>}
    </div>
  );
}

function Deeds({ players, setPlayers }) {
  const { t } = useLang();
  const [deeds, setDeeds] = useStored("bgh2_prop_deeds", defaultDeeds);
  const [open, setOpen] = useState(null);
  const [edit, setEdit] = useState(null);
  const [payer, setPayer] = useState("");
  const [msg, setMsg] = useState("");
  const deed = deeds.find((d) => d.id === open);
  const update = (id, patch) => setDeeds(deeds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const ownerName = (id) => players.find((p) => String(p.id) === String(id))?.name;

  // Loyer à payer selon le nombre de maisons ou de terminus possédés
  const rentDue = useMemo(() => {
    if (!deed || deed.mortgaged || !deed.owner) return 0;
    if (deed.kind === "station") return deed.rents[Math.max(0, deeds.filter((d) => d.kind === "station" && String(d.owner) === String(deed.owner)).length - 1)];
    if (deed.kind === "utility") return 0;
    return deed.rents[deed.houses] || 0;
  }, [deed, deeds]);

  function payRent() {
    if (!payer || !rentDue || String(payer) === String(deed.owner)) return;
    setPlayers(
      players.map((p) => {
        if (String(p.id) === String(payer)) return { ...p, money: (p.money ?? 0) - rentDue };
        if (String(p.id) === String(deed.owner)) return { ...p, money: (p.money ?? 0) + rentDue };
        return p;
      })
    );
    setMsg(`${ownerName(payer)} → ${ownerName(deed.owner)} : ${rentDue} $`);
    sfx.good();
    vibrate(20);
  }

  return (
    <>
      <div className="deedGrid">
        {deeds.map((d) => (
          <button key={d.id} className={`deedMini ${d.owner ? "owned" : ""} ${d.mortgaged ? "mortgaged" : ""}`} onClick={() => { setOpen(d.id); setMsg(""); }}>
            <i style={{ background: d.color }} />
            <span>{d.name}</span>
            <small>{d.owner ? ownerName(d.owner) : `${d.price} $`}</small>
            {d.houses > 0 && <b className="houseBadge">{d.houses === 5 ? "🏨" : "🏠".repeat(d.houses)}</b>}
          </button>
        ))}
        <button
          className="deedMini add"
          onClick={() => setEdit({ name: "", color: "#16a34a", price: 200, rentsText: "16, 80, 220, 600, 800, 1000", house: 100 })}
        >
          <Plus size={18} /> {t("Nouveau titre", "New deed")}
        </button>
      </div>
      <button className="linkButton small" onClick={() => setDeeds(defaultDeeds())}>
        <RotateCcw size={12} /> {t("Remettre les titres d'exemple", "Restore sample deeds")}
      </button>

      {deed && (
        <div className="sheetBackdrop" onClick={() => setOpen(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>{t("Titre", "Deed")}</h2>
              <button className="iconButton" onClick={() => setOpen(null)}>
                <X size={22} />
              </button>
            </div>
            <DeedCard deed={deed} t={t} />
            <div className="transferRow">
              <span className="muted">{t("Propriétaire", "Owner")}</span>
              <select value={deed.owner ?? ""} onChange={(e) => update(deed.id, { owner: e.target.value || null })}>
                <option value="">{t("Banque (à vendre)", "Bank (for sale)")}</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {!deed.kind && (
              <div className="optionRow">
                <span className="muted">{t("Maisons", "Houses")}</span>
                <div className="segmented small">
                  {[0, 1, 2, 3, 4, 5].map((h) => (
                    <button key={h} className={deed.houses === h ? "active" : ""} onClick={() => update(deed.id, { houses: h })}>
                      {h === 5 ? "🏨" : h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button className={`toggleRow ${deed.mortgaged ? "on" : ""}`} onClick={() => update(deed.id, { mortgaged: !deed.mortgaged })}>
              <span>{t("Hypothéquée", "Mortgaged")}</span>
              <i className="switch" />
            </button>
            {deed.owner && rentDue > 0 && (
              <div className="transferRow">
                <select value={payer} onChange={(e) => setPayer(e.target.value)}>
                  <option value="">{t("Qui paie?", "Who pays?")}</option>
                  {players
                    .filter((p) => String(p.id) !== String(deed.owner))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <button className="bigAction compact" onClick={payRent} disabled={!payer}>
                  {t("Payer", "Pay")} {rentDue} $
                </button>
              </div>
            )}
            {msg && <div className="formInfo">{msg}</div>}
            <div className="actionRow">
              <button className="bigAction secondary" onClick={() => setEdit({ ...deed, rentsText: deed.rents.join(", ") })}>
                <Pencil size={16} /> {t("Modifier", "Edit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {edit && (
        <div className="sheetBackdrop" onClick={() => setEdit(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheetHeader">
              <h2>{edit.id ? t("Modifier le titre", "Edit deed") : t("Nouveau titre", "New deed")}</h2>
              <button className="iconButton" onClick={() => setEdit(null)}>
                <X size={22} />
              </button>
            </div>
            <p className="muted">{t("Recopie les infos de la carte qui te manque.", "Copy the info from your missing card.")}</p>
            <div className="authForm">
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder={t("Nom de la propriété", "Property name")} />
              <div className="colorDots big">
                {["#8b5a2b", "#7dd3fc", "#db2777", "#f97316", "#dc2626", "#eab308", "#16a34a", "#1e3a8a", "#111827", "#64748b"].map((c) => (
                  <i key={c} className={edit.color === c ? "active" : ""} style={{ background: c }} onClick={() => setEdit({ ...edit, color: c })} />
                ))}
              </div>
              <label className="fieldLabel">
                {t("Prix", "Price")}
                <input type="number" inputMode="numeric" value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} />
              </label>
              <label className="fieldLabel">
                {t("Loyers (terrain, 1 à 4 maisons, hôtel)", "Rents (site, 1-4 houses, hotel)")}
                <input value={edit.rentsText} onChange={(e) => setEdit({ ...edit, rentsText: e.target.value })} />
              </label>
              <label className="fieldLabel">
                {t("Prix d'une maison", "House price")}
                <input type="number" inputMode="numeric" value={edit.house} onChange={(e) => setEdit({ ...edit, house: Number(e.target.value) })} />
              </label>
              <button
                className="bigAction"
                onClick={() => {
                  const rents = edit.rentsText
                    .split(/[,\s]+/)
                    .map(Number)
                    .filter((n) => !Number.isNaN(n))
                    .slice(0, 6);
                  if (!edit.name.trim() || !rents.length) return;
                  const clean = { ...edit, name: edit.name.trim(), rents };
                  delete clean.rentsText;
                  if (edit.id) setDeeds(deeds.map((d) => (d.id === edit.id ? clean : d)));
                  else setDeeds([...deeds, { ...clean, id: `c${Date.now()}`, owner: null, mortgaged: false, houses: 0 }]);
                  setEdit(null);
                }}
              >
                {t("Enregistrer", "Save")}
              </button>
              {edit.id && (
                <button
                  className="linkButton danger"
                  onClick={() => {
                    setDeeds(deeds.filter((d) => d.id !== edit.id));
                    setEdit(null);
                    setOpen(null);
                  }}
                >
                  <Trash2 size={14} /> {t("Supprimer ce titre", "Delete this deed")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PropertyKit({ players, setPlayers }) {
  const { t } = useLang();
  const [mode, setMode] = useState("cards");
  return (
    <div className="tool propertyKit">
      <div className="segmented">
        <button className={mode === "cards" ? "active" : ""} onClick={() => setMode("cards")}>
          {t("Cartes événement", "Event cards")}
        </button>
        <button className={mode === "deeds" ? "active" : ""} onClick={() => setMode("deeds")}>
          {t("Titres", "Deeds")}
        </button>
      </div>
      {mode === "cards" ? <EventDecks /> : <Deeds players={players} setPlayers={setPlayers} />}
    </div>
  );
}
