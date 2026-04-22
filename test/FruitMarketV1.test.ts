import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("FruitMarketV1 (proxy UUPS)", function () {
  async function deploy() {
    const [owner, seller, buyer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("FruitMarketV1");
    const proxy = await upgrades.deployProxy(Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();
    const contract = proxy;
    return { contract, owner, seller, buyer };
  }

  it("déploie le proxy et initialise les compteurs", async function () {
    const { contract } = await deploy();
    expect(await contract.nextProductId()).to.equal(1n);
    expect(await contract.nextPurchaseId()).to.equal(1n);
  });

  it("addProduct + getProduct", async function () {
    const { contract, seller } = await deploy();
    await contract.connect(seller).addProduct("Pommes", ethers.parseEther("0.01"), 10n);
    const p = await contract.getProduct(1);
    expect(p.name).to.equal("Pommes");
    expect(p.stock).to.equal(10n);
    expect(p.seller).to.equal(seller.address);
    expect(p.active).to.be.true;
  });

  it("purchaseProduct transfère au vendeur et diminue le stock", async function () {
    const { contract, seller, buyer } = await deploy();
    await contract.connect(seller).addProduct("Bananes", ethers.parseEther("0.02"), 5n);

    const price = ethers.parseEther("0.04"); // 2 × 0.02
    const sellerBalBefore = await ethers.provider.getBalance(seller.address);

    await contract.connect(buyer).purchaseProduct(1, 2, { value: price });

    const p = await contract.getProduct(1);
    expect(p.stock).to.equal(3n);

    const sellerBalAfter = await ethers.provider.getBalance(seller.address);
    expect(sellerBalAfter - sellerBalBefore).to.equal(price);
  });
});
