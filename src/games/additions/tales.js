const text = (fr, en) => ({ fr, en });
const choice = (fr, en, to, extra = {}) => ({
  text: text(fr, en),
  to,
  ...extra,
});
export const TALES = [
  {
    id: "lighthouse",
    title: text("Le phare oublié", "The Forgotten Lighthouse"),
    intro: text(
      "Une tempête approche. Rallume le phare avant que le navire de ravitaillement atteigne les récifs.",
      "A storm is coming. Relight the lighthouse before the supply ship reaches the reef.",
    ),
    nodes: {
      start: {
        text: text(
          "Au port, la gardienne te confie une lanterne. Le sentier côtier est inondé; un ancien tunnel passe sous la falaise.",
          "At the harbour, the keeper gives you a lantern. The coastal path is flooded; an old tunnel passes under the cliff.",
        ),
        choices: [
          choice("Prendre le sentier", "Take the path", "cliff"),
          choice("Entrer dans le tunnel", "Enter the tunnel", "tunnel"),
        ],
      },
      cliff: {
        text: text(
          "Une passerelle s’est effondrée. Tu peux sauter le passage ou descendre vers une barque.",
          "A footbridge has collapsed. You can jump the gap or climb down to a boat.",
        ),
        choices: [
          choice("Sauter : réussir sur 3–6", "Jump: succeed on 3–6", "door", {
            test: 3,
            fail: "fall",
          }),
          choice("Descendre vers la barque", "Climb down to the boat", "boat"),
        ],
      },
      fall: {
        text: text(
          "Tu glisses et te blesses, mais une corniche te retient. La barque est juste en dessous.",
          "You slip and hurt yourself, but a ledge catches you. The boat is just below.",
        ),
        damage: 1,
        choices: [choice("Rejoindre la barque", "Reach the boat", "boat")],
      },
      boat: {
        text: text(
          "Dans la barque, tu trouves une corde. Tu longes la falaise et atteins le débarcadère du phare.",
          "You find a rope in the boat. You follow the cliff and reach the lighthouse landing.",
        ),
        item: "rope",
        choices: [choice("Monter au phare", "Climb to the lighthouse", "door")],
      },
      tunnel: {
        text: text(
          "La lanterne éclaire deux galeries. Une flèche gravée pointe à gauche; un bruit de cloche vient de droite.",
          "The lantern lights two passages. A carved arrow points left; a bell sounds to the right.",
        ),
        choices: [
          choice("Suivre la flèche", "Follow the arrow", "cache"),
          choice("Suivre la cloche", "Follow the bell", "bell"),
        ],
      },
      cache: {
        text: text(
          "Une boîte contient une clé de cuivre. Un escalier débouche au pied du phare.",
          "A box contains a copper key. Stairs lead to the foot of the lighthouse.",
        ),
        item: "key",
        choices: [choice("Monter l’escalier", "Climb the stairs", "door")],
      },
      bell: {
        text: text(
          "Une cloche flotte dans un bassin agité. Une vague te projette contre le mur. Tu regagnes la sortie.",
          "A bell floats in a turbulent pool. A wave throws you against the wall. You find your way out.",
        ),
        damage: 1,
        choices: [
          choice("Sortir vers le phare", "Exit toward the lighthouse", "door"),
        ],
      },
      door: {
        text: text(
          "La porte est verrouillée. Une fenêtre est ouverte au-dessus. La gardienne avait parlé d’une porte de service côté mer.",
          "The door is locked. An upper window is open. The keeper mentioned a service entrance facing the sea.",
        ),
        choices: [
          choice("Utiliser la clé", "Use the key", "workshop", {
            requires: "key",
          }),
          choice("Grimper avec la corde", "Climb using the rope", "workshop", {
            requires: "rope",
          }),
          choice(
            "Chercher la porte de service",
            "Find the service door",
            "service",
          ),
        ],
      },
      service: {
        text: text(
          "La porte de service résiste. Une inscription dit : « Tourne vers la mer, puis lève. »",
          "The service door is stuck. An inscription reads: “Turn toward the sea, then lift.”",
        ),
        choices: [
          choice("Suivre l’inscription", "Follow the inscription", "workshop"),
          choice("Forcer la porte", "Force the door", "bruise"),
        ],
      },
      bruise: {
        text: text(
          "La poignée casse et tu te cognes, mais la porte s’ouvre.",
          "The handle breaks and you stumble, but the door opens.",
        ),
        damage: 1,
        choices: [choice("Entrer", "Enter", "workshop")],
      },
      workshop: {
        text: text(
          "Dans l’atelier, une bouteille d’huile porte l’étiquette « brûleur ». Tu la prends. L’escalier de la tour tremble sous le vent.",
          "In the workshop, an oil bottle is labelled “burner.” You take it. The tower stairs shake in the wind.",
        ),
        item: "oil",
        choices: [
          choice("Monter lentement", "Climb carefully", "lamp"),
          choice("Courir : réussir sur 4–6", "Run: succeed on 4–6", "lamp", {
            test: 4,
            fail: "stairs",
          }),
        ],
      },
      stairs: {
        text: text(
          "Une marche se brise. Tu perds pied, mais agrippes la rampe.",
          "A step breaks. You slip but grab the rail.",
        ),
        damage: 1,
        choices: [choice("Continuer prudemment", "Continue carefully", "lamp")],
      },
      lamp: {
        text: text(
          "La lentille est intacte. Il faut verser l’huile, ouvrir la ventilation et allumer la mèche.",
          "The lens is intact. Pour the oil, open the vent and light the wick.",
        ),
        choices: [
          choice(
            "Préparer le brûleur et l’allumer",
            "Prepare and light the burner",
            "win",
            { requires: "oil" },
          ),
          choice(
            "Allumer sans ouvrir la ventilation",
            "Light it without opening the vent",
            "smoke",
          ),
        ],
      },
      smoke: {
        text: text(
          "La fumée te fait reculer. Tu ouvres enfin la ventilation et peux réessayer.",
          "Smoke makes you step back. You open the vent and can try again.",
        ),
        damage: 1,
        choices: [choice("Allumer la mèche", "Light the wick", "win")],
      },
      win: {
        text: text(
          "Le faisceau traverse la pluie. Le navire change de cap à temps. Au matin, la gardienne te remet une médaille en forme de phare.",
          "The beam cuts through the rain. The ship changes course in time. At dawn, the keeper gives you a lighthouse medal.",
        ),
        end: true,
      },
    },
  },
  {
    id: "signal",
    title: text("Le signal des étoiles", "The Star Signal"),
    intro: text(
      "Une station isolée a cessé de répondre. À bord de ta navette, tu dois retrouver son équipage et rétablir la balise.",
      "An isolated station has stopped responding. From your shuttle, find the crew and restore the beacon.",
    ),
    nodes: {
      start: {
        text: text(
          "Tu arrives devant le sas. Le terminal n’a plus d’énergie. Un panneau extérieur porte une poignée manuelle.",
          "You reach the airlock. The terminal has no power. An outer panel has a manual handle.",
        ),
        choices: [
          choice("Ouvrir le panneau", "Open the panel", "panel"),
          choice("Chercher un autre accès", "Find another entrance", "cargo"),
        ],
      },
      panel: {
        text: text(
          "Deux leviers sont étiquetés « sas » et « purge ».",
          "Two levers are labelled “airlock” and “purge.”",
        ),
        choices: [
          choice("Actionner le sas", "Pull the airlock lever", "hall"),
          choice("Actionner la purge", "Pull the purge lever", "vent"),
        ],
      },
      vent: {
        text: text(
          "Un jet d’air te repousse. Ta combinaison amortit le choc. Tu reviens au bon levier.",
          "A burst of air pushes you away. Your suit cushions the impact. You return to the correct lever.",
        ),
        damage: 1,
        choices: [choice("Ouvrir le sas", "Open the airlock", "hall")],
      },
      cargo: {
        text: text(
          "Un robot de manutention bloque la trappe. Il attend une commande.",
          "A cargo robot blocks the hatch. It is waiting for a command.",
        ),
        choices: [
          choice("Dire « retour au quai »", "Say “return to dock”", "hall"),
          choice(
            "Passer par-dessus : réussir sur 3–6",
            "Climb over: succeed on 3–6",
            "hall",
            { test: 3, fail: "bump" },
          ),
        ],
      },
      bump: {
        text: text(
          "Le robot se remet en marche et te heurte. Tu atteins tout de même la trappe.",
          "The robot starts moving and bumps you. You still reach the hatch.",
        ),
        damage: 1,
        choices: [choice("Entrer", "Enter", "hall")],
      },
      hall: {
        text: text(
          "Une flèche mène à l’infirmerie; une autre au laboratoire. Le haut-parleur grésille : « Nous sommes au refuge. »",
          "One arrow leads to the infirmary; another to the lab. The speaker crackles: “We are in the shelter.”",
        ),
        choices: [
          choice("Visiter l’infirmerie", "Visit the infirmary", "medical"),
          choice("Visiter le laboratoire", "Visit the lab", "lab"),
        ],
      },
      medical: {
        text: text(
          "Un kit de secours restaure ta combinaison. Tu trouves aussi une batterie de rechange.",
          "A repair kit restores your suit. You also find a spare battery.",
        ),
        heal: 1,
        item: "battery",
        choices: [
          choice("Rejoindre le refuge", "Reach the shelter", "shelter"),
        ],
      },
      lab: {
        text: text(
          "Un scientifique a laissé une note : « Le cristal de la balise est dans le coffre. Code : nombre de lunes de la Terre. »",
          "A scientist left a note: “The beacon crystal is in the safe. Code: the number of Earth’s moons.”",
        ),
        choices: [
          choice("Entrer 1", "Enter 1", "crystal"),
          choice("Entrer 2", "Enter 2", "alarm"),
        ],
      },
      alarm: {
        text: text(
          "Une alarme se déclenche et ferme une cloison. Tu te faufiles avant sa fermeture, en abîmant ta combinaison.",
          "An alarm closes a partition. You squeeze through before it shuts, damaging your suit.",
        ),
        damage: 1,
        choices: [
          choice("Rejoindre le refuge", "Reach the shelter", "shelter"),
        ],
      },
      crystal: {
        text: text(
          "Le coffre s’ouvre. Tu prends le cristal et suis les lumières de secours jusqu’au refuge.",
          "The safe opens. You take the crystal and follow emergency lights to the shelter.",
        ),
        item: "crystal",
        choices: [choice("Rejoindre l’équipage", "Reach the crew", "shelter")],
      },
      shelter: {
        text: text(
          "L’équipage est sain et sauf. La commandante te donne une carte d’accès et explique que le relais du toit est débranché.",
          "The crew is safe. The commander gives you an access card and explains that the roof relay is disconnected.",
        ),
        item: "access",
        choices: [
          choice(
            "Monter par l’ascenseur de secours",
            "Take the emergency lift",
            "roof",
            { requires: "battery" },
          ),
          choice("Monter par l’échelle", "Climb the ladder", "ladder"),
        ],
      },
      ladder: {
        text: text(
          "L’échelle monte dans un puits étroit. Une pièce de métal flotte en apesanteur.",
          "The ladder climbs through a narrow shaft. A metal fragment floats in zero gravity.",
        ),
        choices: [
          choice("La contourner doucement", "Move around it carefully", "roof"),
          choice(
            "Se propulser vite : réussir sur 4–6",
            "Push off quickly: succeed on 4–6",
            "roof",
            { test: 4, fail: "scrape" },
          ),
        ],
      },
      scrape: {
        text: text(
          "Le fragment raye ta combinaison. Tu atteins le toit.",
          "The fragment scratches your suit. You reach the roof.",
        ),
        damage: 1,
        choices: [choice("Examiner le relais", "Inspect the relay", "roof")],
      },
      roof: {
        text: text(
          "Le câble est débranché et le cristal est fissuré. Un cristal de secours se trouve derrière le panneau d’accès.",
          "The cable is disconnected and the crystal is cracked. A spare crystal is behind the access panel.",
        ),
        choices: [
          choice(
            "Installer ton cristal et rebrancher",
            "Install your crystal and reconnect",
            "win",
            { requires: "crystal" },
          ),
          choice(
            "Ouvrir le panneau avec la carte",
            "Open the panel with the access card",
            "spare",
            { requires: "access" },
          ),
        ],
      },
      spare: {
        text: text(
          "Tu remplaces le cristal et verrouilles le câble. La balise s’allume.",
          "You replace the crystal and lock the cable. The beacon lights up.",
        ),
        choices: [choice("Envoyer le signal", "Send the signal", "win")],
      },
      win: {
        text: text(
          "Les secours répondent. Tu ramènes l’équipage à bord de ta navette pendant que le signal guide le vaisseau de relève.",
          "Rescue answers. You bring the crew aboard your shuttle while the signal guides the relief ship.",
        ),
        end: true,
      },
    },
  },
];
