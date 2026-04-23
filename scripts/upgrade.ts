import { ethers, upgrades } from "hardhat";

/**
 * Upgrade UUPS : proxy existant (souvent FruitMarketV1) → FruitMarketV2.
 * Prérequis : PROXY_ADDRESS dans `.env`, compte déployeur = owner du contrat (UUPS).
 */
async function main() {
  const proxyAddress = process.env.PROXY_ADDRESS?.trim();
  if (!proxyAddress) {
    throw new Error(
      "Définissez PROXY_ADDRESS dans .env (adresse du contrat proxy, pas l’implémentation).",
    );
  }

  console.log("Proxy:", proxyAddress);

  const FruitMarketV2 = await ethers.getContractFactory("FruitMarketV2");
  console.log("Upgrade vers FruitMarketV2...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, FruitMarketV2);
  await upgraded.waitForDeployment();

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Nouvelle implémentation (ERC-1967):", implAddress);
  console.log("Terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
