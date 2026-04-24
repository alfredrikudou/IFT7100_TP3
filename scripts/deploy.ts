import { ethers, upgrades } from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Déploie FruitMarketV2 derrière un proxy UUPS (hérite V1 ; notation vendeur en V2).
 * Sur localhost : écrit aussi web/public/fruit-market-local.json pour le front Next.js.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec :", deployer.address);

  const FruitMarketV2 = await ethers.getContractFactory("FruitMarketV2");
  const proxy = await upgrades.deployProxy(FruitMarketV2, [], {
    initializer: "initialize",
    kind: "uups",
  });
  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const net = await ethers.provider.getNetwork();

  console.log("Proxy FruitMarket (à utiliser dans le front / MetaMask) :", proxyAddress);
  console.log("Implémentation V2 :", implAddress);
  console.log("Chain ID :", net.chainId.toString());

  const outDir = path.join(__dirname, "..", "web", "public");
  fs.mkdirSync(outDir, { recursive: true });

  const deployPayload = {
    proxyAddress,
    chainId: Number(net.chainId),
    /** Lecture catalogue : Hardhat local via proxy Next ; Sepolia via /api/rpc-sepolia (voir web/.env.example). */
    rpcUrl:
      net.chainId === 31337n
        ? "http://127.0.0.1:8545"
        : process.env.SEPOLIA_RPC_URL ?? "",
  };

  const deployFile = path.join(outDir, "fruit-market-deploy.json");
  fs.writeFileSync(deployFile, JSON.stringify(deployPayload, null, 2));
  console.log("\nConfig front (prioritaire pour Next.js) :", deployFile);

  if (net.chainId === 31337n) {
    const localAlias = path.join(outDir, "fruit-market-local.json");
    fs.writeFileSync(localAlias, JSON.stringify(deployPayload, null, 2));
    console.log("Alias local dev :", localAlias);
    console.log("Relance ou rafraîchis Next.js (npm run web:dev) si besoin.");
  } else if (!deployPayload.rpcUrl) {
    console.warn(
      "\n⚠ SEPOLIA_RPC_URL vide : ajoute-la dans web/.env.local pour que /api/rpc-sepolia fonctionne.",
    );
  }

  console.log("\nÀ garder pour le README / la vidéo TP :");
  console.log(
    "- Réseau :",
    net.chainId === 31337n
      ? "Hardhat local (31337)"
      : net.chainId === 11155111n
        ? "Sepolia (11155111)"
        : `chain id ${net.chainId}`,
  );
  console.log("- Adresse proxy :", proxyAddress);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
