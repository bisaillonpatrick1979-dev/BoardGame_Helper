# Board Game Helper

Il te manque des dés, le sablier ou l'argent du jeu? Board Game Helper remplace les pièces perdues de tes jeux de société, directement sur ton téléphone ou ta tablette, même sans Internet.

## Fonctionnalités

L'app est organisée comme une vraie application mobile : en-tête, 5 onglets (Accueil, Dés, Cartes, Jeux, Outils) et chaque écran tient dans la hauteur du téléphone.

- **Dés 3D réalistes** : D4 à D20 en vrais polyèdres avec physique, ombres et son. Touche ou glisse pour lancer, touche un dé pour le garder. 7 couleurs.
- **Cartes réalistes** : jeu de 52 cartes dessiné en vectoriel (vraie disposition des enseignes, figures illustrées, dos décoré), retournement 3D.
  - Piger (pioche sans remise, 1 à 8 jeux, jokers), Mains privées (passe le téléphone), Bataille, Cartes perso.
- **Jeux** :
  - Pendu : le bonhomme se dessine trait par trait, 7 catégories, mode 2 joueurs avec mot secret.
  - Yam's : 5 dés 3D, 3 lancers, feuille de score de 13 cases, 1 à 4 joueurs.
  - Blackjack contre le croupier, avec jetons.
  - Puissance 4 et Tic-tac-toe : à deux ou contre l'ordinateur.
  - Memory avec les cartes, seul ou à deux.
  - Plus haut, plus bas.
- **Outils** : scores (pas de 1/5/10/50), minuteur circulaire, banque avec transferts, roue de hasard.
- **Réglages** : français/anglais, 8 thèmes, son.
- **Comptes** (optionnels) : connexion par courriel, sauvegarde dans le nuage des scores, statistiques et réglages, récupération sur un autre appareil, suppression de compte, [politique de confidentialité](public/confidentialite.html).
- **PWA hors ligne** : installable sur l'écran d'accueil, fonctionne sans connexion.

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
- `src/games/` : un fichier par jeu.
- `src/cards/` : cartes à jouer SVG et paquet.
- `src/lib/core.js` : langue, stockage, statistiques, sons, hasard.
- `src/lib/cloud.js` et `src/lib/auth.jsx` : comptes Supabase et synchronisation (la version la plus récente de chaque donnée gagne).

Base de données : projet Supabase `invoices-simple`, tables `bgh_profiles` et `bgh_saves` protégées par RLS (chaque joueur ne voit que ses données ; le champ `premium` ne peut être modifié que par le serveur).

Le code des dés est dans `src/dice/` :

- `diceGeometry.js` : géométrie des polyèdres, arêtes arrondies, textures des faces.
- `DiceEngine.js` : scène 3D, physique, lancer, lecture du résultat, dés gardés.
- `Dice3D.jsx` : composant React.

## Déploiement

Déployé sur Vercel (`vercel.json` inclus) : build `npm run build`, dossier `dist`.
