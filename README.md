# Board Game Helper

Il te manque des dés, le sablier ou l'argent du jeu? Board Game Helper remplace les pièces perdues de tes jeux de société, directement sur ton téléphone ou ta tablette, même sans Internet.

## Fonctionnalités

- **Dés 3D réalistes** : D4, D6, D8, D10, D12 et D20 en vrais polyèdres, avec physique (rebonds, collisions), ombres et son d'impact.
  - Touche le tapis ou le bouton pour lancer, ou **glisse le doigt** pour lancer dans une direction.
  - **Touche un dé pour le garder** : seuls les autres sont relancés (pratique pour les jeux à 5 dés).
  - 1 à 12 dés, 7 couleurs (ivoire, rubis, saphir, émeraude, onyx, améthyste, or).
  - Le total et l'historique des 10 derniers lancers.
- **Table de jeu** : dés, minuteur, scores, cartes, banque et roue sur un seul écran.
- **Scores** : plusieurs joueurs, noms modifiables.
- **Premium** : banque avec transferts, jeu de 52 cartes (mains privées, bataille, cartes custom), roue de hasard, kits de jeux, thèmes et mini-jeu du pendu.
- **Bilingue** : français et anglais.
- **PWA hors ligne** : installable sur l'écran d'accueil, fonctionne sans connexion après la première visite.

## Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # version de production dans dist/
```

## Technologies

React 18, Vite, three.js (rendu 3D), cannon-es (physique), lucide-react (icônes).

Le code des dés est dans `src/dice/` :

- `diceGeometry.js` : géométrie des polyèdres, arêtes arrondies, textures des faces.
- `DiceEngine.js` : scène 3D, physique, lancer, lecture du résultat, dés gardés.
- `Dice3D.jsx` : composant React.

## Déploiement

Déployé sur Vercel (`vercel.json` inclus) : build `npm run build`, dossier `dist`.
