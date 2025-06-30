// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./PlatformNFT.sol";

/**
 * @title NFTMarketplaceV2
 * @dev Enhanced marketplace compatible with PlatformNFTv2 (AccessControl)
 */
contract NFTMarketplace is ReentrancyGuard, Ownable, Pausable {
    PlatformNFT public nftContract;
    
    enum ListingType { FIXED_PRICE, AUCTION }
    enum ListingStatus { ACTIVE, SOLD, CANCELLED, ENDED } // 新增ENDED状态
    
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price; // 对于拍卖，这是起始价
        ListingType listingType;
        ListingStatus status;
        uint256 endTime; // 仅用于拍卖
        address highestBidder; // 仅用于拍卖
        uint256 highestBid; // 仅用于拍卖
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }
    
    struct MarketplaceStats {
        uint256 totalListings;
        uint256 totalSales;
        uint256 totalVolume;
        uint256 totalNFTs;
        uint256 activeListings;
    }
    
    uint256 private _listingIdCounter;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(uint256 => uint256) public tokenToListingId;
    
    uint256 public marketplaceFee = 250; // 2.5%
    address public feeRecipient;
    
    uint256 public totalSales;
    uint256 public totalVolume;
    uint256 public activeListingsCount;
    
    // --- Events ---
    event ItemListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 price, ListingType listingType, uint256 endTime);
    event ItemSold(uint256 indexed listingId, uint256 indexed tokenId, address indexed buyer, address seller, uint256 price);
    event PriceUpdated(uint256 indexed listingId, uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);
    event BidPlaced(uint256 indexed listingId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed listingId, address winner, uint256 amount);
    event AuctionSettled(uint256 indexed listingId, address indexed winner, uint256 amount);
    event ListingCancelled(uint256 indexed listingId);
    event Withdrawal(address indexed user, uint256 amount);
    
    // --- Modifiers ---
    modifier validListing(uint256 listingId) {
        require(listingId < _listingIdCounter, "Invalid listing");
        require(listings[listingId].status == ListingStatus.ACTIVE, "Listing not active");
        _;
    }
    
    constructor(address _nftContract, address _feeRecipient) Ownable(msg.sender) {
        nftContract = PlatformNFT(_nftContract);
        feeRecipient = _feeRecipient;
    }
    
    // --- Core Functions ---
    
    function listItem(uint256 tokenId, uint256 price, ListingType listingType, uint256 auctionDuration) 
        external nonReentrant whenNotPaused returns (uint256 listingId) 
    {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Debug Step 1 Failed: Not token owner");
        
        bool isApproved = nftContract.isApprovedForAll(msg.sender, address(this)) || nftContract.getApproved(tokenId) == address(this);
        require(isApproved, "Debug Step 2 Failed: Contract not approved");
        
        require(price > 0, "Debug Step 3 Failed: Price must be positive");
        
        listingId = _listingIdCounter++;
        
        uint256 endTime = 0;
        if (listingType == ListingType.AUCTION) {
            require(auctionDuration > 0, "Invalid auction duration");
            endTime = block.timestamp + auctionDuration;
        }
        
        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            listingType: listingType,
            status: ListingStatus.ACTIVE,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        tokenToListingId[tokenId] = listingId;
        activeListingsCount++;
        
        emit ItemListed(listingId, tokenId, msg.sender, price, listingType, endTime);
    }
    
    function updatePrice(uint256 listingId, uint256 newPrice) external validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.listingType == ListingType.FIXED_PRICE, "Not fixed price");
        require(newPrice > 0, "Price must be positive");
        
        uint256 oldPrice = listing.price;
        listing.price = newPrice;
        listing.updatedAt = block.timestamp;
        
        emit PriceUpdated(listingId, listing.tokenId, oldPrice, newPrice);
    }
    
    function buyItem(uint256 listingId) external payable nonReentrant whenNotPaused validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Not direct sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(listing.seller != msg.sender, "Cannot buy own item");
        
        _settleSale(listingId, msg.sender);
    }
    
    function placeBid(uint256 listingId) external payable nonReentrant whenNotPaused validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.AUCTION, "Not auction");
        require(block.timestamp < listing.endTime, "Auction ended");
        require(msg.sender != listing.seller, "Cannot bid on own item");

        // 首次出价必须高于或等于起始价
        if (listing.highestBidder == address(0)) {
            require(msg.value >= listing.price, "Bid must be >= start price");
        } else {
        require(msg.value > listing.highestBid, "Bid too low");
        }
        
        // 安全地退还上一个出价者的资金
        if (listing.highestBidder != address(0)) {
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }
        
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;
        
        auctionBids[listingId].push(Bid(msg.sender, msg.value, block.timestamp));
        emit BidPlaced(listingId, msg.sender, msg.value);
    }
    
    function endAuction(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.AUCTION, "Not auction");
        require(block.timestamp >= listing.endTime, "Auction not ended yet");
        
        listing.status = ListingStatus.ENDED;
        activeListingsCount--;
        
        if (listing.highestBidder != address(0)) {
            // 有人出价，结算拍卖
            _settleSale(listingId, listing.highestBidder);
            emit AuctionSettled(listingId, listing.highestBidder, listing.highestBid);
        } else {
            // 无人出价，流拍
            emit ListingCancelled(listingId);
            }
        emit AuctionEnded(listingId, listing.highestBidder, listing.highestBid);
    }
    
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.seller == msg.sender || msg.sender == owner(), "Not authorized");
        
        // 如果是拍卖，只允许在无人出价时取消
        if (listing.listingType == ListingType.AUCTION) {
            require(listing.highestBidder == address(0), "Cannot cancel active auction");
        }
        
        listing.status = ListingStatus.CANCELLED;
        activeListingsCount--;
        
        emit ListingCancelled(listingId);
    }
    
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit Withdrawal(msg.sender, amount);
    }
    
    // --- Internal Functions ---

    function _settleSale(uint256 listingId, address buyer) internal {
        Listing storage listing = listings[listingId];
        
        // 只有在售出时才将状态标记为SOLD并减少计数
        if (listing.status == ListingStatus.ACTIVE || listing.status == ListingStatus.ENDED) {
            listing.status = ListingStatus.SOLD;
            // 对于固定价格，在此处减少计数；对于拍卖，已在endAuction中减少
            if(listing.listingType == ListingType.FIXED_PRICE) {
                activeListingsCount--;
            }
        } else {
            revert("Listing not in a valid state to be sold");
        }

        address seller = listing.seller;
        uint256 price = listing.listingType == ListingType.FIXED_PRICE ? listing.price : listing.highestBid;
        uint256 tokenId = listing.tokenId;

        _distributeFunds(seller, price, tokenId);
        
        nftContract.safeTransferFrom(seller, buyer, tokenId);
        
        if (msg.value > price) {
            payable(buyer).transfer(msg.value - price);
        }
        
        totalSales++;
        totalVolume += price;
        
        emit ItemSold(listingId, tokenId, buyer, seller, price);
    }

    function _distributeFunds(address seller, uint256 price, uint256 tokenId) internal {
        uint256 fee = (price * marketplaceFee) / 10000;
        
        // No need to get royalty info from a separate function, as it's public in v2
        uint256 royaltyRate = nftContract.royalties(tokenId);
        uint256 royaltyAmount = (price * royaltyRate) / 10000;
        address royaltyRecipient = nftContract.creators(tokenId);
        
        uint256 sellerAmount = price - fee - royaltyAmount;
        
        if (sellerAmount > 0) payable(seller).transfer(sellerAmount);
        if (fee > 0) payable(feeRecipient).transfer(fee);
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }
    }

    // --- View Functions ---
    
    function getMarketplaceStats() external view returns (MarketplaceStats memory) {
        return MarketplaceStats(
            _listingIdCounter,
            totalSales,
            totalVolume,
            nftContract.totalSupply(),
            activeListingsCount
        );
    }
    
    function getUserListings(address user, uint256 offset, uint256 limit) external view returns (uint256[] memory, uint256, bool) {
        require(limit > 0 && limit <= 100, "Invalid limit");
        
        uint256[] memory userListingIds = new uint256[](_listingIdCounter);
        uint256 count = 0;
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (listings[i].seller == user) {
                userListingIds[count] = i;
                count++;
            }
        }
        
        uint256 returnCount = 0;
        if (offset < count) {
            returnCount = count - offset > limit ? limit : count - offset;
            }

        uint256[] memory pagedIds = new uint256[](returnCount);
        for(uint256 i = 0; i < returnCount; i++) {
            pagedIds[i] = userListingIds[offset + i];
        }
        
        return (pagedIds, count, offset + returnCount < count);
    }
    
    function getUserListingCount(address user) external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (listings[i].seller == user) count++;
        }
        return count;
    }
    
    function getListing(uint256 listingId) external view returns (Listing memory) {
        require(listingId < _listingIdCounter, "Invalid listing");
        return listings[listingId];
    }
    
    function getListingCount() external view returns (uint256) {
        return _listingIdCounter;
    }

    // --- Admin Functions ---
    
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = _fee;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function pause() external onlyOwner { _pause(); }
    
    function unpause() external onlyOwner { _unpause(); }
} 