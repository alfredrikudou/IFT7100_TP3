# IFT7100_TP3 - Marche de fruits decentralise (UUPS)

Ce projet implemente une mini place de marche de fruits sur Ethereum avec des contrats **upgradeables UUPS** et une interface web Next.js.

L'objectif est de demontrer:
- un cycle complet de developpement smart contract (`compile`, `test`, `deploy`);
- une evolution fonctionnelle du contrat entre **V1** et **V2** sans changer l'adresse proxy;
- un usage en **local Hardhat** et en **testnet Sepolia**.

## Projet choisi

Le projet choisi est un **marche de fruits decentralise**:
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

## Trame "rapport TP" (prête a remplir)

Cette section peut etre reprise telle quelle dans votre rapport final.

### 1) Contexte et objectif

- **Cours**: IFT7100 - Cryptographie / Blockchain
- **Projet**: marche de fruits decentralise upgradeable (pattern UUPS)
- **Objectif technique**: montrer la continuite d'un contrat via proxy et l'ajout de fonctionnalites en V2 sans changer l'adresse du proxy.

### 2) Architecture technique

- **Smart contracts**:
  - `contracts/FruitMarketV1.sol`
  - `contracts/FruitMarketV2.sol` (heritage de V1)
- **Scripts Hardhat**:
  - `scripts/deploy.ts` (deploiement proxy + implementation)
  - `scripts/upgrade.ts` (upgrade du proxy vers V2)
  - `scripts/sync-abi.mjs` (synchronisation ABI vers le front)
- **Frontend**:
  - Next.js dans `web/`
  - lecture de `web/public/fruit-market-deploy.json`

### 3) Fonctionnalites implementees

#### V1
- creation/edition/desactivation de produits;
- achat avec verification stricte du paiement en ETH;
- stockage des achats;
- protections metier (stock, droits vendeur, produit actif).

#### V2
- notation vendeur post-achat (1 a 5);
- un achat ne peut etre note qu'une seule fois;
- seul l'acheteur de l'achat peut noter;
- calcul de reputation agregée par vendeur.

### 4) Procedure de reproduction (correcteur)

1. **Cloner le depot**  
2. **Installer**:
   ```bash
   npm install
   npm install --prefix web
   ```
3. **Configurer**:
   - `IFT7100_TP3/.env`
   - `IFT7100_TP3/web/.env.local`
4. **Compiler + tester**:
   ```bash
   npm run compile
   npm test
   npm run sync:abi
   ```
5. **Deployer**:
   - local: `npm run node` puis `npm run deploy:local`
   - sepolia: `npm run deploy:sepolia`
6. **Lancer le front**:
   ```bash
   npm run web:dev
   ```
7. **Verifier le parcours**:
   - connexion wallet;
   - ajout produit;
   - achat;
   - notation vendeur (V2).

### 5) Preuves a inclure dans le rapport/video

- adresse **proxy** (celle a conserver dans le temps);
- adresse **implementation** au deploiement;
- preuve d'upgrade (ancienne vs nouvelle implementation);
- extrait des events:
  - `ProductAdded`
  - `ProductPurchased`
  - `SellerRated`
- capture de `fruit-market-deploy.json` (chainId + proxyAddress);
- capture UI montrant une transaction d'achat et une notation.

### 6) Limites et ameliorations possibles

- ajouter pagination/filtres de catalogue;
- ajouter historique vendeur/carnet de commandes;
- ajouter moderation/roles avances;
- ajouter analytics on-chain/off-chain.

### 7) Conclusion

Le projet valide un cycle complet de DApp upgradeable: conception, implementation V1, evolution V2 par upgrade proxy, et demonstration en local puis Sepolia.