const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Enhanced NFT Marketplace Security Tests", function () {
  let platformNFT, nftMarketplace;
  let owner, addr1, addr2, addr3;
  let mintFee;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy PlatformNFT
    const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
    platformNFT = await PlatformNFT.deploy();
    await platformNFT.waitForDeployment();

    // Deploy NFTMarketplace
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    nftMarketplace = await NFTMarketplace.deploy(
      await platformNFT.getAddress(),
      owner.address
    );
    await nftMarketplace.waitForDeployment();

    mintFee = await platformNFT.mintFee();
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause and unpause PlatformNFT", async function () {
      // Test pause
      await platformNFT.pause();
      expect(await platformNFT.paused()).to.be.true;

      // Test that minting fails when paused
      await expect(
        platformNFT.connect(addr1).mint(
          addr1.address,
          "ipfs://test-uri",
          250,
          { value: mintFee }
        )
      ).to.be.revertedWithCustomError(platformNFT, "EnforcedPause");

      // Test unpause
      await platformNFT.unpause();
      expect(await platformNFT.paused()).to.be.false;

      // Test that minting works after unpause
      await expect(
        platformNFT.connect(addr1).mint(
          addr1.address,
          "ipfs://test-uri",
          250,
          { value: mintFee }
        )
      ).to.not.be.reverted;
    });

    it("Should allow owner to pause and unpause NFTMarketplace", async function () {
      // First mint an NFT for testing
      await platformNFT.connect(addr1).mint(
        addr1.address,
        "ipfs://test-uri",
        250,
        { value: mintFee }
      );

      // Approve marketplace
      await platformNFT.connect(addr1).setApprovalForAll(
        await nftMarketplace.getAddress(),
        true
      );

      // Test pause marketplace
      await nftMarketplace.pause();
      expect(await nftMarketplace.paused()).to.be.true;

      // Test that listing fails when paused
      await expect(
        nftMarketplace.connect(addr1).listItem(
          0, // tokenId
          ethers.parseEther("1"), // price
          0, // ListingType.FIXED_PRICE
          0  // auctionDuration
        )
      ).to.be.revertedWithCustomError(nftMarketplace, "EnforcedPause");

      // Test unpause
      await nftMarketplace.unpause();
      expect(await nftMarketplace.paused()).to.be.false;

      // Test that listing works after unpause
      await expect(
        nftMarketplace.connect(addr1).listItem(
          0,
          ethers.parseEther("1"),
          0,
          0
        )
      ).to.not.be.reverted;
    });

    it("Should reject pause/unpause from non-owner", async function () {
      await expect(
        platformNFT.connect(addr1).pause()
      ).to.be.revertedWithCustomError(platformNFT, "OwnableUnauthorizedAccount");

      await expect(
        nftMarketplace.connect(addr1).pause()
      ).to.be.revertedWithCustomError(nftMarketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("ERC-2981 Royalty Standard", function () {
    it("Should return correct royalty info", async function () {
      // Mint NFT with 5% royalty (500 basis points)
      await platformNFT.connect(addr1).mint(
        addr1.address,
        "ipfs://test-uri",
        500,
        { value: mintFee }
      );

      const salePrice = ethers.parseEther("10");
      const [receiver, royaltyAmount] = await platformNFT.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(addr1.address); // Creator is addr1
      expect(royaltyAmount).to.equal(ethers.parseEther("0.5")); // 5% of 10 ETH
    });

    it("Should return zero royalty for non-existent token", async function () {
      await expect(
        platformNFT.royaltyInfo(999, ethers.parseEther("10"))
      ).to.be.revertedWith("NFT does not exist");
    });

    it("Should support ERC-2981 interface", async function () {
      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await platformNFT.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Gas DoS Prevention", function () {
    beforeEach(async function () {
      // Create multiple listings for testing
      for (let i = 0; i < 5; i++) {
        await platformNFT.connect(addr1).mint(
          addr1.address,
          `ipfs://test-uri-${i}`,
          250,
          { value: mintFee }
        );
      }

      // Approve marketplace
      await platformNFT.connect(addr1).setApprovalForAll(
        await nftMarketplace.getAddress(),
        true
      );

      // Create listings
      for (let i = 0; i < 5; i++) {
        await nftMarketplace.connect(addr1).listItem(
          i,
          ethers.parseEther("1"),
          0, // FIXED_PRICE
          0
        );
      }
    });

    it("Should return paginated user listings", async function () {
      // Test first page
      const [listingIds1, totalCount1, hasMore1] = await nftMarketplace.getUserListings(
        addr1.address,
        0, // offset
        3  // limit
      );

      expect(listingIds1.length).to.equal(3);
      expect(totalCount1).to.equal(5);
      expect(hasMore1).to.be.true;

      // Test second page
      const [listingIds2, totalCount2, hasMore2] = await nftMarketplace.getUserListings(
        addr1.address,
        3, // offset
        3  // limit
      );

      expect(listingIds2.length).to.equal(2); // Remaining 2 items
      expect(totalCount2).to.equal(5);
      expect(hasMore2).to.be.false;
    });

    it("Should enforce pagination limits", async function () {
      await expect(
        nftMarketplace.getUserListings(addr1.address, 0, 0)
      ).to.be.revertedWith("Invalid limit");

      await expect(
        nftMarketplace.getUserListings(addr1.address, 0, 101)
      ).to.be.revertedWith("Invalid limit");
    });

    it("Should maintain active listings counter", async function () {
      const statsBefore = await nftMarketplace.getMarketplaceStats();
      expect(statsBefore.activeListings).to.equal(5);

      // Buy one item
      await nftMarketplace.connect(addr2).buyItem(0, {
        value: ethers.parseEther("1")
      });

      const statsAfter = await nftMarketplace.getMarketplaceStats();
      expect(statsAfter.activeListings).to.equal(4);
    });

    it("Should return user listing count efficiently", async function () {
      const count = await nftMarketplace.getUserListingCount(addr1.address);
      expect(count).to.equal(5);

      const countEmpty = await nftMarketplace.getUserListingCount(addr2.address);
      expect(countEmpty).to.equal(0);
    });
  });

  describe("Metadata Security", function () {
    it("Should emit warning for non-decentralized metadata", async function () {
      await expect(
        platformNFT.connect(addr1).mint(
          addr1.address,
          "https://example.com/metadata.json", // Centralized URI
          250,
          { value: mintFee }
        )
      ).to.emit(platformNFT, "MetadataSecurityWarning")
        .withArgs(0, "Consider using IPFS or Arweave for immutable metadata");
    });

    it("Should not emit warning for IPFS metadata", async function () {
      await expect(
        platformNFT.connect(addr1).mint(
          addr1.address,
          "ipfs://QmTest123",
          250,
          { value: mintFee }
        )
      ).to.not.emit(platformNFT, "MetadataSecurityWarning");
    });

    it("Should not emit warning for Arweave metadata", async function () {
      await expect(
        platformNFT.connect(addr1).mint(
          addr1.address,
          "ar://test123",
          250,
          { value: mintFee }
        )
      ).to.not.emit(platformNFT, "MetadataSecurityWarning");
    });
  });

  describe("Enhanced Security Features Integration", function () {
    it("Should maintain all existing functionality while adding security", async function () {
      // Test complete flow with security features
      
      // 1. Mint NFT (with metadata check)
      await platformNFT.connect(addr1).mint(
        addr1.address,
        "ipfs://test-secure-uri",
        500, // 5% royalty
        { value: mintFee }
      );

      // 2. Approve and list
      await platformNFT.connect(addr1).setApprovalForAll(
        await nftMarketplace.getAddress(),
        true
      );

      await nftMarketplace.connect(addr1).listItem(
        0,
        ethers.parseEther("10"),
        0, // FIXED_PRICE
        0
      );

      // 3. Check marketplace stats
      const stats = await nftMarketplace.getMarketplaceStats();
      expect(stats.activeListings).to.equal(1);
      expect(stats.totalNFTs).to.equal(1);

      // 4. Buy NFT (with royalty payment)
      const buyTx = await nftMarketplace.connect(addr2).buyItem(0, {
        value: ethers.parseEther("10")
      });

      // 5. Verify royalty info still works
      const [receiver, royaltyAmount] = await platformNFT.royaltyInfo(
        0, 
        ethers.parseEther("10")
      );
      expect(receiver).to.equal(addr1.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.5"));

      // 6. Check updated stats
      const finalStats = await nftMarketplace.getMarketplaceStats();
      expect(finalStats.activeListings).to.equal(0);
      expect(finalStats.totalSales).to.equal(1);
    });

    it("Should handle edge cases properly", async function () {
      // Test empty user listings
      const [emptyListings, totalCount, hasMore] = await nftMarketplace.getUserListings(
        addr3.address,
        0,
        10
      );
      expect(emptyListings.length).to.equal(0);
      expect(totalCount).to.equal(0);
      expect(hasMore).to.be.false;

      // Test royalty info for zero royalty
      await platformNFT.connect(addr1).mint(
        addr1.address,
        "ipfs://test-uri",
        0, // 0% royalty
        { value: mintFee }
      );

      const [receiver, royaltyAmount] = await platformNFT.royaltyInfo(
        0,
        ethers.parseEther("10")
      );
      expect(receiver).to.equal(ethers.ZeroAddress);
      expect(royaltyAmount).to.equal(0);
    });
  });
}); 