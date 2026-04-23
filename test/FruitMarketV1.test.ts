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
    const { contract, owner } = await deploy();
    expect(await contract.nextProductId()).to.equal(4n);
    expect(await contract.nextPurchaseId()).to.equal(1n);
    const def = await contract.getProduct(1);
    expect(def.seller).to.equal(owner.address);
    expect(def.name).to.equal("Pommes Cortland");
  });

  it("addProduct + getProduct", async function () {
    const { contract, seller } = await deploy();
    await contract.connect(seller).addProduct(
      "Pommes",
      ethers.parseEther("0.01"),
      10n,
      "Cortland, Québec",
      0,
    );
    const p = await contract.getProduct(4);
    expect(p.name).to.equal("Pommes");
    expect(p.description).to.equal("Cortland, Québec");
    expect(p.iconId).to.equal(0);
    expect(p.stock).to.equal(10n);
    expect(p.seller).to.equal(seller.address);
    expect(p.active).to.be.true;
  });

  it("updateProduct : le vendeur met à jour le stock et le prix avec succès", async function () {
    const { contract, seller } = await deploy();
    await contract.connect(seller).addProduct(
      "Poires",
      ethers.parseEther("0.02"),
      10n,
      "Williams",
      1,
    );

    await contract.connect(seller).updateProduct(
      4,
      ethers.parseEther("0.035"),
      42n,
      true,
    );

    const p = await contract.getProduct(4);
    expect(p.priceWei).to.equal(ethers.parseEther("0.035"));
    expect(p.stock).to.equal(42n);
    expect(p.active).to.be.true;
    expect(p.name).to.equal("Poires");
    expect(p.description).to.equal("Williams");
  });

  it("purchaseProduct transfère au vendeur et diminue le stock", async function () {
    const { contract, seller, buyer } = await deploy();
    await contract.connect(seller).addProduct(
      "Bananes",
      ethers.parseEther("0.02"),
      5n,
      "",
      3,
    );

    const price = ethers.parseEther("0.04"); // 2 × 0.02
    const sellerBalBefore = await ethers.provider.getBalance(seller.address);

    await contract.connect(buyer).purchaseProduct(4, 2, { value: price });

    const p = await contract.getProduct(4);
    expect(p.stock).to.equal(3n);

    const sellerBalAfter = await ethers.provider.getBalance(seller.address);
    expect(sellerBalAfter - sellerBalBefore).to.equal(price);

    const pu = await contract.getPurchase(1);
    expect(pu.buyer).to.equal(buyer.address);
    expect(pu.productId).to.equal(4n);
    expect(pu.quantity).to.equal(2n);
    expect(pu.totalPaid).to.equal(price);
  });

  it("updateProduct : revert NotProductSeller si ce n’est pas le vendeur", async function () {
    const { contract, seller, buyer } = await deploy();
    await contract.connect(seller).addProduct(
      "Cerises",
      ethers.parseEther("0.03"),
      10n,
      "",
      2,
    );
    await expect(
      contract.connect(buyer).updateProduct(4, ethers.parseEther("0.04"), 10n, true),
    )
      .to.be.revertedWithCustomError(contract, "NotProductSeller")
      .withArgs(4n);
  });

  it("purchaseProduct : paiement incorrect revert InvalidPayment et ne modifie pas stock ni achats", async function () {
    const { contract, seller, buyer } = await deploy();
    await contract.connect(seller).addProduct(
      "Framboises",
      ethers.parseEther("0.05"),
      8n,
      "",
      0,
    );

    const expectedTotal = ethers.parseEther("0.05") * 2n;
    const wrongValue = ethers.parseEther("0.05");

    await expect(
      contract.connect(buyer).purchaseProduct(4, 2, { value: wrongValue }),
    )
      .to.be.revertedWithCustomError(contract, "InvalidPayment")
      .withArgs(expectedTotal, wrongValue);

    const p = await contract.getProduct(4);
    expect(p.stock).to.equal(8n);
    expect(await contract.nextPurchaseId()).to.equal(1n);
  });
});
