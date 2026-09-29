// Banques de mots pour les mots croisés : « MOT|définition » (une entrée par ligne).
// Le mot garde ses accents pour l'affichage de la solution ; la grille, elle,
// n'utilise que les lettres A à Z (voir normalizeWord dans engine.js).

const FR = `
Ail|Bulbe à l'odeur forte utilisé en cuisine
Ami|Personne à qui l'on est lié d'affection
Arc|Arme qui lance des flèches
Bol|Récipient creux pour la soupe ou les céréales
Cou|Il relie la tête au tronc
Dos|Partie arrière du tronc
Été|Saison la plus chaude de l'année
Feu|Il brûle dans le foyer
Fil|On l'enfile dans le chas d'une aiguille
Gaz|Ni solide ni liquide
Île|Terre entourée d'eau
Lac|Étendue d'eau douce entourée de terres
Lit|Meuble pour dormir
Mer|Vaste étendue d'eau salée
Mur|Cloison de maçonnerie
Nez|Organe de l'odorat
Nid|Abri construit par l'oiseau
Pin|Conifère aux longues aiguilles
Riz|Céréale de base en Asie
Roi|Souverain d'un royaume
Sel|Assaisonnement tiré de la mer
Sac|Contenant souple qu'on porte à la main ou au dos
Thé|Infusion de feuilles venue d'Asie
Vin|Boisson faite de raisin fermenté
Zoo|Parc où l'on observe des animaux
Duo|Groupe de deux musiciens
Clé|Elle ouvre la serrure
Blé|Céréale dont on fait la farine
Axe|Ligne autour de laquelle un objet tourne
Ski|Sport de glisse sur la neige
Rat|Gros rongeur des égouts
Ver|Petit animal au corps mou qui vit dans la terre
Mai|Cinquième mois de l'année
Âne|Cousin du cheval aux longues oreilles
Bus|Transport en commun sur roues
Cap|Pointe de terre qui s'avance dans la mer
Col|Passage entre deux montagnes
Jus|Liquide extrait d'un fruit
Pou|Petit insecte parasite des cheveux
Sud|Point cardinal opposé au nord
Est|Point cardinal où le soleil se lève
Mât|Poteau qui porte les voiles d'un bateau
Jeu|Activité pour se divertir
Mot|Suite de lettres qui a un sens
Loi|Règle votée par le parlement
Gel|Froid qui transforme l'eau en glace
Oie|Oiseau qui migre en formant un V
Coq|Mâle de la poule
Yak|Bœuf à longs poils de l'Himalaya
But|On le marque au hockey ou au soccer
Vis|Tige filetée à tête fendue
Rue|Voie bordée de maisons en ville
Nil|Grand fleuve d'Égypte
Ours|Gros mammifère qui hiberne
Vélo|Bicyclette
Toit|Couverture d'une maison
Lune|Satellite naturel de la Terre
Loup|Canidé sauvage qui hurle
Lait|Boisson blanche produite par la vache
Pain|Aliment de farine cuit au four
Miel|Produit sucré fabriqué par les abeilles
Rose|Fleur à épines
Chat|Félin domestique
Pied|Extrémité de la jambe
Main|Extrémité du bras
Nord|Point cardinal indiqué par la boussole
Vent|Mouvement de l'air
Ciel|Voûte bleue au-dessus de nos têtes
Gant|Il protège la main
Clou|Tige de métal qu'on enfonce au marteau
Scie|Outil à lame dentée pour couper
Bois|Matière du tronc des arbres
Seau|Récipient à anse pour transporter de l'eau
Lynx|Félin sauvage aux oreilles en pinceau
Cerf|Grand ruminant aux bois ramifiés
Orge|Céréale utilisée pour faire la bière
Kiwi|Fruit brun et velu à chair verte
Noix|Fruit à coquille dure du noyer
Café|Boisson noire faite de grains torréfiés
Four|Appareil de cuisson fermé
Rêve|Images que l'on voit en dormant
Joie|Sentiment de grand bonheur
Peur|Émotion ressentie face au danger
Rire|Manifestation bruyante de la gaieté
Pion|Petite pièce qu'on déplace sur un plateau de jeu
Tour|Pièce des échecs qui avance en ligne droite
Roue|Elle tourne autour d'un essieu
Auto|Voiture
Gare|Endroit où arrivent les trains
Port|Abri aménagé pour les navires
Pont|Ouvrage qui enjambe une rivière
Parc|Jardin public
Cinq|Nombre qui suit quatre
Sept|Nombre de jours dans une semaine
Onze|Dix plus un
Zéro|Chiffre qui ne vaut rien
Août|Huitième mois de l'année
Juin|Mois où commence l'été
Mars|Planète rouge
Robe|Vêtement féminin d'une seule pièce
Jupe|Vêtement qui descend de la taille
Tête|Partie du corps qui contient le cerveau
Dent|On la brosse matin et soir
Thon|Gros poisson de mer souvent mis en conserve
Paon|Oiseau qui fait la roue
Lion|Roi de la savane
Puma|Autre nom du couguar
Émeu|Grand oiseau coureur d'Australie
Élan|Nom européen de l'orignal
Idée|Pensée qui germe dans l'esprit
Page|Côté d'une feuille de livre
Note|Son de musique, ou résultat d'un examen
Film|On le regarde au cinéma
Fête|Célébration joyeuse
Vote|Choix exprimé lors d'une élection
Taxe|Impôt ajouté au prix
Code|Suite de chiffres secrète
Cube|Solide à six faces carrées
Onde|Vibration qui se propage, comme le son
Bleu|Couleur du ciel sans nuage
Vert|Couleur de l'herbe
Gris|Mélange de noir et de blanc
Brun|Couleur du chocolat
Chou|Légume aux grosses feuilles serrées
Maïs|Épis dorés qu'on mange grillés
Golf|Sport où l'on vise un trou avec une balle
Judo|Art martial japonais
Boxe|Sport de combat avec des gants
Grue|Engin de levage des chantiers, ou oiseau échassier
Joue|Côté du visage
Juge|Il rend le verdict au tribunal
Chef|Il dirige la cuisine d'un restaurant
Tire|Sirop d'érable durci sur la neige
Veau|Petit de la vache
Moto|Deux-roues à moteur
Pneu|Caoutchouc qui entoure la roue
Midi|Milieu de la journée
Cent|Dix fois dix
Rome|Capitale de l'Italie
Lima|Capitale du Pérou
Oslo|Capitale de la Norvège
Inde|Pays du Taj Mahal
Cuba|Île des Caraïbes, capitale La Havane
Neige|Flocons blancs qui tombent l'hiver
Pomme|Fruit du pommier
Hiver|Saison des tempêtes de neige
Tuque|Bonnet de laine québécois
Pelle|Outil pour déneiger l'entrée
Sapin|Conifère qu'on décore à Noël
Porte|On l'ouvre pour entrer
Doigt|La main en compte cinq
Soupe|Plat liquide servi chaud
Tarte|Pâtisserie à fond de pâte garnie de fruits
Avion|Appareil qui vole grâce à ses ailes
Fusée|Engin qui s'élance vers l'espace
Botte|Chaussure qui monte haut sur la jambe
Coude|Articulation au milieu du bras
Genou|Articulation au milieu de la jambe
Lèvre|Bord charnu de la bouche
Crabe|Crustacé qui marche de côté
Cygne|Grand oiseau blanc au long cou
Aigle|Grand rapace au bec crochu
Zèbre|Cheval rayé d'Afrique
Rouge|Couleur de la feuille d'érable du drapeau canadien
Jaune|Couleur du citron
Pluie|Eau qui tombe des nuages
Orage|Mauvais temps avec éclairs et tonnerre
Brume|Léger brouillard
Grêle|Précipitation de billes de glace
Givre|Fine couche de glace sur les vitres
Nuage|Masse de vapeur d'eau dans le ciel
Poêle|Ustensile pour faire cuire les œufs
Verre|Récipient pour boire
Tasse|Petit récipient à anse pour le café
Table|Meuble sur lequel on mange
Piano|Instrument à touches noires et blanches
Flûte|Instrument à vent percé de trous
Harpe|Instrument triangulaire à cordes pincées
Radio|Appareil qui capte les ondes
Livre|On le lit page après page
Lampe|Appareil d'éclairage
Clown|Artiste de cirque au nez rouge
Magie|Art des tours de passe-passe
Plage|Bord de mer couvert de sable
Sable|Il recouvre la plage
Océan|Très vaste étendue d'eau salée
Forêt|Grande étendue couverte d'arbres
Arbre|Végétal à tronc et à branches
Herbe|Plante verte qui couvre la pelouse
Tigre|Grand félin rayé d'Asie
Singe|Primate qui grimpe aux arbres
Hibou|Rapace nocturne à aigrettes
Vache|Elle donne du lait
Poule|Elle pond des œufs
Merle|Oiseau chanteur; celui d'Amérique a la poitrine rousse
Guêpe|Insecte jaune et noir qui pique
Melon|Gros fruit à chair orange et sucrée
Poire|Fruit du poirier
Pêche|Fruit à peau veloutée, ou loisir avec une canne
Prune|Fruit à noyau, violet ou jaune
Olive|Petit fruit dont on tire une huile
Navet|Légume racine blanc et violet
Radis|Petite racine rouge au goût piquant
Crêpe|Galette mince qu'on arrose de sirop
Sirop|Liquide sucré, comme celui d'érable
Patin|Chaussure munie d'une lame pour la glace
Aréna|Patinoire intérieure
Rugby|Sport au ballon ovale
Balle|Petit objet rond qu'on lance
Filet|Réseau de mailles, comme celui du but
Stade|Grand terrain de sport entouré de gradins
Solin|Bande de métal qui rend un toit étanche
Écrou|Pièce qui se visse sur un boulon
Béton|Mélange de ciment, de sable et de gravier
Maçon|Ouvrier qui monte les murs de briques
Terre|Notre planète
Vénus|Planète la plus chaude du système solaire
Coeur|Organe qui pompe le sang
Opéra|Pièce de théâtre chantée
Sucre|Il adoucit le café
Pizza|Galette garnie venue de Naples
Fouet|Ustensile pour battre les œufs
Juste|Conforme à la vérité ou à l'équité
Igloo|Abri de blocs de neige
Huard|Oiseau plongeur de la pièce d'un dollar
Morue|Poisson de l'Atlantique Nord
Lapin|Animal aux longues oreilles qui aime les carottes
Chiot|Petit du chien
Canot|Embarcation légère qu'on fait avancer à l'aviron
Métro|Train souterrain en ville
Carte|Dessin d'un territoire, ou pièce d'un jeu
Dames|Jeu de pions sur un damier
Bingo|Jeu de hasard où l'on crie quand la carte est pleine
Lundi|Premier jour de la semaine de travail
Heure|Soixante minutes
Trois|Nombre des petits cochons du conte
Douze|Une douzaine
Mille|Dix fois cent
Yukon|Territoire de la ruée vers l'or du Klondike
Japon|Pays du Soleil levant
Chine|Pays de la Grande Muraille
Maroc|Pays d'Afrique du Nord, capitale Rabat
Pérou|Pays du Machu Picchu
Grèce|Pays de l'Acropole
Chili|Long pays étroit d'Amérique du Sud
Haïti|Pays francophone des Antilles
Paris|Capitale de la France
Tokyo|Capitale du Japon
Alpes|Chaîne de montagnes d'Europe
Andes|Cordillère d'Amérique du Sud
Musée|Lieu où l'on expose des œuvres
École|Lieu où l'on apprend
Gomme|Elle efface le crayon
Chaise|Siège à dossier sans bras
Fleuve|Cours d'eau qui se jette dans la mer
Loutre|Mammifère aquatique joueur
Renard|Canidé roux et rusé
Mouton|Animal qui donne la laine
Chèvre|Animal à barbiche qui donne du lait
Cheval|On le monte avec une selle
Canard|Oiseau aquatique qui fait coin-coin
Mouche|Insecte qui bourdonne autour des fruits
Fourmi|Insecte travailleur qui vit en colonie
Mangue|Fruit tropical à chair orange
Citron|Agrume acide et jaune
Fraise|Petit fruit rouge du printemps
Cerise|Petit fruit rouge à noyau, souvent en paire
Bleuet|Petit fruit bleu du Lac-Saint-Jean
Raisin|On en fait du vin
Tomate|Fruit rouge qu'on mange en salade
Oignon|Légume qui fait pleurer quand on le coupe
Érable|Arbre dont la sève donne du sirop
Cabane|Petite maison rustique; celle à sucre ouvre au printemps
Hockey|Sport d'hiver national du Canada
Tennis|Sport de raquette qui se joue sur un court
Soccer|Nom du football au Québec
Boulon|Tige filetée qu'on serre avec un écrou
Poutre|Grosse pièce qui soutient un plancher
Ciment|Poudre qui durcit une fois mélangée à l'eau
Brique|Bloc de terre cuite pour bâtir les murs
Balcon|Plateforme en saillie sur une façade
Garage|Abri pour la voiture
Casque|Il protège la tête
Niveau|Outil à bulle pour vérifier l'horizontalité
Canada|Pays à la feuille d'érable
Québec|Province francophone du Canada
Ottawa|Capitale du Canada
France|Pays de la tour Eiffel
Italie|Pays en forme de botte
Brésil|Plus grand pays d'Amérique du Sud
Égypte|Pays des pyramides
Suisse|Pays des Alpes, du chocolat et des montres
Madrid|Capitale de l'Espagne
Soleil|Étoile au centre de notre système
Étoile|Elle brille la nuit dans le ciel
Comète|Astre à longue queue lumineuse
Orbite|Trajectoire d'un astre autour d'un autre
Uranus|Septième planète du système solaire
Aurore|Lever du jour; la boréale colore le ciel du Nord
Poumon|Organe de la respiration
Langue|Organe du goût
Cheveu|Poil de la tête
Orteil|Doigt du pied
Menton|Bas du visage
Violon|Instrument à cordes joué avec un archet
Rythme|Cadence régulière des sons
Farine|Poudre de céréale moulue
Beurre|Matière grasse tirée de la crème
Muffin|Petit gâteau individuel
Gâteau|Dessert d'anniversaire garni de bougies
Salade|Plat de légumes crus assaisonnés
Frites|Bâtonnets de pomme de terre dorés
Poivre|Épice noire qu'on moud
Pilote|Il conduit l'avion
Avocat|Il défend son client en cour; aussi un fruit vert
Glaçon|Morceau de glace dans un verre
Castor|Rongeur bâtisseur de barrages, emblème du Canada
Saumon|Poisson qui remonte les rivières pour frayer
Homard|Crustacé à grosses pinces
Phoque|Mammifère marin qui vit sur la banquise
Requin|Poisson prédateur aux dents acérées
Méduse|Animal marin gélatineux qui pique
Tortue|Reptile à carapace
Lézard|Petit reptile qui se chauffe au soleil
Girafe|Animal au plus long cou
Souris|Petit rongeur, ou accessoire d'ordinateur
Chaton|Félin qui vient de naître
Agneau|Petit du mouton
Chanter|Faire de la musique avec sa voix
Danser|Bouger au rythme de la musique
Courir|Aller vite sur ses jambes
Nager|Se déplacer dans l'eau
Dormir|Se reposer les yeux fermés
Manger|Prendre un repas
Écrire|Tracer des lettres
Jouer|S'amuser
Gagner|Remporter la partie
Perdre|Le contraire de gagner
Sauter|S'élever du sol d'un bond
Voler|Se déplacer dans les airs, ou dérober
Bâtir|Construire
Miroir|Surface qui reflète l'image
Valise|Bagage pour voyager
Crayon|Il sert à écrire ou à dessiner
Cahier|Carnet de feuilles pour écrire
Bateau|Il flotte et navigue
Camion|Véhicule lourd de transport
Volant|On le tourne pour diriger la voiture
Domino|Pièce de jeu marquée de points
Échecs|Jeu de rois et de fous sur 64 cases
Puzzle|Casse-tête
Toupie|Jouet qui tourne sur sa pointe
Ballon|Grosse balle gonflée d'air
Poupée|Jouet à figure humaine
Violet|Couleur entre le bleu et le rouge
Orange|Couleur, et agrume du même nom
Vallée|Creux entre deux montagnes
Volcan|Montagne qui crache de la lave
Désert|Région aride de sable ou de roche
Marais|Terrain couvert d'eau stagnante
Rocher|Gros bloc de pierre
Éclair|Lumière de l'orage; aussi une pâtisserie
Samedi|Jour qui suit vendredi
Minuit|Milieu de la nuit
Siècle|Période de cent ans
Flocon|Cristal de neige
Poulain|Petit du cheval
Abeille|Insecte qui produit le miel
Carotte|Légume orange que les lapins adorent
Poutine|Frites, fromage en grains et sauce brune
Arbitre|Il fait respecter les règles du match
Toiture|Ensemble de ce qui couvre un bâtiment
Bardeau|Plaque qui recouvre un toit, souvent d'asphalte
Soffite|Revêtement sous le débord de toit
Marteau|Outil pour enfoncer les clous
Planche|Pièce de bois plate et longue
Fenêtre|Ouverture vitrée dans un mur
Grenier|Pièce sous le toit
Plafond|Surface qui ferme le haut d'une pièce
Échelle|Outil à barreaux pour monter
Truelle|Outil du maçon pour étaler le mortier
Peintre|Il manie le pinceau
Rivière|Cours d'eau qui se jette dans un autre
Feuille|Elle tombe de l'arbre à l'automne
Tambour|Instrument à percussion
Alberta|Province des Rocheuses et du pétrole
Ontario|Province la plus peuplée du Canada
Nunavut|Territoire inuit du Grand Nord canadien
Toronto|Plus grande ville du Canada
Calgary|Ville du Stampede
Espagne|Pays du flamenco
Mexique|Pays des mariachis et des tacos
Irlande|Île verte au trèfle
Norvège|Pays des fjords
Londres|Capitale du Royaume-Uni
Planète|Astre qui tourne autour d'une étoile
Galaxie|Immense ensemble d'étoiles
Saturne|Planète aux anneaux
Jupiter|Plus grosse planète du système solaire
Neptune|Planète la plus éloignée du Soleil
Mercure|Planète la plus proche du Soleil
Cratère|Trou laissé par l'impact d'une météorite
Éclipse|Quand un astre en cache un autre
Cerveau|Organe de la pensée
Oreille|Organe de l'ouïe
Estomac|Organe où commence la digestion
Poignet|Articulation entre la main et l'avant-bras
Sourcil|Poils au-dessus de l'œil
Guitare|Instrument à six cordes
Chanson|Texte mis en musique
Chorale|Groupe de chanteurs
Concert|Spectacle de musique
Mélodie|Suite de notes agréable à l'oreille
Fromage|Produit laitier comme le cheddar
Cretons|Pâté de porc à tartiner du déjeuner québécois
Biscuit|Petite gâterie croquante
Ketchup|Sauce rouge à la tomate
Vanille|Gousse parfumée pour les desserts
Couteau|Ustensile qui coupe
Recette|Instructions pour préparer un plat
Médecin|Il soigne les malades
Pompier|Il éteint les incendies
Facteur|Il livre le courrier
Boucher|Il vend la viande
Fermier|Il cultive la terre et élève des animaux
Soudeur|Il assemble le métal à la flamme
Tempête|Neige ou pluie accompagnée de vents violents
Congère|Amas de neige entassée par le vent
Mitaine|Gant sans séparation pour les doigts
Foulard|Il protège le cou du froid
Verglas|Mince couche de glace sur le sol
Orignal|Grand cervidé des forêts canadiennes
Caribou|Cervidé du Nord qui orne la pièce de 25 cents
Baleine|Plus grand mammifère marin
Dauphin|Mammifère marin très intelligent
Pieuvre|Mollusque à huit bras
Serpent|Reptile sans pattes
Chameau|Animal du désert à deux bosses
Chenille|Larve du papillon
Hamster|Petit rongeur qui fait des provisions dans ses joues
Horloge|Elle donne l'heure au mur
Ciseaux|Outil à deux lames pour couper le papier
Tableau|Surface où écrit l'enseignant, ou une peinture
Château|Demeure fortifiée d'un seigneur
Hôpital|Lieu où l'on soigne les malades
Voilier|Bateau poussé par le vent
Essence|Carburant de la voiture
Colline|Petite élévation de terrain
Glacier|Grande masse de glace qui descend lentement
Cascade|Chute d'eau
Caillou|Petite pierre
Automne|Saison des feuilles colorées
Janvier|Premier mois de l'année
Semaine|Période de sept jours
Seconde|Soixantième partie d'une minute
Médaille|Récompense remise aux Jeux olympiques
Champion|Vainqueur d'une compétition
Perceuse|Outil électrique pour faire des trous
Escalier|Suite de marches
Plancher|Surface sur laquelle on marche dans une pièce
Couvreur|Ouvrier qui pose les toitures
Plombier|Il répare les tuyaux et les robinets
Chantier|Lieu où l'on construit un bâtiment
Rondelle|Disque de caoutchouc du hockey
Manitoba|Province dont la capitale est Winnipeg
Edmonton|Capitale de l'Alberta
Montréal|Ville du Vieux-Port et de l'Oratoire Saint-Joseph
Gaspésie|Péninsule du rocher Percé
Saguenay|Rivière et ville du fjord québécois
Omelette|Plat d'œufs battus cuits à la poêle
Sandwich|Garniture entre deux tranches de pain
Moutarde|Condiment jaune au goût piquant
Cannelle|Épice tirée d'une écorce
Chocolat|Friandise faite de cacao
Cuillère|Ustensile pour manger la soupe
Policier|Agent qui fait respecter la loi
Dentiste|Il soigne les dents
Batterie|Ensemble de tambours et de cymbales
Traîneau|Véhicule sur patins tiré par des chiens
Raquette|Large semelle pour marcher sur la neige
Carnaval|Fête d'hiver de Québec avec Bonhomme
Bernache|Oie du Canada
Mouffette|Animal rayé à l'odeur repoussante
Éléphant|Mammifère à trompe
Hérisson|Petit mammifère couvert de piquants
Écureuil|Rongeur à queue touffue qui aime les noix
Papillon|Insecte aux ailes colorées
Araignée|Elle tisse une toile
Parapluie|Il nous garde au sec sous l'averse
Tracteur|Véhicule de ferme
Boussole|Instrument dont l'aiguille indique le nord
Montagne|Relief très élevé
Tonnerre|Bruit qui suit l'éclair
Décembre|Mois de Noël
Dimanche|Dernier jour de la semaine
Tournevis|Outil à manche et à pointe plate ou cruciforme
Gouttière|Conduit qui recueille l'eau du toit
Menuisier|Artisan qui travaille le bois
Printemps|Saison du dégel
Satellite|Objet en orbite autour d'une planète
Télescope|Instrument pour observer les astres
Squelette|Ensemble des os du corps
Trompette|Cuivre à trois pistons
Accordéon|Instrument à soufflet et à clavier
Tourtière|Pâté à la viande des Fêtes au Québec
Casserole|Récipient à manche pour faire cuire
Boulanger|Il fait le pain
Infirmier|Il soigne les patients avec le médecin
Ingénieur|Spécialiste qui conçoit des ouvrages techniques
Poudrerie|Neige soulevée et chassée par le vent
Motoneige|Véhicule à chenille pour les sentiers d'hiver
Patinoire|Surface glacée où l'on joue au hockey
Érablière|Forêt exploitée pour produire le sirop
Crocodile|Grand reptile aux mâchoires puissantes
Kangourou|Marsupial sauteur d'Australie
Arc-en-ciel|Arche de couleurs qui apparaît après la pluie
Astronaute|Voyageur de l'espace
Fourchette|Ustensile à dents pour piquer les aliments
Grenouille|Amphibien qui coasse
Coccinelle|Petit insecte rouge à points noirs
Architecte|Il dessine les plans des bâtiments
Camionneur|Conducteur de poids lourd
Cerf-volant|Jouet que le vent soulève au bout d'une ficelle
Électricien|Il installe le filage électrique
Mécanicien|Il répare les moteurs
Violoncelle|Grand instrument à cordes joué assis
`;

const EN = `
Ant|Tiny insect that lives in a colony
Arm|Limb between the shoulder and the hand
Bat|Flying mammal, or a baseball club
Bed|Furniture for sleeping
Bee|Insect that makes honey
Box|Cardboard container
Bus|Public transit vehicle on wheels
Cap|Hat with a visor
Cat|Pet that purrs
Cow|Farm animal that gives milk
Cup|Small container for drinking
Dog|Pet that barks
Ear|Organ of hearing
Egg|Laid by a hen
Elk|Large deer, also called a wapiti
Eye|Organ of sight
Fox|Clever red canine
Hat|It sits on your head
Ice|Frozen water
Jam|Fruit spread for toast
Key|It opens a lock
Leg|Limb you walk on
Map|Drawing that shows a territory
Mud|Wet, sticky dirt
Nut|Hard-shelled fruit, or it screws onto a bolt
Oak|Tree that grows acorns
Owl|Night bird that hoots
Pen|Tool for writing in ink
Pig|Pink farm animal that oinks
Rat|Large rodent of the sewers
Saw|Toothed tool for cutting wood
Sea|Large body of salt water
Sky|Where the clouds float
Sun|Star at the center of our solar system
Tea|Drink made by steeping leaves
Toe|Digit of the foot
Van|Boxy vehicle for moving things
Web|What a spider spins
Zoo|Park where animals are shown
Axe|Tool for chopping wood
Gym|Place to work out
Ski|Long runner for gliding on snow
Yak|Long-haired ox of the Himalayas
Emu|Large running bird of Australia
Nail|Metal pin driven with a hammer
Bear|Large mammal that hibernates
Wolf|Wild canine that howls
Deer|Animal whose male grows antlers
Duck|Water bird that quacks
Frog|Amphibian that croaks
Fish|It swims and breathes through gills
Goat|Bearded farm animal
Lion|King of the savanna
Lynx|Wild cat with tufted ears
Seal|Flippered marine mammal of the ice floes
Crab|Crustacean that walks sideways
Swan|Large white bird with a long neck
Hawk|Bird of prey with sharp eyes
Moth|Night-flying cousin of the butterfly
Loon|Diving bird on Canada's dollar coin
Pear|Fruit shaped like a bell
Plum|Purple fruit with a pit
Lime|Small green citrus fruit
Kiwi|Fuzzy brown fruit with green flesh
Corn|Yellow kernels on a cob
Rice|Grain that is a staple in Asia
Milk|White drink from cows
Soup|Hot dish you eat with a spoon
Cake|Birthday dessert with candles
Salt|Seasoning taken from the sea
Bread|Baked loaf made from flour
Wind|Moving air
Rain|Water falling from clouds
Snow|White flakes that fall in winter
Hail|Balls of ice that fall in a storm
Fog|Cloud at ground level
Moon|Earth's natural satellite
Star|It twinkles in the night sky
Mars|The Red Planet
Rock|Solid piece of stone
Lake|Body of fresh water surrounded by land
Hill|Small rise of land
Cave|Hollow in the side of a mountain
Tree|Tall plant with a trunk
Leaf|It turns red or yellow in fall
Rose|Flower with thorns
Door|You open it to go in
Roof|Top covering of a house
Wall|Side of a room
Tile|Square piece covering a floor
Beam|Long heavy support in a building
Bolt|Threaded rod held by a nut
Pipe|Tube that carries water
Tape|Sticky strip, or a measuring tool
Drum|Instrument you hit with sticks
Harp|Triangle-shaped instrument with plucked strings
Song|Words set to music
Note|Single musical sound
Golf|Sport with clubs and eighteen holes
Puck|Rubber disk used in hockey
Goal|What you score in soccer
Team|Group of players
Boat|It floats and sails
Ship|Large boat for the ocean
Taxi|Car you pay to ride in
Road|Paved way for cars
Park|Public green space
Town|Place smaller than a city
Farm|Place where crops are grown
Hand|End of the arm
Foot|End of the leg
Knee|Joint in the middle of the leg
Nose|Organ of smell
Hair|It grows on your head
Blue|Color of a clear sky
Gold|Precious yellow metal
Pink|Pale red color
Gray|Mix of black and white
Game|Activity played for fun
Dice|Cubes with dots used in games
Card|It can be an ace or a king
Book|You read it page by page
Lamp|Light on a table
Sock|It goes on your foot inside a shoe
Coat|Warm garment worn outside
Mitt|Glove without separate fingers
Peru|Country of Machu Picchu
Iran|Country whose capital is Tehran
Cuba|Caribbean island, capital Havana
Oslo|Capital of Norway
Rome|Capital of Italy
Nile|Great river of Egypt
Apple|Fruit that keeps the doctor away
Grape|Small fruit that makes wine
Lemon|Sour yellow citrus fruit
Mango|Tropical fruit with orange flesh
Peach|Fuzzy fruit with a pit
Berry|Small juicy fruit
Onion|Vegetable that makes you cry
Bacon|Salty strips of pork
Toast|Bread browned by heat
Pizza|Italian pie with cheese and toppings
Candy|Sweet treat
Sugar|It sweetens your coffee
Honey|Sweet food made by bees
Maple|Tree whose sap becomes syrup
Syrup|Thick sweet liquid poured on pancakes
Tiger|Striped big cat of Asia
Zebra|Striped horse of Africa
Horse|Animal you ride with a saddle
Sheep|Animal that gives wool
Moose|Largest member of the deer family
Otter|Playful water mammal
Eagle|Bird of prey on many flags
Robin|Bird with a red breast
Whale|Largest mammal in the ocean
Shark|Fish with many sharp teeth
Snake|Reptile with no legs
Mouse|Small rodent, or a computer device
Camel|Desert animal with humps
Hammer|Tool for driving nails
Level|Tool with a bubble to check straightness
Drill|Power tool for making holes
Brick|Clay block used to build walls
Shingle|Flat piece that covers a roof
Ladder|Climbing tool with rungs
Window|Glass opening in a wall
Floor|What you walk on in a room
Stairs|Steps between floors
Porch|Covered entrance to a house
Fence|Barrier around a yard
Siding|Outer covering of a house's walls
Gutter|Channel that carries rain off the roof
Flashing|Metal strip that seals roof joints
Piano|Instrument with black and white keys
Flute|Wind instrument played sideways
Banjo|Stringed instrument with a round body
Radio|Device that plays broadcasts
Opera|Play that is sung
Tempo|Speed of the music
Choir|Group of singers
Hockey|Canada's national winter sport
Tennis|Racket sport played on a court
Soccer|Game called football in most countries
Rugby|Sport played with an oval ball
Skate|Boot with a blade for the ice
Arena|Indoor rink
Coach|Person who trains a team
Medal|Prize given at the Olympics
Canada|Country with a maple leaf flag
Quebec|Mostly French-speaking province of Canada
Alberta|Province of the Rockies and the oil sands
Ontario|Most populous province of Canada
Yukon|Territory of the Klondike gold rush
Ottawa|Capital of Canada
Toronto|Largest city in Canada
Calgary|City famous for its Stampede
Edmonton|Capital of Alberta
Japan|Land of the Rising Sun
China|Country of the Great Wall
India|Country of the Taj Mahal
Italy|Boot-shaped country
Spain|Country of flamenco
Egypt|Country of the pyramids
Chile|Long, narrow country of South America
Greece|Country of the Acropolis
Mexico|Country of mariachis and tacos
Brazil|Largest country in South America
France|Country of the Eiffel Tower
Norway|Country of fjords
Paris|Capital of France
Tokyo|Capital of Japan
London|Capital of the United Kingdom
Madrid|Capital of Spain
Alps|Mountain range in Europe
Andes|Mountain range of South America
Earth|Our home planet
Venus|Hottest planet in the solar system
Comet|Icy body with a glowing tail
Orbit|Path around a planet or star
Saturn|Planet with rings
Uranus|Seventh planet from the Sun
Rocket|Vehicle launched into space
Planet|World that circles a star
Galaxy|Huge system of stars
Jupiter|Largest planet in the solar system
Neptune|Planet farthest from the Sun
Mercury|Planet closest to the Sun
Crater|Hole made by a meteorite impact
Eclipse|When one body hides another
Aurora|Colored lights in the northern sky
Heart|Organ that pumps blood
Brain|Organ you think with
Lungs|Organs you breathe with
Mouth|Opening you eat and speak with
Tooth|You brush it twice a day
Elbow|Joint in the middle of the arm
Ankle|Joint between the foot and the leg
Wrist|Joint between the hand and the arm
Thumb|Short, thick finger
Chin|Bottom of the face
Cheek|Side of the face
Winter|Season of snowstorms
Spring|Season of the thaw
Summer|Hottest season of the year
Autumn|Season when leaves fall
Storm|Bad weather with strong winds
Frost|Thin layer of ice on a window
Cloud|White mass of water vapor in the sky
Thunder|Loud sound after lightning
Blizzard|Severe snowstorm with high winds
Igloo|Shelter built from snow blocks
Toque|Canadian knitted winter hat
Scarf|It keeps your neck warm
Shovel|Tool for clearing snow
Sled|Small vehicle for sliding downhill
Icicle|Hanging spike of ice
Glacier|Slow-moving mass of ice
Poutine|Fries, cheese curds and gravy
Pancake|Flat breakfast treat served with syrup
Cheese|Dairy product such as cheddar
Butter|Spread made by churning cream
Pepper|Black spice you grind
Garlic|Pungent bulb used in cooking
Carrot|Orange vegetable rabbits love
Potato|Vegetable made into fries
Tomato|Red fruit used in ketchup
Cherry|Small red fruit with a pit
Banana|Long yellow fruit you peel
Orange|Citrus fruit and a color
Muffin|Small individual cake
Cookie|Small sweet baked treat
Kettle|Pot for boiling water
Spoon|Utensil for soup
Knife|Utensil that cuts
Fork|Utensil with tines
Recipe|Instructions for making a dish
Doctor|Person who treats the sick
Nurse|Person who cares for patients
Pilot|Person who flies a plane
Farmer|Person who grows crops
Baker|Person who makes bread
Roofer|Tradesperson who installs roofs
Plumber|Person who fixes pipes and taps
Painter|Person who uses a brush
Welder|Person who joins metal with heat
Lawyer|Person who argues cases in court
Dentist|Person who takes care of teeth
Teacher|Person who runs a classroom
Carpenter|Person who builds with wood
Architect|Person who designs buildings
Engineer|Designer of machines and structures
Firefighter|Person who battles blazes
Electrician|Person who installs wiring
Mechanic|Person who repairs engines
Beaver|Rodent that builds dams, symbol of Canada
Caribou|Northern deer on the Canadian quarter
Raccoon|Masked animal that raids garbage cans
Skunk|Striped animal with a terrible smell
Rabbit|Animal with long ears that hops
Turtle|Reptile with a shell
Dolphin|Very smart marine mammal
Octopus|Sea creature with eight arms
Penguin|Flightless bird of Antarctica
Giraffe|Animal with the longest neck
Elephant|Large animal with a trunk
Kangaroo|Hopping marsupial of Australia
Squirrel|Bushy-tailed rodent that stores nuts
Hedgehog|Small mammal covered in spines
Butterfly|Insect with colorful wings
Spider|It spins a web
Lobster|Crustacean with big claws
Salmon|Fish that swims upstream to spawn
Guitar|Instrument with six strings
Violin|Stringed instrument played with a bow
Trumpet|Brass instrument with three valves
Concert|Live music show
Melody|Tune that is pleasant to hear
Rhythm|Regular beat in music
Garage|Shelter for a car
Castle|Fortified home of a king
Bridge|Structure that crosses a river
Island|Land surrounded by water
River|Stream of water flowing to the sea
Ocean|Vast body of salt water
Forest|Large area covered with trees
Desert|Dry, sandy region
Valley|Low land between mountains
Volcano|Mountain that erupts lava
Mountain|Very high landform
Rainbow|Arc of colors after a shower
Candle|Wax stick with a wick
Mirror|Surface that reflects your image
Pencil|Tool for writing or drawing
Eraser|It rubs out pencil marks
Scissors|Tool with two blades for cutting paper
Compass|Tool whose needle points north
Suitcase|Bag for travel
Umbrella|It keeps you dry in the rain
Tractor|Farm vehicle
Bicycle|Two-wheeled vehicle you pedal
Canoe|Light boat moved with a paddle
Subway|Underground train
Truck|Heavy vehicle for hauling
Domino|Game tile marked with dots
Chess|Game of kings and queens on 64 squares
Puzzle|Pieces you fit together
Bingo|Game where you shout when your card is full
Monday|First day of the work week
Sunday|Last day of the weekend
January|First month of the year
December|Month of Christmas
Minute|Sixty seconds
Century|One hundred years
Seven|Number of days in a week
Dozen|Twelve of something
Hundred|Ten times ten
`;

// Transforme le texte en objets { word, clue } en ignorant les lignes vides
function parse(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [word, clue] = line.split("|");
      return { word: word.trim(), clue: clue.trim() };
    });
}

export const CROSSWORD_BANK = { fr: parse(FR), en: parse(EN) };
