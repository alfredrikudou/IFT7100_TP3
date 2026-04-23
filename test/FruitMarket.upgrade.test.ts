import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("FruitMarket upgrade V1 → V2 (proxy UUPS)", function () {
  it("conserve le storage et permet rateSeller après upgrade", async function () {
    const [, seller, buyer] = await ethers.getSigners();

    const V1Factory = await ethers.getContractFactory("FruitMarketV1");
    const proxy = await upgrades.deployProxy(V1Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();
    const proxyAddr = await proxy.getAddress();

    const v1 = await ethers.getContractAt("FruitMarketV1", proxyAddr);
    expect(await v1.nextProductId()).to.equal(4n);

    await v1.connect(seller).addProduct("Kiwi", ethers.parseEther("0.01"), 5n, "", 1);
    expect(await v1.nextProductId()).to.equal(5n);

    const kiwiBefore = await v1.getProduct(4);
    expect(kiwiBefore.name).to.equal("Kiwi");
    expect(kiwiBefore.stock).to.equal(5n);

    const V2Factory = await ethers.getContractFactory("FruitMarketV2");
    await upgrades.upgradeProxy(proxyAddr, V2Factory);

    const v2 = await ethers.getContractAt("FruitMarketV2", proxyAddr);
    expect(await v2.nextProductId()).to.equal(5n);

    const kiwiAfter = await v2.getProduct(4);
    expect(kiwiAfter.name).to.equal("Kiwi");
    expect(kiwiAfter.stock).to.equal(5n);

    await v2.connect(buyer).purchaseProduct(4, 1, { value: ethers.parseEther("0.01") });

    const purchase = await v2.getPurchase(1);
    expect(purchase.buyer).to.equal(buyer.address);
    expect(purchase.productId).to.equal(4n);
    expect(purchase.seller).to.equal(seller.address);

    await v2.connect(buyer).rateSeller(1, 4);

    expect(await v2.isPurchaseRated(1)).to.equal(true);
    const rating = await v2.getSellerRating(seller.address);
    expect(rating.totalRatings).to.equal(1n);
    expect(rating.totalScore).to.equal(4n);
  });
});
