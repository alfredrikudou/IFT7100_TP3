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

  if (net.chainId === 31337n) {
    const outDir = path.join(__dirname, "..", "web", "public");
    const outFile = path.join(outDir, "fruit-market-local.json");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      outFile,
      JSON.stringify(
        {
          proxyAddress,
          chainId: Number(net.chainId),
          rpcUrl: "http://127.0.0.1:8545",
        },
        null,
        2,
      ),
    );
    console.log("\nFichier front écrit :", outFile);
    console.log("Relance ou rafraîchis Next.js (npm run web:dev) si besoin.");
  }

  console.log("\nÀ garder pour le README / la vidéo TP :");
  console.log("- Réseau :", net.chainId === 31337n ? "Hardhat local (31337)" : "voir chain id ci-dessus");
  console.log("- Adresse proxy :", proxyAddress);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
