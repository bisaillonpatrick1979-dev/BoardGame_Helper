// Thèmes des mots cachés (français et anglais).
// Chaque thème : un identifiant, un emoji, un nom et une liste de mots (accents permis :
// la grille n'utilise que A à Z). Mots de 3 à 12 lettres, sans espace.

export const WORD_THEMES = {
  fr: [
    { id: "animaux", emoji: "🦊", name: "Animaux", words: ["Renard", "Castor", "Orignal", "Écureuil", "Hibou", "Loutre", "Ours", "Lynx", "Raton", "Mouffette", "Caribou", "Loup", "Lièvre", "Marmotte", "Hérisson", "Tortue", "Chevreuil", "Porc-épic"] },
    { id: "fruits", emoji: "🍓", name: "Fruits", words: ["Pomme", "Poire", "Fraise", "Bleuet", "Framboise", "Cerise", "Banane", "Mangue", "Ananas", "Citron", "Orange", "Kiwi", "Melon", "Raisin", "Prune", "Pêche", "Canneberge", "Abricot"] },
    { id: "sports", emoji: "🏒", name: "Sports", words: ["Hockey", "Soccer", "Tennis", "Baseball", "Golf", "Natation", "Curling", "Rugby", "Boxe", "Judo", "Escalade", "Cyclisme", "Ski", "Patinage", "Volleyball", "Basketball", "Karaté", "Crosse"] },
    { id: "pays", emoji: "🌍", name: "Pays", words: ["Canada", "Mexique", "France", "Japon", "Brésil", "Italie", "Espagne", "Maroc", "Égypte", "Chine", "Inde", "Pérou", "Norvège", "Suisse", "Irlande", "Australie", "Portugal", "Sénégal"] },
    { id: "canada", emoji: "🍁", name: "Québec et Canada", words: ["Érable", "Poutine", "Tuque", "Québec", "Alberta", "Ontario", "Yukon", "Nunavut", "Huard", "Castor", "Rocheuses", "Toronto", "Calgary", "Montréal", "Gaspésie", "Tourtière", "Cabane", "Hockey"] },
    { id: "cuisine", emoji: "🍳", name: "Cuisine", words: ["Casserole", "Poêle", "Fouet", "Farine", "Beurre", "Sucre", "Recette", "Four", "Couteau", "Cuillère", "Omelette", "Soupe", "Gâteau", "Tarte", "Épices", "Sauce", "Crêpe", "Muffin"] },
    { id: "chantier", emoji: "🔨", name: "Construction", words: ["Marteau", "Clou", "Scie", "Niveau", "Perceuse", "Échelle", "Bardeau", "Solin", "Soffite", "Gouttière", "Toiture", "Brique", "Béton", "Poutre", "Truelle", "Couvreur", "Revêtement", "Chantier"] },
    { id: "hiver", emoji: "❄️", name: "Hiver", words: ["Froid", "Flocon", "Tuque", "Mitaine", "Foulard", "Glace", "Patin", "Traîneau", "Igloo", "Verglas", "Tempête", "Poudrerie", "Motoneige", "Raquette", "Pelle", "Givre", "Glaçon", "Congère"] },
    { id: "espace", emoji: "🚀", name: "Espace", words: ["Planète", "Étoile", "Comète", "Galaxie", "Fusée", "Lune", "Soleil", "Mars", "Vénus", "Saturne", "Jupiter", "Orbite", "Cratère", "Astronaute", "Satellite", "Météorite", "Éclipse", "Nébuleuse"] },
    { id: "musique", emoji: "🎸", name: "Musique", words: ["Guitare", "Piano", "Violon", "Tambour", "Flûte", "Harpe", "Trompette", "Batterie", "Accordéon", "Chanson", "Rythme", "Mélodie", "Concert", "Chorale", "Note", "Opéra", "Banjo", "Saxophone"] },
    { id: "corps", emoji: "💪", name: "Corps humain", words: ["Tête", "Épaule", "Genou", "Cheville", "Coude", "Poignet", "Cerveau", "Coeur", "Poumon", "Oreille", "Nez", "Bouche", "Menton", "Orteil", "Sourcil", "Estomac", "Squelette", "Muscle"] },
    { id: "mer", emoji: "🐳", name: "Mer et océan", words: ["Baleine", "Dauphin", "Requin", "Pieuvre", "Méduse", "Homard", "Crabe", "Phoque", "Morue", "Saumon", "Corail", "Algue", "Vague", "Marée", "Plage", "Phare", "Coquillage", "Étoile"] },
    { id: "metiers", emoji: "👷", name: "Métiers", words: ["Pompier", "Médecin", "Plombier", "Menuisier", "Couvreur", "Électricien", "Boulanger", "Facteur", "Policier", "Pilote", "Dentiste", "Fermier", "Soudeur", "Peintre", "Mécanicien", "Architecte", "Infirmier", "Boucher"] },
    { id: "jeux", emoji: "🎲", name: "Jeux", words: ["Cartes", "Dés", "Échecs", "Dames", "Domino", "Bingo", "Pion", "Plateau", "Poker", "Casse-tête", "Toupie", "Billes", "Marelle", "Quilles", "Bataille", "Solitaire", "Joker", "Roi"] },
    { id: "meteo", emoji: "⛈️", name: "Météo", words: ["Pluie", "Orage", "Tonnerre", "Éclair", "Nuage", "Brume", "Grêle", "Vent", "Soleil", "Tornade", "Ouragan", "Averse", "Canicule", "Humidité", "Neige", "Brouillard", "Arc-en-ciel", "Rosée"] }
  ],
  en: [
    { id: "animals", emoji: "🦊", name: "Animals", words: ["Fox", "Beaver", "Moose", "Squirrel", "Owl", "Otter", "Bear", "Lynx", "Raccoon", "Skunk", "Caribou", "Wolf", "Hare", "Groundhog", "Hedgehog", "Turtle", "Deer", "Porcupine"] },
    { id: "fruits", emoji: "🍓", name: "Fruits", words: ["Apple", "Pear", "Strawberry", "Blueberry", "Raspberry", "Cherry", "Banana", "Mango", "Papaya", "Lemon", "Orange", "Kiwi", "Melon", "Grape", "Plum", "Peach", "Cranberry", "Apricot"] },
    { id: "sports", emoji: "🏒", name: "Sports", words: ["Hockey", "Soccer", "Tennis", "Baseball", "Golf", "Swimming", "Curling", "Rugby", "Boxing", "Judo", "Climbing", "Cycling", "Skiing", "Skating", "Volleyball", "Basketball", "Karate", "Lacrosse"] },
    { id: "countries", emoji: "🌍", name: "Countries", words: ["Canada", "Mexico", "France", "Japan", "Brazil", "Italy", "Spain", "Morocco", "Egypt", "China", "India", "Peru", "Norway", "Switzerland", "Ireland", "Australia", "Portugal", "Senegal"] },
    { id: "canada", emoji: "🍁", name: "Canada", words: ["Maple", "Poutine", "Toque", "Quebec", "Alberta", "Ontario", "Yukon", "Nunavut", "Loon", "Beaver", "Rockies", "Toronto", "Calgary", "Montreal", "Mountie", "Prairies", "Canoe", "Hockey"] },
    { id: "kitchen", emoji: "🍳", name: "Kitchen", words: ["Saucepan", "Skillet", "Whisk", "Flour", "Butter", "Sugar", "Recipe", "Oven", "Knife", "Spoon", "Omelette", "Soup", "Cake", "Pie", "Spices", "Gravy", "Waffle", "Muffin"] },
    { id: "construction", emoji: "🔨", name: "Construction", words: ["Hammer", "Nail", "Saw", "Level", "Drill", "Ladder", "Shingle", "Flashing", "Soffit", "Gutter", "Roofing", "Brick", "Concrete", "Beam", "Trowel", "Roofer", "Siding", "Scaffold"] },
    { id: "winter", emoji: "❄️", name: "Winter", words: ["Snow", "Flurry", "Toque", "Mitten", "Scarf", "Ice", "Skate", "Sled", "Igloo", "Blizzard", "Storm", "Toboggan", "Parka", "Shovel", "Frost", "Icicle", "Slush", "Chill"] },
    { id: "space", emoji: "🚀", name: "Space", words: ["Planet", "Star", "Comet", "Galaxy", "Rocket", "Moon", "Cosmos", "Mars", "Venus", "Saturn", "Jupiter", "Orbit", "Crater", "Astronaut", "Satellite", "Meteorite", "Eclipse", "Nebula"] },
    { id: "music", emoji: "🎸", name: "Music", words: ["Guitar", "Piano", "Violin", "Drum", "Flute", "Harp", "Trumpet", "Cymbal", "Accordion", "Song", "Rhythm", "Melody", "Concert", "Choir", "Note", "Opera", "Banjo", "Saxophone"] },
    { id: "body", emoji: "💪", name: "Human body", words: ["Head", "Shoulder", "Knee", "Ankle", "Elbow", "Wrist", "Brain", "Heart", "Lung", "Hip", "Nose", "Mouth", "Chin", "Toe", "Eyebrow", "Stomach", "Skeleton", "Muscle"] },
    { id: "sea", emoji: "🐳", name: "Sea and ocean", words: ["Whale", "Dolphin", "Shark", "Octopus", "Jellyfish", "Lobster", "Crab", "Seal", "Cod", "Salmon", "Coral", "Seaweed", "Wave", "Tide", "Beach", "Lighthouse", "Seashell", "Starfish"] },
    { id: "jobs", emoji: "👷", name: "Jobs", words: ["Firefighter", "Doctor", "Plumber", "Carpenter", "Roofer", "Electrician", "Baker", "Mailman", "Police", "Pilot", "Dentist", "Farmer", "Welder", "Painter", "Mechanic", "Architect", "Nurse", "Butcher"] },
    { id: "games", emoji: "🎲", name: "Games", words: ["Cards", "Dice", "Chess", "Checkers", "Dominoes", "Bingo", "Pawn", "Board", "Poker", "Puzzle", "Top", "Marbles", "Hopscotch", "Bowling", "Solitaire", "Joker", "King", "Queen"] },
    { id: "weather", emoji: "⛈️", name: "Weather", words: ["Drizzle", "Storm", "Thunder", "Lightning", "Cloud", "Mist", "Hail", "Wind", "Sunshine", "Tornado", "Hurricane", "Shower", "Heatwave", "Humidity", "Snow", "Fog", "Rainbow", "Dew"] }
  ]
};
