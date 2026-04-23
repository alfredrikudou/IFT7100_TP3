import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("FruitMarketV2 — notation acheteurs", function () {
  async function deploy() {
    const [owner, seller, buyer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("FruitMarketV2");
    const proxy = await upgrades.deployProxy(Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();
    const contract = proxy;
    return { contract, owner, seller, buyer, other };
  }

  it("seul l’acheteur peut noter un achat", async function () {
    const { contract, owner, buyer, other } = await deploy();
    const pid = 1;
    const price = ethers.parseEther("0.001");
    await contract.connect(buyer).purchaseProduct(pid, 1, { value: price });

    await expect(contract.connect(other).rateSeller(1, 5)).to.be.revertedWithCustomError(
      contract,
      "NotPurchaseBuyer",
    );

    await expect(contract.rateSeller(1, 5)).to.be.revertedWithCustomError(contract, "NotPurchaseBuyer");

    await contract.connect(buyer).rateSeller(1, 5);

    expect(await contract.isPurchaseRated(1)).to.be.true;

    const [totalScore, totalRatings, avg100] = await contract.getSellerRating(owner.address);
    expect(totalRatings).to.equal(1n);
    expect(totalScore).to.equal(5n);
    expect(avg100).to.equal(500n);
  });

  it("interdit une seconde notation pour le même achat", async function () {
    const { contract, buyer } = await deploy();
    await contract.connect(buyer).purchaseProduct(1, 1, { value: ethers.parseEther("0.001") });

    await contract.connect(buyer).rateSeller(1, 4);

    await expect(contract.connect(buyer).rateSeller(1, 5)).to.be.revertedWithCustomError(
      contract,
      "PurchaseAlreadyRated",
    );
  });

  it("rejette une note hors 1–5", async function () {
    const { contract, buyer } = await deploy();
    await contract.connect(buyer).purchaseProduct(1, 1, { value: ethers.parseEther("0.001") });

    await expect(contract.connect(buyer).rateSeller(1, 0)).to.be.revertedWithCustomError(
      contract,
      "InvalidRating",
    );
    await expect(contract.connect(buyer).rateSeller(1, 6)).to.be.revertedWithCustomError(
      contract,
      "InvalidRating",
    );
  });

  it("rejette une notation pour un purchaseId inexistant", async function () {
    const { contract, buyer } = await deploy();

    await expect(contract.connect(buyer).rateSeller(99, 3)).to.be.revertedWithCustomError(
      contract,
      "PurchaseNotFound",
    );
  });

  it("agrège plusieurs votes pour le même vendeur", async function () {
    const { contract, owner, buyer } = await deploy();
    await contract.connect(buyer).purchaseProduct(1, 1, { value: ethers.parseEther("0.001") });
    await contract.connect(buyer).purchaseProduct(2, 1, { value: ethers.parseEther("0.002") });

    await contract.connect(buyer).rateSeller(1, 5);
    await contract.connect(buyer).rateSeller(2, 4);

    const sellerScore = await contract.getSellerRating(owner.address);
    expect(sellerScore.totalRatings).to.equal(2n);
    expect(sellerScore.totalScore).to.equal(9n);
    expect(sellerScore.averageScaledBy100).to.equal(450n);
  });
});
