/**
 * Copie l’ABI compilé vers web/src/contracts (pour import côté Next.js).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const artifactPath = path.join(
  root,
  "artifacts/contracts/FruitMarketV1.sol/FruitMarketV1.json",
);
const destDir = path.join(root, "web/src/contracts");
const destAbi = path.join(destDir, "FruitMarketV1.abi.json");

if (!fs.existsSync(artifactPath)) {
  console.error("Artifact introuvable. Lance d’abord : npm run compile");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(destAbi, JSON.stringify(artifact.abi, null, 2));
console.log("ABI copiée vers", destAbi);
