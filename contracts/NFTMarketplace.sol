// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
/**
 * @title PlatformNFT
 * @dev 平台NFT合约，支持铸造和版税管理
 */
contract PlatformNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public royalties; // 版税百分比 (basis points)
    mapping(uint256 => uint256) public likes; // NFT点赞数
    mapping(uint256 => uint256) public views; // NFT查看数
    mapping(uint256 => mapping(address => bool)) public hasLiked; // 用户是否已点赞
    
    uint256 public mintFee = 0.001 ether;
    
    event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);
    event NFTLiked(uint256 indexed tokenId, address indexed liker, uint256 totalLikes);
    event NFTUnliked(uint256 indexed tokenId, address indexed unliker, uint256 totalLikes);
    event NFTViewed(uint256 indexed tokenId, address indexed viewer, uint256 totalViews);
    
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
        likes[tokenId] = 0;
        views[tokenId] = 0;
        
        emit NFTMinted(tokenId, msg.sender, tokenURI);
        return tokenId;
    }
    
    /**
     * @dev 点赞NFT
     */
    function likeNFT(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        require(!hasLiked[tokenId][msg.sender], "Already liked");
        
        hasLiked[tokenId][msg.sender] = true;
        likes[tokenId]++;
        
        emit NFTLiked(tokenId, msg.sender, likes[tokenId]);
    }
    
    /**
     * @dev 取消点赞NFT
     */
    function unlikeNFT(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        require(hasLiked[tokenId][msg.sender], "Not liked yet");
        
        hasLiked[tokenId][msg.sender] = false;
        likes[tokenId]--;
        
        emit NFTUnliked(tokenId, msg.sender, likes[tokenId]);
    }
    
    /**
     * @dev 记录NFT查看
     */
    function viewNFT(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        
        views[tokenId]++;
        
        emit NFTViewed(tokenId, msg.sender, views[tokenId]);
    }
    
    /**
     * @dev 获取NFT统计信息
     */
    function getNFTStats(uint256 tokenId) external view returns (
        uint256 _likes,
        uint256 _views,
        address creator,
        uint256 royalty
    ) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        
        return (
            likes[tokenId],
            views[tokenId],
            creators[tokenId],
            royalties[tokenId]
        );
    }
    
    /**
     * @dev 检查用户是否已点赞NFT
     */
    function hasUserLiked(uint256 tokenId, address user) external view returns (bool) {
        return hasLiked[tokenId][user];
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
 * @dev NFT市场合约，支持直销和拍卖，以及价格更新
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
        uint256 updatedAt; // 价格更新时间
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
    mapping(uint256 => uint256) public tokenToListingId; // tokenId => listingId
    
    uint256 public marketplaceFee = 250; // 2.5% = 250/10000
    address public feeRecipient;
    
    // 统计数据
    uint256 public totalSales;
    uint256 public totalVolume;
    
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
    
    event PriceUpdated(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice
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
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        tokenToListingId[tokenId] = listingId;
        
        emit ItemListed(listingId, tokenId, msg.sender, price, listingType, endTime);
    }
    
    /**
     * @dev 更新listing价格
     */
    function updatePrice(uint256 listingId, uint256 newPrice) external validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.listingType == ListingType.FIXED_PRICE, "Can only update fixed price listings");
        require(newPrice > 0, "Price must be greater than 0");
        
        uint256 oldPrice = listing.price;
        listing.price = newPrice;
        listing.updatedAt = block.timestamp;
        
        emit PriceUpdated(listingId, listing.tokenId, oldPrice, newPrice);
    }
    
    function buyItem(uint256 listingId) external payable nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Item is not for direct sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(listing.seller != msg.sender, "Cannot buy own item");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        uint256 tokenId = listing.tokenId;
        
        // 标记为已售出
        listing.status = ListingStatus.SOLD;
        
        // 计算费用
        uint256 fee = (price * marketplaceFee) / 10000;
        uint256 royalty = 0;
        
        // 计算版税
        address creator = nftContract.creators(tokenId);
        if (creator != address(0) && creator != seller) {
            uint256 royaltyRate = nftContract.royalties(tokenId);
            royalty = (price * royaltyRate) / 10000;
        }
        
        uint256 sellerAmount = price - fee - royalty;
        
        // 转移NFT
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        // 分配资金
        payable(seller).transfer(sellerAmount);
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }
        if (royalty > 0 && creator != address(0)) {
            payable(creator).transfer(royalty);
        }
        
        // 退还多余付款
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        // 更新统计
        totalSales++;
        totalVolume += price;
        
        emit ItemSold(listingId, tokenId, msg.sender, seller, price);
    }
    
    function placeBid(uint256 listingId) external payable nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.AUCTION, "Item is not an auction");
        require(block.timestamp <= listing.endTime, "Auction has ended");
        require(msg.value > listing.highestBid, "Bid too low");
        require(listing.seller != msg.sender, "Cannot bid on own item");
        
        // 退还之前的最高出价
        if (listing.highestBidder != address(0)) {
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }
        
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;
        
        // 记录出价
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
        require(
            msg.sender == listing.seller || msg.sender == listing.highestBidder || msg.sender == owner(),
            "Not authorized"
        );
        
        listing.status = ListingStatus.SOLD;
        
        if (listing.highestBidder != address(0)) {
            address seller = listing.seller;
            uint256 price = listing.highestBid;
            uint256 tokenId = listing.tokenId;
            
            // 计算费用和版税
            uint256 fee = (price * marketplaceFee) / 10000;
            uint256 royalty = 0;
            
            address creator = nftContract.creators(tokenId);
            if (creator != address(0) && creator != seller) {
                uint256 royaltyRate = nftContract.royalties(tokenId);
                royalty = (price * royaltyRate) / 10000;
            }
            
            uint256 sellerAmount = price - fee - royalty;
            
            // 转移NFT
            nftContract.safeTransferFrom(seller, listing.highestBidder, tokenId);
            
            // 分配资金
            payable(seller).transfer(sellerAmount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
            if (royalty > 0 && creator != address(0)) {
                payable(creator).transfer(royalty);
            }
            
            // 更新统计
            totalSales++;
            totalVolume += price;
            
            emit AuctionEnded(listingId, listing.highestBidder, listing.highestBid);
            emit ItemSold(listingId, tokenId, listing.highestBidder, seller, price);
        }
    }
    
    function cancelListing(uint256 listingId) external validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || msg.sender == owner(), "Not authorized");
        
        if (listing.listingType == ListingType.AUCTION && listing.highestBidder != address(0)) {
            // 退还最高出价
            pendingWithdrawals[listing.highestBidder] += listing.highestBid;
        }
        
        listing.status = ListingStatus.CANCELLED;
        
        emit ListingCancelled(listingId);
    }
    
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
    /**
     * @dev 获取市场统计信息
     */
    function getMarketplaceStats() external view returns (MarketplaceStats memory) {
        uint256 activeListings = 0;
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (listings[i].status == ListingStatus.ACTIVE) {
                activeListings++;
            }
        }
        
        return MarketplaceStats({
            totalListings: _listingIdCounter,
            totalSales: totalSales,
            totalVolume: totalVolume,
            totalNFTs: nftContract.totalSupply(),
            activeListings: activeListings
        });
    }
    
    /**
     * @dev 获取用户的listing
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // 计算用户的listing数量
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (listings[i].seller == user) {
                count++;
            }
        }
        
        uint256[] memory userListings = new uint256[](count);
        uint256 index = 0;
        
        // 填充数组
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (listings[i].seller == user) {
                userListings[index] = i;
                index++;
            }
        }
        
        return userListings;
    }
    
    function getListing(uint256 listingId) external view returns (
        uint256 tokenId,
        address seller,
        uint256 price,
        ListingType listingType,
        ListingStatus status,
        uint256 endTime,
        address highestBidder,
        uint256 highestBid,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        require(listingId < _listingIdCounter, "Invalid listing");
        
        Listing storage listing = listings[listingId];
        return (
            listing.tokenId,
            listing.seller,
            listing.price,
            listing.listingType,
            listing.status,
            listing.endTime,
            listing.highestBidder,
            listing.highestBid,
            listing.createdAt,
            listing.updatedAt
        );
    }
    
    function getListingCount() external view returns (uint256) {
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
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
} 