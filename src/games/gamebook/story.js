// « La Crypte du Roi-Corbeau » — aventure originale dont tu es le héros.
// Chaque section : texte, choix, effets, combat ou test (chance / habileté).
//   effects : { end, gold, luck, skill, prov, add: "objet", remove: "objet" }
//   choices : [{ text, to, requires?: "objet", cost?: or }]
//   combat  : { name, skill, stamina, win, flee? }
//   test    : { type: "luck" | "skill", success, fail }
//   end     : "win" | "death"

export const ITEMS = {
  lantern: { fr: "Lanterne", en: "Lantern", icon: "🏮" },
  rope: { fr: "Corde", en: "Rope", icon: "🪢" },
  silverKey: { fr: "Clé d'argent", en: "Silver key", icon: "🗝️" },
  sword: { fr: "Épée runique (+1 habileté)", en: "Rune sword (+1 skill)", icon: "🗡️" },
  amulet: { fr: "Amulette de plume", en: "Feather amulet", icon: "🪶" },
  holyWater: { fr: "Eau bénite", en: "Holy water", icon: "💧" },
  map: { fr: "Vieille carte", en: "Old map", icon: "🗺️" }
};

export const STORY = {
  title: { fr: "La Crypte du Roi-Corbeau", en: "The Crypt of the Raven King" },
  intro: {
    fr: "Depuis trois lunes, les corbeaux ne quittent plus le village de Brumeval. Les anciens murmurent que le Roi-Corbeau, un sorcier enterré sous la colline, s'est réveillé. Ce soir, c'est toi qui descends dans sa crypte.",
    en: "For three moons, the ravens have not left the village of Mistvale. The elders whisper that the Raven King, a sorcerer buried beneath the hill, has awoken. Tonight, it is you who descends into his crypt."
  },
  start: 1,
  sections: {
    1: {
      text: {
        fr: "La place du village est déserte. Sur le puits, une vieille femme t'attend. « Prends ce que tu peux payer, héros. La crypte ne pardonne pas. » Sur sa table : une lanterne, une corde et une petite fiole d'eau bénite. Chaque objet coûte 2 pièces d'or.",
        en: "The village square is empty. On the well, an old woman waits. \"Take what you can afford, hero. The crypt forgives nothing.\" On her table: a lantern, a rope and a small vial of holy water. Each costs 2 gold."
      },
      shop: [
        { item: "lantern", cost: 2 },
        { item: "rope", cost: 2 },
        { item: "holyWater", cost: 2 }
      ],
      choices: [{ text: { fr: "Partir vers la colline", en: "Head for the hill" }, to: 2 }]
    },
    2: {
      text: {
        fr: "Le sentier traverse une forêt de sapins noirs. Des yeux luisent entre les troncs. À gauche, le chemin descend vers un ruisseau ; à droite, il grimpe droit vers la colline à travers les ronces.",
        en: "The trail crosses a forest of black firs. Eyes glint between the trunks. To the left, the path runs down to a stream; to the right, it climbs straight to the hill through the brambles."
      },
      choices: [
        { text: { fr: "Descendre vers le ruisseau", en: "Go down to the stream" }, to: 3 },
        { text: { fr: "Couper à travers les ronces", en: "Cut through the brambles" }, to: 4 }
      ]
    },
    3: {
      text: {
        fr: "Au bord du ruisseau, un loup gris boit. Il relève la tête, babines retroussées. Il n'a pas l'intention de te laisser passer.",
        en: "At the edge of the stream, a grey wolf is drinking. It raises its head, lips curled. It has no intention of letting you pass."
      },
      combat: { name: { fr: "Loup gris", en: "Grey wolf" }, skill: 6, stamina: 6, win: 5, flee: 4 }
    },
    4: {
      text: {
        fr: "Les ronces déchirent tes vêtements et ta peau. Tu perds 2 points d'endurance, mais tu arrives au pied de la colline plus vite que prévu.",
        en: "The brambles tear your clothes and skin. You lose 2 stamina, but you reach the foot of the hill sooner than expected."
      },
      effects: { end: -2 },
      choices: [{ text: { fr: "Continuer", en: "Continue" }, to: 6 }]
    },
    5: {
      text: {
        fr: "Le loup s'enfuit en gémissant. Près de l'eau, sous une pierre plate, tu trouves une bourse oubliée : 3 pièces d'or et une vieille carte griffonnée qui montre l'intérieur de la crypte.",
        en: "The wolf flees, whimpering. By the water, under a flat stone, you find a forgotten pouch: 3 gold and an old scribbled map of the crypt's interior."
      },
      effects: { gold: 3, add: "map" },
      choices: [{ text: { fr: "Monter vers la colline", en: "Climb to the hill" }, to: 6 }]
    },
    6: {
      text: {
        fr: "L'entrée de la crypte est une gueule de pierre sculptée en forme de bec. Des centaines de corbeaux t'observent en silence. L'escalier s'enfonce dans le noir complet.",
        en: "The crypt's entrance is a stone maw carved like a beak. Hundreds of ravens watch you in silence. The stairs sink into total darkness."
      },
      choices: [
        { text: { fr: "Allumer la lanterne et descendre", en: "Light the lantern and descend" }, to: 7, requires: "lantern" },
        { text: { fr: "Descendre à tâtons dans le noir", en: "Feel your way down in the dark" }, to: 8 }
      ]
    },
    7: {
      text: {
        fr: "La lumière révèle une marche piégée que tu enjambes sans peine. En bas, un couloir se divise : à gauche, une porte gravée de plumes ; à droite, un bruit d'eau qui coule.",
        en: "The light reveals a trapped step that you easily step over. Below, a corridor splits: to the left, a door carved with feathers; to the right, the sound of running water."
      },
      choices: [
        { text: { fr: "La porte aux plumes", en: "The feather door" }, to: 10 },
        { text: { fr: "Le bruit d'eau", en: "The sound of water" }, to: 11 }
      ]
    },
    8: {
      text: {
        fr: "Dans le noir, ton pied se pose sur une marche qui s'enfonce avec un déclic. Des lames jaillissent du mur! Tente ta chance…",
        en: "In the dark, your foot lands on a step that sinks with a click. Blades spring from the wall! Test your luck…"
      },
      test: { type: "luck", success: 9, fail: 12 }
    },
    9: {
      text: {
        fr: "Tu te jettes au sol juste à temps. Les lames sifflent au-dessus de ta tête. Tu te relèves, le cœur battant, au bas de l'escalier. Un couloir se divise devant toi.",
        en: "You throw yourself down just in time. The blades whistle over your head. You get up, heart pounding, at the bottom of the stairs. A corridor splits before you."
      },
      choices: [
        { text: { fr: "Tourner à gauche", en: "Turn left" }, to: 10 },
        { text: { fr: "Tourner à droite", en: "Turn right" }, to: 11 }
      ]
    },
    10: {
      text: {
        fr: "La porte aux plumes est verrouillée. Une voix sèche sort de la pierre : « Je vole sans ailes, je pleure sans yeux. Qui suis-je? »",
        en: "The feather door is locked. A dry voice comes from the stone: \"I fly without wings, I cry without eyes. What am I?\""
      },
      choices: [
        { text: { fr: "« Le vent »", en: "\"The wind\"" }, to: 14 },
        { text: { fr: "« Un nuage »", en: "\"A cloud\"" }, to: 13 },
        { text: { fr: "« Un fantôme »", en: "\"A ghost\"" }, to: 14 }
      ]
    },
    11: {
      text: {
        fr: "Une rivière souterraine coupe la salle. De l'autre côté brille quelque chose de métallique. Le courant est violent.",
        en: "An underground river cuts through the room. On the other side, something metallic gleams. The current is strong."
      },
      choices: [
        { text: { fr: "Lancer la corde vers un pilier et traverser", en: "Throw the rope to a pillar and cross" }, to: 15, requires: "rope" },
        { text: { fr: "Traverser à la nage", en: "Swim across" }, to: 16 },
        { text: { fr: "Revenir vers la porte aux plumes", en: "Go back to the feather door" }, to: 10 }
      ]
    },
    12: {
      text: {
        fr: "Une lame t'entaille l'épaule. Tu perds 3 points d'endurance et tu roules jusqu'au bas de l'escalier. Un couloir se divise devant toi.",
        en: "A blade slices your shoulder. You lose 3 stamina and tumble to the bottom of the stairs. A corridor splits before you."
      },
      effects: { end: -3 },
      choices: [
        { text: { fr: "Tourner à gauche", en: "Turn left" }, to: 10 },
        { text: { fr: "Tourner à droite", en: "Turn right" }, to: 11 }
      ]
    },
    13: {
      text: {
        fr: "« Un nuage… » Les gravures s'illuminent et la porte pivote. Derrière, sur un autel, repose une amulette faite d'une seule plume noire. En la touchant, tu sens ta chance grandir (+1 chance).",
        en: "\"A cloud…\" The carvings glow and the door swings open. Behind it, on an altar, lies an amulet made of a single black feather. Touching it, you feel your luck grow (+1 luck)."
      },
      effects: { add: "amulet", luck: 1 },
      choices: [{ text: { fr: "Continuer plus loin", en: "Go deeper" }, to: 17 }]
    },
    14: {
      text: {
        fr: "« Faux », siffle la voix. Une nuée de corbeaux spectraux jaillit du mur et te lacère avant de disparaître. Tu perds 3 points d'endurance. La porte reste close ; il ne reste que le chemin de l'eau.",
        en: "\"Wrong,\" hisses the voice. A swarm of spectral ravens bursts from the wall and slashes you before vanishing. You lose 3 stamina. The door stays shut; only the water path remains."
      },
      effects: { end: -3 },
      choices: [{ text: { fr: "Aller vers le bruit d'eau", en: "Go towards the water" }, to: 11 }]
    },
    15: {
      text: {
        fr: "Solidement accroché, tu traverses sans effort. L'objet brillant est une épée gravée de runes, plantée dans la pierre. Elle glisse dans ta main comme si elle t'attendait (+1 habileté en combat).",
        en: "Firmly tied, you cross with ease. The gleaming object is a rune-carved sword stuck in the stone. It slides into your hand as if it was waiting for you (+1 skill in combat)."
      },
      effects: { add: "sword" },
      choices: [{ text: { fr: "Continuer plus loin", en: "Go deeper" }, to: 17 }]
    },
    16: {
      text: {
        fr: "Le courant t'emporte. Tu dois lutter de toutes tes forces pour atteindre l'autre rive. Teste ton habileté…",
        en: "The current sweeps you away. You must fight with all your strength to reach the other bank. Test your skill…"
      },
      test: { type: "skill", success: 15, fail: 18 }
    },
    17: {
      text: {
        fr: "Tu arrives dans une vaste salle aux murs couverts d'os. Au plafond, une araignée géante aux pattes d'obsidienne descend lentement vers toi.",
        en: "You enter a vast hall with walls covered in bones. From the ceiling, a giant spider with obsidian legs slowly descends towards you."
      },
      combat: { name: { fr: "Araignée d'obsidienne", en: "Obsidian spider" }, skill: 7, stamina: 8, win: 19 }
    },
    18: {
      text: {
        fr: "Tu es rejeté sur la rive, trempé et épuisé (-4 endurance). Tu n'as pas pu atteindre l'épée. Un passage étroit continue vers le fond de la crypte.",
        en: "You are thrown back onto the bank, soaked and exhausted (-4 stamina). You couldn't reach the sword. A narrow passage continues deeper into the crypt."
      },
      effects: { end: -4 },
      choices: [{ text: { fr: "Suivre le passage", en: "Follow the passage" }, to: 17 }]
    },
    19: {
      text: {
        fr: "L'araignée s'effondre. Dans sa toile, un squelette serre encore une clé d'argent et une bourse (4 pièces d'or). Au fond de la salle, deux chemins : un escalier qui descend, et une grille rouillée.",
        en: "The spider collapses. In its web, a skeleton still clutches a silver key and a pouch (4 gold). At the back of the hall, two ways: stairs going down, and a rusty gate."
      },
      effects: { add: "silverKey", gold: 4 },
      choices: [
        { text: { fr: "Prendre l'escalier", en: "Take the stairs" }, to: 20 },
        { text: { fr: "Forcer la grille rouillée", en: "Force the rusty gate" }, to: 21 },
        { text: { fr: "Suivre ta vieille carte", en: "Follow your old map" }, to: 22, requires: "map" }
      ]
    },
    20: {
      text: {
        fr: "L'escalier mène à une salle où un gardien squelette, armé d'une hallebarde, garde une grande porte noire.",
        en: "The stairs lead to a room where a skeleton guardian, armed with a halberd, guards a great black door."
      },
      combat: { name: { fr: "Gardien squelette", en: "Skeleton guardian" }, skill: 8, stamina: 6, win: 23 }
    },
    21: {
      text: {
        fr: "La grille cède dans un fracas qui résonne dans toute la crypte. Des pierres tombent du plafond! Tente ta chance…",
        en: "The gate gives way with a crash that echoes through the whole crypt. Stones fall from the ceiling! Test your luck…"
      },
      test: { type: "luck", success: 22, fail: 24 }
    },
    22: {
      text: {
        fr: "Un passage secret te mène directement devant la grande porte noire, en évitant le gardien. Tu peux même prendre le temps de souffler (+2 endurance).",
        en: "A secret passage leads you straight to the great black door, avoiding the guardian. You even have time to catch your breath (+2 stamina)."
      },
      effects: { end: 2 },
      choices: [{ text: { fr: "Approcher de la porte", en: "Approach the door" }, to: 23 }]
    },
    23: {
      text: {
        fr: "La grande porte noire porte une serrure en forme de tête de corbeau. Derrière, tu entends un rire glacial.",
        en: "The great black door has a lock shaped like a raven's head. Behind it, you hear an icy laugh."
      },
      choices: [
        { text: { fr: "Ouvrir avec la clé d'argent", en: "Open with the silver key" }, to: 25, requires: "silverKey" },
        { text: { fr: "Enfoncer la porte", en: "Break down the door" }, to: 26 }
      ]
    },
    24: {
      text: {
        fr: "Une pierre te frappe à la tête (-4 endurance). Étourdi, tu finis par trouver un passage vers une grande porte noire.",
        en: "A stone strikes your head (-4 stamina). Dazed, you eventually find a passage to a great black door."
      },
      effects: { end: -4 },
      choices: [{ text: { fr: "Approcher de la porte", en: "Approach the door" }, to: 23 }]
    },
    25: {
      text: {
        fr: "La clé tourne sans bruit. Tu entres par surprise : le Roi-Corbeau, spectre drapé de plumes, se retourne trop tard. Tu frappes le premier (il perd 2 points d'endurance avant le combat).",
        en: "The key turns silently. You enter by surprise: the Raven King, a wraith draped in feathers, turns too late. You strike first (he loses 2 stamina before the fight)."
      },
      choices: [{ text: { fr: "Affronter le Roi-Corbeau!", en: "Face the Raven King!" }, to: 27, bossHandicap: 2 }]
    },
    26: {
      text: {
        fr: "Il te faut trois coups d'épaule pour enfoncer la porte (-2 endurance). Le Roi-Corbeau t'attend, les bras levés, entouré d'un tourbillon de plumes.",
        en: "It takes three shoulder blows to break down the door (-2 stamina). The Raven King awaits, arms raised, surrounded by a whirlwind of feathers."
      },
      effects: { end: -2 },
      choices: [{ text: { fr: "Affronter le Roi-Corbeau!", en: "Face the Raven King!" }, to: 27 }]
    },
    27: {
      text: {
        fr: "« Mortel, tu nourriras mes corbeaux! » Le spectre fond sur toi. Si tu as de l'eau bénite, tu peux la lancer avant le combat.",
        en: "\"Mortal, you shall feed my ravens!\" The wraith swoops at you. If you have holy water, you can throw it before the fight."
      },
      choices: [
        { text: { fr: "Lancer l'eau bénite", en: "Throw the holy water" }, to: 28, requires: "holyWater" },
        { text: { fr: "Combattre!", en: "Fight!" }, to: 29 }
      ]
    },
    28: {
      text: {
        fr: "L'eau bénite éclate sur le spectre qui hurle et se tord. Il est affaibli (-3 habileté pour lui pendant le combat).",
        en: "The holy water bursts on the wraith, which howls and writhes. It is weakened (-3 skill for the fight)."
      },
      effects: { remove: "holyWater" },
      choices: [{ text: { fr: "Combattre!", en: "Fight!" }, to: 29, bossWeakened: 3 }]
    },
    29: {
      text: {
        fr: "Le Roi-Corbeau tourbillonne autour de toi, ses griffes de plumes tranchantes comme des rasoirs.",
        en: "The Raven King whirls around you, his feather claws sharp as razors."
      },
      combat: { name: { fr: "Le Roi-Corbeau", en: "The Raven King" }, skill: 9, stamina: 10, win: 30, boss: true }
    },
    30: {
      text: {
        fr: "Dans un dernier cri, le Roi-Corbeau éclate en mille plumes qui retombent en cendres. Au-dessus de la colline, les corbeaux s'envolent enfin. Brumeval est libéré, et ton nom sera chanté pendant des générations. VICTOIRE!",
        en: "With a final cry, the Raven King bursts into a thousand feathers that fall as ash. Above the hill, the ravens finally fly away. Mistvale is free, and your name will be sung for generations. VICTORY!"
      },
      end: "win"
    }
  }
};
