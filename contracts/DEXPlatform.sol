// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title DEXPlatform
 * @dev 去中心化交易平台，支持代币交换、流动性提供、限价订单和挖矿奖励
 */
contract DEXPlatform is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;
    
    enum OrderType { BUY, SELL }
    enum OrderStatus { ACTIVE, FILLED, CANCELLED }
    
    struct LiquidityPool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 lastUpdate;
        bool active;
        uint256 totalFees; // 累计手续费
        uint256 apy; // 年化收益率 (basis points)
    }
    
    struct UserLiquidity {
        uint256 liquidity;
        uint256 rewardDebt;
        uint256 lastDepositTime;
        uint256 totalRewardsClaimed;
    }
    
    struct LimitOrder {
        bytes32 poolId;
        address trader;
        OrderType orderType;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 pricePerToken; // 价格 (tokenOut per tokenIn)
        uint256 amountOutMin;
        uint256 createdAt;
        uint256 expiresAt;
        OrderStatus status;
        uint256 filledAmount;
    }
    
    struct PoolInfo {
        bytes32 poolId;
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 apy;
        uint256 dailyVolume;
        uint256 totalFees;
    }
    
    mapping(bytes32 => LiquidityPool) public pools;
    mapping(bytes32 => mapping(address => UserLiquidity)) public userLiquidity;
    mapping(bytes32 => uint256) public poolRewardRate; // 每秒奖励率
    mapping(uint256 => LimitOrder) public limitOrders;
    mapping(address => uint256[]) public userOrders;
    mapping(bytes32 => uint256) public poolDailyVolume;
    mapping(bytes32 => uint256) public lastVolumeReset;
    
    bytes32[] public poolIds;
    uint256 private _orderIdCounter;
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    uint256 public tradingFee = 30; // 0.3% = 30/10000
    uint256 public protocolFee = 5; // 0.05% = 5/10000
    address public feeRecipient;
    address public rewardToken; // 平台奖励代币
    
    // 时间锁定参数
    uint256 public constant MIN_LOCK_TIME = 24 hours;
    uint256 public constant MAX_LOCK_TIME = 365 days;
    
    event PoolCreated(bytes32 indexed poolId, address indexed tokenA, address indexed tokenB);
    event LiquidityAdded(bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(bytes32 indexed poolId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event TokenSwapped(bytes32 indexed poolId, address indexed trader, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event RewardClaimed(bytes32 indexed poolId, address indexed user, uint256 reward);
    event LimitOrderCreated(uint256 indexed orderId, bytes32 indexed poolId, address indexed trader, OrderType orderType, uint256 amountIn, uint256 pricePerToken);
    event LimitOrderFilled(uint256 indexed orderId, address indexed filler, uint256 amountIn, uint256 amountOut);
    event LimitOrderCancelled(uint256 indexed orderId, address indexed trader);
    event APYUpdated(bytes32 indexed poolId, uint256 oldAPY, uint256 newAPY);
    
    constructor(address _feeRecipient, address _rewardToken) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
        rewardToken = _rewardToken;
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
            active: true,
            totalFees: 0,
            apy: 1000 // 默认10% APY
        });
        
        poolIds.push(poolId);
        poolRewardRate[poolId] = 1e15; // 默认每秒1e15 wei奖励
        lastVolumeReset[poolId] = block.timestamp;
        
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
        userLiquidity[poolId][msg.sender].lastDepositTime = block.timestamp;
        
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
        
        // 检查时间锁定
        require(
            block.timestamp >= userLiquidity[poolId][msg.sender].lastDepositTime + MIN_LOCK_TIME,
            "Liquidity locked"
        );
        
        // 更新用户奖励
        _updateReward(poolId, msg.sender);
        
        // 计算提取的代币数量
        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;
        
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
        uint256 amountInWithFee = amountIn * (10000 - tradingFee - protocolFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= amountOutMin, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        
        // 计算费用
        uint256 feeAmount = (amountIn * tradingFee) / 10000;
        uint256 protocolFeeAmount = (amountIn * protocolFee) / 10000;
        
        // 转移代币
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        // 更新储备量
        if (isTokenA) {
            pool.reserveA += (amountIn - protocolFeeAmount);
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += (amountIn - protocolFeeAmount);
            pool.reserveA -= amountOut;
        }
        
        // 更新统计
        pool.totalFees += feeAmount;
        pool.lastUpdate = block.timestamp;
        _updateDailyVolume(poolId, amountIn);
        
        // 转移协议费用
        if (protocolFeeAmount > 0) {
            IERC20(tokenIn).safeTransfer(feeRecipient, protocolFeeAmount);
        }
        
        // 检查并执行限价订单
        _tryFillLimitOrders(poolId, tokenOut, tokenIn);
        
        emit TokenSwapped(poolId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    /**
     * @dev 创建限价订单
     */
    function createLimitOrder(
        bytes32 poolId,
        OrderType orderType,
        address tokenIn,
        uint256 amountIn,
        uint256 pricePerToken,
        uint256 amountOutMin,
        uint256 expirationHours
    ) external nonReentrant returns (uint256 orderId) {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        require(tokenIn == pool.tokenA || tokenIn == pool.tokenB, "Invalid token");
        require(amountIn > 0, "Invalid amount");
        require(pricePerToken > 0, "Invalid price");
        require(expirationHours > 0 && expirationHours <= 720, "Invalid expiration"); // 最大30天
        
        address tokenOut = tokenIn == pool.tokenA ? pool.tokenB : pool.tokenA;
        
        orderId = _orderIdCounter++;
        
        limitOrders[orderId] = LimitOrder({
            poolId: poolId,
            trader: msg.sender,
            orderType: orderType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            pricePerToken: pricePerToken,
            amountOutMin: amountOutMin,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (expirationHours * 1 hours),
            status: OrderStatus.ACTIVE,
            filledAmount: 0
        });
        
        userOrders[msg.sender].push(orderId);
        
        // 锁定代币
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        emit LimitOrderCreated(orderId, poolId, msg.sender, orderType, amountIn, pricePerToken);
    }
    
    /**
     * @dev 填充限价订单
     */
    function fillLimitOrder(uint256 orderId) external nonReentrant {
        LimitOrder storage order = limitOrders[orderId];
        require(order.status == OrderStatus.ACTIVE, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");
        require(order.trader != msg.sender, "Cannot fill own order");
        
        LiquidityPool storage pool = pools[order.poolId];
        
        // 检查当前价格是否满足订单条件
        uint256 currentPrice = _getCurrentPrice(order.poolId, order.tokenIn, order.tokenOut);
        
        bool canFill = false;
        if (order.orderType == OrderType.BUY) {
            canFill = currentPrice <= order.pricePerToken;
        } else {
            canFill = currentPrice >= order.pricePerToken;
        }
        
        require(canFill, "Price condition not met");
        
        uint256 amountToFill = order.amountIn - order.filledAmount;
        uint256 amountOut = (amountToFill * order.pricePerToken) / 1e18;
        require(amountOut >= order.amountOutMin, "Insufficient output amount");
        
        // 执行交换
        IERC20(order.tokenOut).safeTransferFrom(msg.sender, order.trader, amountOut);
        IERC20(order.tokenIn).safeTransfer(msg.sender, amountToFill);
        
        // 更新订单状态
        order.filledAmount = order.amountIn;
        order.status = OrderStatus.FILLED;
        
        emit LimitOrderFilled(orderId, msg.sender, amountToFill, amountOut);
    }
    
    /**
     * @dev 取消限价订单
     */
    function cancelLimitOrder(uint256 orderId) external {
        LimitOrder storage order = limitOrders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.status == OrderStatus.ACTIVE, "Order not active");
        
        uint256 refundAmount = order.amountIn - order.filledAmount;
        
        order.status = OrderStatus.CANCELLED;
        
        // 退还代币
        if (refundAmount > 0) {
            IERC20(order.tokenIn).safeTransfer(msg.sender, refundAmount);
        }
        
        emit LimitOrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @dev 领取流动性挖矿奖励
     */
    function claimRewards(bytes32 poolId) external nonReentrant {
        _updateReward(poolId, msg.sender);
        
        uint256 reward = userLiquidity[poolId][msg.sender].rewardDebt;
        require(reward > 0, "No rewards available");
        
        userLiquidity[poolId][msg.sender].rewardDebt = 0;
        userLiquidity[poolId][msg.sender].totalRewardsClaimed += reward;
        
        if (rewardToken != address(0)) {
            IERC20(rewardToken).safeTransfer(msg.sender, reward);
        }
        
        emit RewardClaimed(poolId, msg.sender, reward);
    }
    
    /**
     * @dev 获取池信息
     */
    function getPoolInfo(bytes32 poolId) external view returns (PoolInfo memory) {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        
        return PoolInfo({
            poolId: poolId,
            tokenA: pool.tokenA,
            tokenB: pool.tokenB,
            reserveA: pool.reserveA,
            reserveB: pool.reserveB,
            totalLiquidity: pool.totalLiquidity,
            apy: pool.apy,
            dailyVolume: poolDailyVolume[poolId],
            totalFees: pool.totalFees
        });
    }
    
    /**
     * @dev 获取用户订单
     */
    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }
    
    /**
     * @dev 获取当前价格
     */
    function getCurrentPrice(bytes32 poolId, address tokenIn, address tokenOut) external view returns (uint256) {
        return _getCurrentPrice(poolId, tokenIn, tokenOut);
    }
    
    /**
     * @dev 估算交换输出
     */
    function getAmountOut(bytes32 poolId, address tokenIn, uint256 amountIn) external view returns (uint256 amountOut) {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        require(tokenIn == pool.tokenA || tokenIn == pool.tokenB, "Invalid token");
        
        bool isTokenA = tokenIn == pool.tokenA;
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
        
        uint256 amountInWithFee = amountIn * (10000 - tradingFee - protocolFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;
    }
    
    /**
     * @dev 获取用户流动性信息
     */
    function getUserLiquidityInfo(bytes32 poolId, address user) external view returns (
        uint256 liquidity,
        uint256 rewardDebt,
        uint256 lastDepositTime,
        uint256 totalRewardsClaimed,
        uint256 pendingRewards
    ) {
        UserLiquidity storage userLp = userLiquidity[poolId][user];
        
        // 计算待领取奖励
        uint256 pending = 0;
        if (userLp.liquidity > 0) {
            uint256 timeElapsed = block.timestamp - pools[poolId].lastUpdate;
            uint256 reward = (timeElapsed * poolRewardRate[poolId] * userLp.liquidity) / pools[poolId].totalLiquidity;
            pending = userLp.rewardDebt + reward;
        }
        
        return (
            userLp.liquidity,
            userLp.rewardDebt,
            userLp.lastDepositTime,
            userLp.totalRewardsClaimed,
            pending
        );
    }
    
    // Internal functions
    function _updateReward(bytes32 poolId, address user) internal {
        LiquidityPool storage pool = pools[poolId];
        UserLiquidity storage userLp = userLiquidity[poolId][user];
        
        if (userLp.liquidity > 0 && pool.totalLiquidity > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdate;
            uint256 reward = (timeElapsed * poolRewardRate[poolId] * userLp.liquidity) / pool.totalLiquidity;
            userLp.rewardDebt += reward;
        }
    }
    
    function _getCurrentPrice(bytes32 poolId, address tokenIn, address tokenOut) internal view returns (uint256) {
        LiquidityPool storage pool = pools[poolId];
        require(pool.active, "Pool not found");
        
        bool isTokenA = tokenIn == pool.tokenA;
        uint256 reserveIn = isTokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = isTokenA ? pool.reserveB : pool.reserveA;
        
        if (reserveIn == 0) return 0;
        return (reserveOut * 1e18) / reserveIn;
    }
    
    function _updateDailyVolume(bytes32 poolId, uint256 amount) internal {
        if (block.timestamp >= lastVolumeReset[poolId] + 24 hours) {
            poolDailyVolume[poolId] = amount;
            lastVolumeReset[poolId] = block.timestamp;
        } else {
            poolDailyVolume[poolId] += amount;
        }
        
        // 根据交易量调整APY
        _adjustAPY(poolId);
    }
    
    function _adjustAPY(bytes32 poolId) internal {
        LiquidityPool storage pool = pools[poolId];
        uint256 volume = poolDailyVolume[poolId];
        uint256 liquidity = pool.totalLiquidity;
        
        if (liquidity > 0) {
            uint256 volumeRatio = (volume * 10000) / liquidity;
            uint256 newAPY = pool.apy;
            
            if (volumeRatio > 5000) { // 50%
                newAPY = 2000; // 20% APY
            } else if (volumeRatio > 2000) { // 20%
                newAPY = 1500; // 15% APY
            } else if (volumeRatio > 1000) { // 10%
                newAPY = 1200; // 12% APY
            } else {
                newAPY = 800; // 8% APY
            }
            
            if (newAPY != pool.apy) {
                uint256 oldAPY = pool.apy;
                pool.apy = newAPY;
                emit APYUpdated(poolId, oldAPY, newAPY);
            }
        }
    }
    
    function _tryFillLimitOrders(bytes32 poolId, address tokenA, address tokenB) internal {
        // 这里可以实现自动匹配限价订单的逻辑
        // 为了简化，这里暂时留空，实际实现会检查所有相关的限价订单
    }
    
    // Admin functions
    function setTradingFee(uint256 _tradingFee) external onlyOwner {
        require(_tradingFee <= 300, "Fee too high"); // 最大3%
        tradingFee = _tradingFee;
    }
    
    function setProtocolFee(uint256 _protocolFee) external onlyOwner {
        require(_protocolFee <= 100, "Fee too high"); // 最大1%
        protocolFee = _protocolFee;
    }
    
    function setPoolRewardRate(bytes32 poolId, uint256 _rate) external onlyOwner {
        poolRewardRate[poolId] = _rate;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    function setRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = _rewardToken;
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    function getPoolCount() external view returns (uint256) {
        return poolIds.length;
    }
    
    function getAllPools() external view returns (bytes32[] memory) {
        return poolIds;
    }
} 