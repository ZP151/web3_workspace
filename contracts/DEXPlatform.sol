// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title DEXPlatform
 * @dev Decentralized exchange platform supporting token swaps and liquidity provision
 */
contract DEXPlatform is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    struct LiquidityPool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 lastUpdate;
        bool active;
    }
    
    struct UserLiquidity {
        uint256 liquidity;
        uint256 rewardDebt;
    }
    
    mapping(bytes32 => LiquidityPool) public pools;
    mapping(bytes32 => mapping(address => UserLiquidity)) public userLiquidity;
    mapping(bytes32 => uint256) public poolRewardRate; // 每秒奖励率
    
    bytes32[] public poolIds;
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public tradingFee = 30; // 0.3% = 30/10000
    address public feeRecipient;
    
    event PoolCreated(bytes32 indexed poolId, address indexed tokenA, address indexed tokenB);
    event LiquidityAdded(bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event TokenSwapped(bytes32 indexed poolId, address indexed trader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event RewardClaimed(bytes32 indexed poolId, address indexed user, uint256 reward);
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }
    
    function createPool(address tokenA, address tokenB) external returns (bytes32 poolId) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        // 确保token顺序一致性
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        
        poolId = keccak256(abi.encodePacked(tokenA, tokenB));
        require(!pools[poolId].active, "Pool already exists");
        
        pools[poolId] = LiquidityPool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            lastUpdate: block.timestamp,
            active: true
        });
        
        poolIds.push(poolId);
        poolRewardRate[poolId] = 1e15; // 默认每秒1e15 wei奖励
        
        emit PoolCreated(poolId, tokenA, tokenB);
    }
    
    function addLiquidity(
        bytes32 poolId,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        
        // 计算实际添加的代币数量
        if (pool.reserveA == 0 && pool.reserveB == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            uint256 amountBOptimal = (amountADesired * pool.reserveB) / pool.reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * pool.reserveA) / pool.reserveB;
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }
        
        // 计算流动性代币
        if (pool.totalLiquidity == 0) {
            liquidity = Math.sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            pool.totalLiquidity = MINIMUM_LIQUIDITY; // 永久锁定最小流动性
        } else {
            liquidity = Math.min(
                (amountA * pool.totalLiquidity) / pool.reserveA,
                (amountB * pool.totalLiquidity) / pool.reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // 更新用户奖励
        _updateReward(poolId, msg.sender);
        
        // 转移代币
        IERC20(pool.tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).safeTransferFrom(msg.sender, address(this), amountB);
        
        // 更新池状态
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;
        pool.lastUpdate = block.timestamp;
        
        userLiquidity[poolId][msg.sender].liquidity += liquidity;
        
        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, liquidity);
    }
    
    function removeLiquidity(
        bytes32 poolId,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        require(userLiquidity[poolId][msg.sender].liquidity >= liquidity, "Insufficient liquidity");
        
        // 更新用户奖励
        _updateReward(poolId, msg.sender);
        
        // 计算提取的代币数量
        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.reserveB;
        
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient output amounts");
        
        // 更新状态
        userLiquidity[poolId][msg.sender].liquidity -= liquidity;
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        pool.totalLiquidity -= liquidity;
        pool.lastUpdate = block.timestamp;
        
        // 转移代币
        IERC20(pool.tokenA).safeTransfer(msg.sender, amountA);
        IERC20(pool.tokenB).safeTransfer(msg.sender, amountB);
        
        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, liquidity);
    }
    
    function swapTokens(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant returns (uint256 amountOut) {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        require(tokenIn == pool.tokenA || tokenIn == pool.tokenB, "Invalid token");
        require(amountIn > 0, "Invalid amount");
        
        bool isTokenA = tokenIn == pool.tokenA;
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
        address tokenOut = isTokenA ? pool.tokenB : pool.tokenA;
        
        // 计算输出数量 (包含交易费用)
        uint256 amountInWithFee = amountIn * (10000 - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        
        // 转移代币
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        // 更新储备
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        pool.lastUpdate = block.timestamp;
        
        emit TokenSwapped(poolId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    function claimReward(bytes32 poolId) external nonReentrant {
        _updateReward(poolId, msg.sender);
        
        // 这里可以实现奖励代币的发放逻辑
        // 例如：发放平台治理代币作为流动性挖矿奖励
        
        emit RewardClaimed(poolId, msg.sender, 0);
    }
    
    function _updateReward(bytes32 poolId, address user) internal {
        LiquidityPool storage pool = pools[poolId];
        if (pool.totalLiquidity > 0) {
            uint256 timeDiff = block.timestamp - pool.lastUpdate;
            uint256 reward = (userLiquidity[poolId][user].liquidity * poolRewardRate[poolId] * timeDiff) / 1e18;
            userLiquidity[poolId][user].rewardDebt += reward;
        }
    }
    
    function getAmountOut(bytes32 poolId, address tokenIn, uint256 amountIn) 
        external 
        view 
        returns (uint256 amountOut) 
    {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        require(tokenIn == pool.tokenA || tokenIn == pool.tokenB, "Invalid token");
        
        bool isTokenA = tokenIn == pool.tokenA;
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
        
        uint256 amountInWithFee = amountIn * (10000 - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;
    }
    
    function getPoolInfo(bytes32 poolId) 
        external 
        view 
        returns (
            address tokenA,
            address tokenB,
            uint256 reserveA,
            uint256 reserveB,
            uint256 totalLiquidity
        ) 
    {
        LiquidityPool storage pool = pools[poolId];
        return (pool.tokenA, pool.tokenB, pool.reserveA, pool.reserveB, pool.totalLiquidity);
    }
    
    function getUserLiquidityInfo(bytes32 poolId, address user) 
        external 
        view 
        returns (uint256 liquidity, uint256 rewardDebt) 
    {
        UserLiquidity storage userLiq = userLiquidity[poolId][user];
        return (userLiq.liquidity, userLiq.rewardDebt);
    }
    
    function getAllPools() external view returns (bytes32[] memory) {
        return poolIds;
    }
    
    function setTradingFee(uint256 _tradingFee) external onlyOwner {
        require(_tradingFee <= 1000, "Fee too high"); // 最大10%
        tradingFee = _tradingFee;
    }
    
    function setPoolRewardRate(bytes32 poolId, uint256 _rewardRate) external onlyOwner {
        poolRewardRate[poolId] = _rewardRate;
    }
} 