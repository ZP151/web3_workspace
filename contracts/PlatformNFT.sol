// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";

/**
 * @title PlatformNFTv2
 * @dev 升级版NFT合约，使用AccessControl实现细粒度权限管理
 * 
 * 角色定义:
 * - DEFAULT_ADMIN_ROLE: 超级管理员，可以管理所有角色
 * - MINTER_ROLE: 铸造权限，可以铸造NFT
 * - PAUSER_ROLE: 暂停权限，可以暂停/恢复合约
 * - FEE_MANAGER_ROLE: 费用管理权限，可以设置费用
 * - EMERGENCY_ROLE: 紧急权限，可以执行紧急操作
 */
contract PlatformNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard,
    IERC2981 
{
    // 角色定义
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // NFT相关存储
    uint256 private _tokenIdCounter;
    uint256 public mintFee = 0.001 ether;
    
    // 映射关系
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public royalties; // 以基点为单位 (例如: 250 = 2.5%)
    mapping(uint256 => uint256) public likes;
    mapping(uint256 => uint256) public views;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    
    // 事件定义
    event NFTMinted(uint256 indexed tokenId, address indexed creator, string uri);
    event NFTLiked(uint256 indexed tokenId, address indexed liker, uint256 totalLikes);
    event NFTUnliked(uint256 indexed tokenId, address indexed unliker, uint256 totalLikes);
    event NFTViewed(uint256 indexed tokenId, address indexed viewer, uint256 totalViews);
    event MetadataSecurityWarning(uint256 indexed tokenId, string reason);
    event RoleGrantedWithReason(bytes32 indexed role, address indexed account, string reason);
    event EmergencyAction(address indexed executor, string action, string reason);

    constructor(address admin) ERC721("Platform NFT", "PNFT") {
        // 设置默认管理员
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        
        // 为部署者设置初始角色
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(FEE_MANAGER_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
        
        emit RoleGrantedWithReason(DEFAULT_ADMIN_ROLE, admin, "Contract deployment");
    }

    /**
     * @dev 铸造NFT - 需要MINTER_ROLE权限
     * @param to NFT接收者地址
     * @param uri 元数据URI
     * @param royalty 版税率 (基点)
     */
    function mint(address to, string memory uri, uint256 royalty) 
        external 
        payable 
        onlyRole(MINTER_ROLE)
        whenNotPaused 
        nonReentrant
        returns (uint256) 
    {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(royalty <= 1000, "Royalty too high"); // 最大10%
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        creators[tokenId] = msg.sender;
        royalties[tokenId] = royalty;
        likes[tokenId] = 0;
        views[tokenId] = 0;
        
        // 元数据安全检查
        _checkMetadataSecurity(tokenId, uri);
        
        emit NFTMinted(tokenId, msg.sender, uri);
        return tokenId;
    }

    /**
     * @dev 公开铸造函数 - 任何人都可以调用
     */
    function publicMint(address to, string memory uri, uint256 royalty) 
        external 
        payable 
        whenNotPaused 
        nonReentrant
        returns (uint256) 
    {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(royalty <= 1000, "Royalty too high"); // 最大10%
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        creators[tokenId] = msg.sender;
        royalties[tokenId] = royalty;
        likes[tokenId] = 0;
        views[tokenId] = 0;
        
        // 元数据安全检查
        _checkMetadataSecurity(tokenId, uri);
        
        emit NFTMinted(tokenId, msg.sender, uri);
        return tokenId;
    }

    /**
     * @dev 批量铸造 - 需要MINTER_ROLE权限
     */
    function batchMint(
        address[] memory recipients,
        string[] memory uris,
        uint256[] memory royaltyRates
    ) external payable onlyRole(MINTER_ROLE) whenNotPaused nonReentrant {
        require(recipients.length == uris.length, "Array length mismatch");
        require(recipients.length == royaltyRates.length, "Array length mismatch");
        require(recipients.length <= 10, "Batch size too large"); // 限制批量大小
        require(msg.value >= mintFee * recipients.length, "Insufficient mint fee");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(royaltyRates[i] <= 1000, "Royalty too high");
            
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
            
            creators[tokenId] = msg.sender;
            royalties[tokenId] = royaltyRates[i];
            likes[tokenId] = 0;
            views[tokenId] = 0;
            
            _checkMetadataSecurity(tokenId, uris[i]);
            emit NFTMinted(tokenId, msg.sender, uris[i]);
        }
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
     * @dev 设置铸造费用 - 需要FEE_MANAGER_ROLE权限
     */
    function setMintFee(uint256 _mintFee) external onlyRole(FEE_MANAGER_ROLE) {
        require(_mintFee <= 0.1 ether, "Fee too high"); // 最大0.1 ETH
        mintFee = _mintFee;
    }

    /**
     * @dev 暂停合约 - 需要PAUSER_ROLE权限
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev 恢复合约 - 需要PAUSER_ROLE权限
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev 紧急提取资金 - 需要EMERGENCY_ROLE权限
     */
    function emergencyWithdraw(address payable recipient, string memory reason) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        require(recipient != address(0), "Invalid recipient");
        uint256 balance = address(this).balance;
        recipient.transfer(balance);
        
        emit EmergencyAction(msg.sender, "Emergency withdrawal", reason);
    }

    /**
     * @dev 授予角色并记录原因
     */
    function grantRoleWithReason(
        bytes32 role, 
        address account, 
        string memory reason
    ) external onlyRole(getRoleAdmin(role)) {
        grantRole(role, account);
        emit RoleGrantedWithReason(role, account, reason);
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

    /**
     * @dev ERC-2981 版税信息查询
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) 
        external 
        view 
        override 
        returns (address receiver, uint256 royaltyAmount) 
    {
        // Check if the token exists by trying to get its owner. This will revert if it doesn't.
        ownerOf(tokenId);
        
        address creator = creators[tokenId];
        uint256 royaltyRate = royalties[tokenId];
        
        if (creator == address(0) || royaltyRate == 0) {
            return (address(0), 0);
        }
        
        royaltyAmount = (salePrice * royaltyRate) / 10000;
        return (creator, royaltyAmount);
    }

    /**
     * @dev 内部函数：检查元数据安全性
     */
    function _checkMetadataSecurity(uint256 tokenId, string memory uri) internal {
        bytes memory uriBytes = bytes(uri);
        
        // 检查是否使用了去中心化存储
        bool isIPFS = _startsWith(uriBytes, "ipfs://") || 
                     _startsWith(uriBytes, "https://ipfs.io/ipfs/") ||
                     _startsWith(uriBytes, "https://gateway.pinata.cloud/ipfs/") ||
                     _startsWith(uriBytes, "https://cloudflare-ipfs.com/ipfs/") ||
                     _startsWith(uriBytes, "https://dweb.link/ipfs/");
        bool isArweave = _startsWith(uriBytes, "ar://") || _startsWith(uriBytes, "https://arweave.net/");
        
        if (!isIPFS && !isArweave) {
            emit MetadataSecurityWarning(tokenId, "Consider using IPFS or Arweave for immutable metadata");
        }
    }

    /**
     * @dev 工具函数：检查字符串是否以指定前缀开始
     */
    function _startsWith(bytes memory data, string memory prefix) internal pure returns (bool) {
        bytes memory prefixBytes = bytes(prefix);
        if (data.length < prefixBytes.length) {
            return false;
        }
        
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (data[i] != prefixBytes[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev 检查多个角色权限
     */
    function hasAnyRole(bytes32[] memory roles, address account) external view returns (bool) {
        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], account)) {
                return true;
            }
        }
        return false;
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
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
} 