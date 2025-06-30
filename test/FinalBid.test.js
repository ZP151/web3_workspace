const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace - Final Bid Test", function () {
    let nftMarketplace, platformNFT;
    let owner, seller, bidder1;

    const MINT_FEE = ethers.parseEther("0.001");

    before(async function () {
        [owner, seller, bidder1] = await ethers.getSigners();

        const PlatformNFTv2 = await ethers.getContractFactory("PlatformNFTv2");
        platformNFT = await PlatformNFTv2.deploy(owner.address);
        await platformNFT.waitForDeployment();
        await platformNFT.connect(owner).setMintFee(MINT_FEE);

        const NFTMarketplaceV2 = await ethers.getContractFactory("NFTMarketplaceV2");
        nftMarketplace = await NFTMarketplaceV2.deploy(
            await platformNFT.getAddress(),
            owner.address
        );
        await nftMarketplace.waitForDeployment();
    });

    it("Should successfully accept a valid bid on an auction", async function () {
        // 1. Mint a new NFT for the test
        const mintTx = await platformNFT.connect(seller).publicMint(seller.address, "ipfs://final-test", 500, { value: MINT_FEE });
        await mintTx.wait();
        const tokenId = (await platformNFT.totalSupply()) - 1n;

        // 2. Approve the marketplace
        const approveTx = await platformNFT.connect(seller).setApprovalForAll(await nftMarketplace.getAddress(), true);
        await approveTx.wait();

        // 3. List the item for auction
        const startPrice = ethers.parseEther("1");
        const listTx = await nftMarketplace.connect(seller).listItem(tokenId, startPrice, 1, 120); // 2 min auction
        await listTx.wait();
        const listingId = (await nftMarketplace.getListingCount()) - 1n;

        // 4. Place the bid
        const bidAmount = ethers.parseEther("1.1");
        
        console.log(`Placing bid of ${ethers.formatEther(bidAmount)} ETH for listing #${listingId} with start price of ${ethers.formatEther(startPrice)} ETH`);

        await expect(nftMarketplace.connect(bidder1).placeBid(listingId, { value: bidAmount }))
            .to.emit(nftMarketplace, "BidPlaced")
            .withArgs(listingId, bidder1.address, bidAmount);
            
        const listing = await nftMarketplace.getListing(listingId);
        expect(listing.highestBidder).to.equal(bidder1.address);
        expect(listing.highestBid).to.equal(bidAmount);

        console.log("Test passed: Bid was successfully placed and recorded.");
    });
}); 