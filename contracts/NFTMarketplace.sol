// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/**
 * @title PlatformNFT
 * @dev 平台NFT合约
 */
contract PlatformNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public royalties; // 版税百分比 (basis points)
    
    uint256 public mintFee = 0.001 ether;
    
    event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);
    
    constructor() ERC721("Platform NFT", "PNFT") Ownable(msg.sender) {}
    
    function mint(address to, string memory tokenURI, uint256 royalty) external payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(royalty <= 1000, "Royalty too high"); // 最大10%
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        creators[tokenId] = msg.sender;
        royalties[tokenId] = royalty;
        
        emit NFTMinted(tokenId, msg.sender, tokenURI);
        return tokenId;
    }
    
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function setMintFee(uint256 _mintFee) external onlyOwner {
        mintFee = _mintFee;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Override functions for multiple inheritance
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * @title NFTMarketplace
 * @dev NFT市场合约，支持直销和拍卖
 */
contract NFTMarketplace is ReentrancyGuard, Ownable {
    PlatformNFT public nftContract;
    
    enum ListingType { FIXED_PRICE, AUCTION }
    enum ListingStatus { ACTIVE, SOLD, CANCELLED }
    
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        ListingType listingType;
        ListingStatus status;
        uint256 endTime; // 仅用于拍卖
        address highestBidder; // 仅用于拍卖
        uint256 highestBid; // 仅用于拍卖
        uint256 createdAt;
    }
    
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }
    
    uint256 private _listingIdCounter;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => uint256) public pendingWithdrawals;
    
    uint256 public marketplaceFee = 250; // 2.5% = 250/10000
    address public feeRecipient;
    
    event ItemListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        ListingType listingType,
        uint256 endTime
    );
    
    event ItemSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 price
    );
    
    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionEnded(
        uint256 indexed listingId,
        address indexed winner,
        uint256 amount
    );
    
    event ListingCancelled(uint256 indexed listingId);
    
    modifier validListing(uint256 listingId) {
        require(listingId < _listingIdCounter, "Invalid listing");
        require(listings[listingId].status == ListingStatus.ACTIVE, "Listing not active");
        _;
    }
    
    constructor(address _nftContract, address _feeRecipient) Ownable(msg.sender) {
        nftContract = PlatformNFT(_nftContract);
        feeRecipient = _feeRecipient;
    }
    
    function listItem(
        uint256 tokenId,
        uint256 price,
        ListingType listingType,
        uint256 auctionDuration
    ) external nonReentrant returns (uint256 listingId) {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)) || 
                nftContract.getApproved(tokenId) == address(this), "Contract not approved");
        require(price > 0, "Price must be greater than 0");
        
        listingId = _listingIdCounter;
        _listingIdCounter++;
        
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
            createdAt: block.timestamp
        });
        
        emit ItemListed(listingId, tokenId, msg.sender, price, listingType, endTime);
    }
    
    function buyItem(uint256 listingId) external payable nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Not a fixed price listing");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own item");
        
        _completeSale(listingId, msg.sender, listing.price);
    }
    
    function placeBid(uint256 listingId) external payable nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp <= listing.endTime, "Auction ended");
        require(msg.sender != listing.seller, "Cannot bid on own item");
        require(msg.value > listing.highestBid, "Bid too low");
        require(msg.value >= listing.price, "Bid below reserve price");
        
        // 退还之前的最高出价
        if (listing.highestBidder != address(0)) {
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }
        
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;
        
        auctionBids[listingId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        emit BidPlaced(listingId, msg.sender, msg.value);
    }
    
    function endAuction(uint256 listingId) external nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp > listing.endTime, "Auction still active");
        require(listing.highestBidder != address(0), "No bids placed");
        
        _completeSale(listingId, listing.highestBidder, listing.highestBid);
        emit AuctionEnded(listingId, listing.highestBidder, listing.highestBid);
    }
    
    function cancelListing(uint256 listingId) external validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(msg.sender == listing.seller, "Only seller can cancel");
        
        if (listing.listingType == ListingType.AUCTION && listing.highestBidder != address(0)) {
            // 退还最高出价
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }
        
        listing.status = ListingStatus.CANCELLED;
        emit ListingCancelled(listingId);
    }
    
    function _completeSale(uint256 listingId, address buyer, uint256 price) internal {
        Listing storage listing = listings[listingId];
        
        // 计算费用
        uint256 marketplaceFeeAmount = (price * marketplaceFee) / 10000;
        uint256 royaltyAmount = 0;
        
        // 计算版税
        address creator = nftContract.creators(listing.tokenId);
        if (creator != address(0) && creator != listing.seller) {
            uint256 royaltyPercent = nftContract.royalties(listing.tokenId);
            royaltyAmount = (price * royaltyPercent) / 10000;
        }
        
        uint256 sellerAmount = price - marketplaceFeeAmount - royaltyAmount;
        
        // 转移NFT
        nftContract.safeTransferFrom(listing.seller, buyer, listing.tokenId);
        
        // 分配资金
        if (marketplaceFeeAmount > 0) {
            (bool success, ) = feeRecipient.call{value: marketplaceFeeAmount}("");
            require(success, "Fee transfer failed");
        }
        
        if (royaltyAmount > 0) {
            (bool success, ) = creator.call{value: royaltyAmount}("");
            require(success, "Royalty transfer failed");
        }
        
        (bool success, ) = listing.seller.call{value: sellerAmount}("");
        require(success, "Seller payment failed");
        
        // 退还多余的ETH
        if (msg.value > price) {
            (bool success2, ) = buyer.call{value: msg.value - price}("");
            require(success2, "Excess refund failed");
        }
        
        listing.status = ListingStatus.SOLD;
        emit ItemSold(listingId, listing.tokenId, buyer, listing.seller, price);
    }
    
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    function getAuctionBids(uint256 listingId) external view returns (Bid[] memory) {
        return auctionBids[listingId];
    }
    
    function getCurrentListingId() external view returns (uint256) {
        return _listingIdCounter;
    }
    
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // 最大10%
        marketplaceFee = _fee;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
} 