// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CustomToken
 * @dev Customizable ERC-20 token contract
 */
contract CustomToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    uint8 private _decimals;
    uint256 public maxSupply;
    bool public mintingFinished;
    
    event MintingFinished();
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue,
        uint256 initialSupply,
        uint256 maxSupplyValue,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        _decimals = decimalsValue;
        maxSupply = maxSupplyValue;
        
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(!mintingFinished, "Minting is finished");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
    }
    
    function finishMinting() public onlyOwner {
        mintingFinished = true;
        emit MintingFinished();
    }
    
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}

/**
 * @title TokenFactory
 * @dev Token factory contract for creating ERC-20 tokens
 */
contract TokenFactory is ReentrancyGuard {
    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        uint256 totalSupply;
        address creator;
        uint256 createdAt;
    }
    
    TokenInfo[] public tokens;
    mapping(address => uint256[]) public creatorTokens;
    mapping(address => bool) public isFactoryToken;
    
    uint256 public creationFee = 0.01 ether;
    address public feeRecipient;
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 index
    );
    
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    
    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        uint256 maxSupply
    ) external payable nonReentrant {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(maxSupply > 0, "Max supply must be greater than 0");
        require(initialSupply <= maxSupply, "Initial supply exceeds max supply");
        
        CustomToken newToken = new CustomToken(
            name,
            symbol,
            decimals,
            initialSupply,
            maxSupply,
            msg.sender
        );
        
        address tokenAddress = address(newToken);
        
        TokenInfo memory tokenInfo = TokenInfo({
            tokenAddress: tokenAddress,
            name: name,
            symbol: symbol,
            totalSupply: initialSupply,
            creator: msg.sender,
            createdAt: block.timestamp
        });
        
        tokens.push(tokenInfo);
        uint256 tokenIndex = tokens.length - 1;
        
        creatorTokens[msg.sender].push(tokenIndex);
        isFactoryToken[tokenAddress] = true;
        
        // Transfer creation fee
        if (msg.value > 0) {
            (bool success, ) = feeRecipient.call{value: msg.value}("");
            require(success, "Fee transfer failed");
        }
        
        emit TokenCreated(tokenAddress, msg.sender, name, symbol, initialSupply, tokenIndex);
    }
    
    function getTokenCount() external view returns (uint256) {
        return tokens.length;
    }
    
    function getCreatorTokens(address creator) external view returns (uint256[] memory) {
        return creatorTokens[creator];
    }
    
    function getTokenInfo(uint256 index) external view returns (TokenInfo memory) {
        require(index < tokens.length, "Token index out of bounds");
        return tokens[index];
    }
    
    function updateCreationFee(uint256 newFee) external {
        require(msg.sender == feeRecipient, "Only fee recipient can update fee");
        uint256 oldFee = creationFee;
        creationFee = newFee;
        emit CreationFeeUpdated(oldFee, newFee);
    }
    
    function updateFeeRecipient(address newRecipient) external {
        require(msg.sender == feeRecipient, "Only current fee recipient can update");
        require(newRecipient != address(0), "Invalid recipient address");
        feeRecipient = newRecipient;
    }
} 