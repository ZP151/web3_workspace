const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace - Final Anvil Tests", function () {
    let nftMarketplace, platformNFT, timeLock;
    let owner, seller, bidder1, bidder2;

    const MINT_FEE = ethers.parseEther("0.001");
    const MARKETPLACE_FEE = 250;
    const MIN_DELAY = 0;

    async function increaseTime(seconds) {
        await ethers.provider.send("evm_increaseTime", [seconds]);
        await ethers.provider.send("evm_mine");
    }

    // Use beforeEach to ensure a fresh state for every single test on Anvil
    beforeEach(async function () {
        [owner, seller, bidder1, bidder2] = await ethers.getSigners();

        // Deploy PlatformTimeLock
        const TimeLock = await ethers.getContractFactory("PlatformTimeLock");
        timeLock = await TimeLock.deploy(MIN_DELAY, [owner.address], [owner.address], owner.address);
        await timeLock.waitForDeployment();

        // Deploy PlatformNFTv3
        const PlatformNFTv3 = await ethers.getContractFactory("PlatformNFTv3");
        platformNFT = await PlatformNFTv3.deploy(owner.address, await timeLock.getAddress());
        await platformNFT.waitForDeployment();

        // Deploy the Marketplace contract
        const NFTMarketplaceV2 = await ethers.getContractFactory("NFTMarketplaceV2");
        nftMarketplace = await NFTMarketplaceV2.deploy(
            await platformNFT.getAddress(),
            owner.address
        );
        await nftMarketplace.waitForDeployment();
        await nftMarketplace.connect(owner).setMarketplaceFee(MARKETPLACE_FEE);
    });

    describe("Auction and Sale Tests on Anvil", function () {

        it("Should allow a valid bid on a fresh auction", async function () {
            // Mint, approve, and list within the test for complete isolation
            const mintTx = await platformNFT.connect(seller).mint(seller.address, "ipfs://anvil-auction", 500, { value: MINT_FEE });
            await mintTx.wait();
            const tokenId = (await platformNFT.totalSupply()) - 1n;
            
            const approveTx = await platformNFT.connect(seller).setApprovalForAll(await nftMarketplace.getAddress(), true);
            await approveTx.wait();
            
            const listTx = await nftMarketplace.connect(seller).listItem(tokenId, ethers.parseEther("1"), 1, 120);
            await listTx.wait();
            const listingId = (await nftMarketplace.getListingCount()) - 1n;
            
            await expect(nftMarketplace.connect(bidder1).placeBid(listingId, { value: ethers.parseEther("1.1") }))
                .to.emit(nftMarketplace, "BidPlaced");
        });

        it("Should allow a direct purchase on a fresh listing", async function () {
            // Mint, approve, and list within the test
            const mintTx = await platformNFT.connect(seller).mint(seller.address, "ipfs://anvil-sale", 250, { value: MINT_FEE });
            await mintTx.wait();
            const tokenId = (await platformNFT.totalSupply()) - 1n;

            const approveTx = await platformNFT.connect(seller).setApprovalForAll(await nftMarketplace.getAddress(), true);
            await approveTx.wait();

            const listPrice = ethers.parseEther("2");
            const listTx = await nftMarketplace.connect(seller).listItem(tokenId, listPrice, 0, 0);
            await listTx.wait();
            const listingId = (await nftMarketplace.getListingCount()) - 1n;

            await nftMarketplace.connect(bidder1).buyItem(listingId, { value: listPrice });
            expect(await platformNFT.ownerOf(tokenId)).to.equal(bidder1.address);
        });
    });
}); 