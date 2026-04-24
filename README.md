# IFT7100_TP3 - Marché de fruits decentralise (UUPS)

## Luc Alfred MBIDA - 537 333 752 
### Lien git: https://github.com/alfredrikudou/IFT7100_TP3
### Lien video: https://youtu.be/wNKUazdN2i8

Ce projet implemente une mini place de marché de fruits sur Ethereum avec des contrats **upgradeables UUPS** et une interface web Next.js.

L'objectif est de demontrer:
- un cycle complet de developpement smart contract (`compile`, `test`, `deploy`);
- une evolution fonctionnelle du contrat entre **V1** et **V2** sans changer l'adresse proxy;
- un usage en **local Hardhat** et en **testnet Sepolia**.

## Projet choisi

Le projet choisi est un **marché de fruits decentralise**:
- des vendeurs publient des produits (nom, description, icone, prix, stock);
- des acheteurs achetent en ETH;
- les achats sont traces on-chain;
- en V2, les acheteurs peuvent noter les vendeurs.

Le front lit la configuration de deploiement dans `web/public/fruit-market-deploy.json`, generee automatiquement par les scripts Hardhat.

## Ce qu'implemente la V1

Le contrat `contracts/FruitMarketV1.sol` implemente:
- la creation et la gestion de produits (ajout, mise a jour, desactivation);
- l'achat d'un produit avec paiement exact (`msg.value == prix * quantite`);
- l'enregistrement des achats (historique `Purchase`);
- des verifications metier (stock, prix, droits vendeur, produit actif, etc.);
- une base upgradeable UUPS (`OwnableUpgradeable`, `UUPSUpgradeable`) avec `initialize()`;
- un catalogue initial de produits au deploiement.

## Ce qu'implemente la V2

Le contrat `contracts/FruitMarketV2.sol` herite de V1 et ajoute:
- la **notation vendeur** apres achat (`rateSeller(purchaseId, rating)`);
- la contrainte "un achat = une seule note";
- la contrainte "seul l'acheteur de cet achat peut noter";
- des agregats de reputation vendeur (`getSellerRating`);
- une fonction utilitaire pour savoir si un achat est deja note (`isPurchaseRated`).

L'upgrade est fait via le proxy UUPS (script `scripts/upgrade.ts`) sans casser le stockage existant.

## Prerequis

- Node.js (version LTS recommandee)
- npm
- MetaMask (pour les tests front avec wallet)
- ETH Sepolia (si deploiement testnet)
- Un endpoint RPC Sepolia (Infura, Alchemy, etc.)

## Installation apres clonage

Depuis la racine `IFT7100_TP3`:

```bash
npm install
npm install --prefix web
```

## Configuration des variables d'environnement

### Racine du projet (`IFT7100_TP3/.env`)

Copier `.env.example` vers `.env`, puis renseigner:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/VOTRE_CLE
PRIVATE_KEY=VOTRE_CLE_PRIVEE
```

Variables utiles:
- `SEPOLIA_RPC_URL`: endpoint RPC HTTPS pour Sepolia;
- `PRIVATE_KEY`: compte deployeur/proprietaire du proxy;
- `PROXY_ADDRESS`: requis pour le script d'upgrade;
- `ETHERSCAN_API_KEY` (optionnel): verification Etherscan.

### Front (`IFT7100_TP3/web/.env.local`)

Creer `web/.env.local` pour alimenter le proxy API Sepolia du front:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/VOTRE_CLE
```

## Compilation, tests et synchronisation ABI

Depuis la racine:

```bash
npm run compile
npm test
npm run sync:abi
```

`sync:abi` copie l'ABI vers le front pour garder l'interface alignee avec le contrat.

## Deploiement local (Hardhat)

1. Lancer un noeud local:
```bash
npm run node
```
2. Dans un autre terminal, deployer:
```bash
npm run deploy:local
```
3. Lancer l'interface:
```bash
npm run web:dev
```

Le deploiement local genere:
- `web/public/fruit-market-deploy.json`
- `web/public/fruit-market-local.json`

Ces fichiers contiennent l'adresse proxy et le `chainId` local (`31337`).

## Deploiement Sepolia (testnet)

Depuis la racine:

```bash
npm run compile
npm run deploy:sepolia
```

Le script de deploiement:
- deploie `FruitMarketV2` derriere un proxy UUPS;
- affiche l'adresse proxy et l'adresse implementation;
- ecrit `web/public/fruit-market-deploy.json` avec `chainId` (`11155111`) et la config RPC.

Ensuite lancer le front:

```bash
npm run web:dev
```

Puis:
- ouvrir l'application web;
- connecter MetaMask;
- basculer MetaMask sur Sepolia.

## Upgrade V1 -> V2 (si proxy deja deploye)

Dans `.env` (racine), definir:

```env
PROXY_ADDRESS=0xAdresseDuProxy
```

Puis executer:

```bash
npm run upgrade:sepolia
```

Ou en local:

```bash
npm run upgrade:local
```

Important: `PROXY_ADDRESS` doit etre l'adresse **du proxy**, pas celle de l'implementation.

## Scripts npm utiles

- `npm run compile`: compile les contrats
- `npm test`: execute les tests Hardhat
- `npm run node`: lance Hardhat local
- `npm run deploy:local`: deploie en local
- `npm run deploy:sepolia`: deploie sur Sepolia
- `npm run upgrade:local`: upgrade local
- `npm run upgrade:sepolia`: upgrade Sepolia
- `npm run sync:abi`: synchronise l'ABI vers le front
- `npm run web:dev`: lance le front en mode dev
- `npm run web:build`: build du front
- `npm run web:start`: lance le front en production

## Depannage rapide

- **Erreur `insufficient funds`**: ajouter des ETH Sepolia au compte deployeur.
- **Erreur RPC dans le front**: verifier `web/.env.local`, puis redemarrer Next.js.
- **Mauvais reseau MetaMask**: passer sur `Sepolia` (ou `localhost 31337` en local).
- **Fichier deploy absent**: relancer `deploy:local` ou `deploy:sepolia`.

