# Board Game Helper

Il te manque des dés, le sablier ou l'argent du jeu? Board Game Helper remplace les pièces perdues de tes jeux de société, directement sur ton téléphone ou ta tablette, même sans Internet.

## Fonctionnalités

L'app est organisée comme une vraie application mobile : en-tête, 5 onglets (Accueil, Dés, Cartes, Jeux, Pièces) et chaque écran tient dans la hauteur du téléphone. Les deux aventures (livre dont tu es le héros et jeu de rôle avec Lia) sont en vedette tout en haut de l'accueil.

- **Dés 3D réalistes** : D4 à D20 en vrais polyèdres avec physique, ombres et son. Touche ou glisse pour lancer, touche un dé pour le garder. 7 couleurs.
- **Cartes réalistes** : jeu de 52 cartes dessiné en vectoriel (vraie disposition des enseignes, figures illustrées, dos décoré), retournement 3D.
  - Piger (pioche sans remise, 1 à 8 jeux, jokers), Mains privées (passe le téléphone), Bataille, Cartes perso.
- **Joueurs à la table** : ajoute tes amis présents (nom, couleur, ordre). La liste sert partout : jeux à 2, Yam's, mains de cartes, bataille, scores, banque, compteurs, ordre de jeu, Lia.
- **Jouer ensemble (plusieurs téléphones)** : l'hôte crée une partie et envoie un lien par texto, courriel ou code QR. Les amis l'ouvrent dans leur navigateur, sans rien installer ni créer de compte.
  - Poker (Hold'em ou Omaha, ordis en renfort), Cartes libres (paquet partagé, chacun sa main : pour n'importe quel jeu de cartes), Dés partagés (tout le monde voit tous les lancers), Puissance 4 à deux téléphones.
  - L'hôte est l'arbitre : il vérifie chaque action. Chaque joueur reçoit seulement SA vue, chiffrée de bout en bout (ECDH P-256 + AES-GCM) : impossible de voir les cartes des autres ou de jouer à leur place.
  - Reprise automatique après un rechargement ; l'hôte peut retirer un joueur.
- **Jeux** :
  - Solitaires : Klondike (1 ou 3 cartes), FreeCell, Araignée (1, 2 ou 4 couleurs), Pyramide, Golf — annuler, indice, chrono, sauvegarde.
  - Mots croisés (grilles générées, plus de 500 définitions en français, 3 niveaux) et Mots cachés (15 thèmes).
  - Poker vidéo (Jacks or Better, Deuces Wild) et Poker 5 cartes fermé contre l'ordinateur.
  - Aventure avec Lia : jeu de rôle avec une maître du jeu IA (seul ou toute la table), jets de dés demandés par Lia. Compte requis, quota quotidien.
  - La Crypte du Roi-Corbeau : livre dont tu es le héros original (30 sections), fiche de personnage aux dés, combats, chance, objets, sauvegarde.
  - Pendu : le bonhomme se dessine trait par trait, 7 catégories, mode 2 joueurs avec mot secret.
  - Yam's : 5 dés 3D, 3 lancers, feuille de score de 13 cases, 1 à 4 joueurs.
  - Blackjack contre le croupier, avec jetons.
  - Poker Texas Hold'em ou Omaha (sans limite ou pot-limit) contre 1 à 5 joueurs ordinateur (relances, tapis, pots secondaires, blindes qui montent).
  - Puissance 4 et Tic-tac-toe : à deux ou contre l'ordinateur.
  - Memory avec les cartes, seul ou à deux.
  - Plus haut, plus bas.
- **Pièces de rechange** (onglet Pièces) :
  - Scores, minuteur, sablier animé (se retourne), compteurs (vies, armées, ressources…).
  - Banque avec transferts.
  - Kit immobilier : cartes événement « Surprise » et « Coffre » (texte original, modifiables pour recopier une carte perdue) et titres de propriété modifiables, avec propriétaire, maisons, hypothèque et paiement du loyer relié à la banque.
  - Dés spéciaux (couleurs, lettres, oui/non, directions ou faces sur mesure) — aussi lançables en 3D dans l'écran Dés (bouton ✨), ordre de jeu (qui commence, à qui le tour).
- **Réglages** : français/anglais, 8 thèmes, son.
- **Comptes** (optionnels) : connexion par courriel, sauvegarde dans le nuage des scores, statistiques et réglages, récupération sur un autre appareil, suppression de compte, [politique de confidentialité](public/confidentialite.html).
- **PWA hors ligne** : installable sur l'écran d'accueil, fonctionne sans connexion. Se met à jour toute seule quand une nouvelle version est publiée (numéro de version visible dans les Réglages).

## Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # version de production dans dist/
```

## Technologies

React 18, Vite, three.js (rendu 3D), cannon-es (physique), lucide-react (icônes).

Organisation du code :

- `src/App.jsx` : coquille (en-tête, onglets, réglages).
- `src/screens/` : écrans Accueil, Dés, Cartes, Jeux, Outils, Réglages.
- `src/games/` : un fichier par jeu (`poker/engine.js` : moteur de poker testé sur plus de 1 000 mains simulées).
- `src/tools/` : pièces de rechange (sablier, compteurs, dés spéciaux, ordre de jeu, kit immobilier).
- `src/cards/` : cartes à jouer SVG et paquet.
- `src/lib/core.js` : langue, stockage, statistiques, sons, hasard.
- `src/lib/cloud.js` et `src/lib/auth.jsx` : comptes Supabase et synchronisation (la version la plus récente de chaque donnée gagne).

Base de données : projet Supabase `invoices-simple`, tables `bgh_profiles` et `bgh_saves` protégées par RLS (chaque joueur ne voit que ses données ; le champ `premium` ne peut être modifié que par le serveur).

Le code des dés est dans `src/dice/` :

- `diceGeometry.js` : géométrie des polyèdres, arêtes arrondies, textures des faces.
- `DiceEngine.js` : scène 3D, physique, lancer, lecture du résultat, dés gardés.
- `Dice3D.jsx` : composant React.

Parties en réseau : `src/net/` (`room.js` : salle, présence et arbitrage ; `crypto.js` : chiffrement ; `games/` : règles de chaque jeu en réseau ; `views/` : écrans). Transport : Supabase Realtime (canal `bgh-room-CODE`, aucune donnée de partie n'est enregistrée sur le serveur).

## Sécurité

- Base de données : RLS sur toutes les tables `bgh_*`, le champ `premium` ne peut pas être modifié par le joueur, maximum 300 sauvegardes de 200 ko par compte, droits TRUNCATE retirés.
- En-têtes HTTP (vercel.json) : Content-Security-Policy stricte, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.
- À activer dans Supabase → Authentication → « Leaked password protection » (refuse les mots de passe déjà piratés).

## Lia (IA)

Fonction serveur Supabase `bgh-lia` (projet `invoices-simple`) : vérifie le joueur connecté, applique un quota quotidien (`bgh_ai_usage` : 40 messages gratuits, 400 Premium) puis appelle Claude (modèle Haiku).
La clé doit être ajoutée dans Supabase → Edge Functions → Secrets : `ANTHROPIC_API_KEY`.

## Déploiement

Déployé sur Vercel (`vercel.json` inclus) : build `npm run build`, dossier `dist`.
