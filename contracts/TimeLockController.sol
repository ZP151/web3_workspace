// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TimeLockController
 * @dev 时间锁定控制器，用于延迟执行关键操作
 * 
 * 功能：
 * - 关键操作必须先提议，等待延迟期后才能执行
 * - 提供取消恶意提议的机制
 * - 支持多个提议者和执行者角色
 * - 增强去中心化治理的安全性
 */
contract PlatformTimeLock is TimelockController {
    /**
     * @dev 构造函数
     * @param minDelay 最小延迟时间（秒）
     * @param proposers 提议者地址数组
     * @param executors 执行者地址数组
     * @param admin 管理员地址（可以为空地址以实现完全去中心化）
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        // TimelockController已经处理了所有初始化逻辑
    }

    /**
     * @dev 获取最小延迟时间
     */
    function getMinDelayTime() external view returns (uint256) {
        return super.getMinDelay();
    }

    /**
     * @dev 检查操作是否准备就绪
     */
    function checkOperationReady(bytes32 id) external view returns (bool) {
        return super.isOperationReady(id);
    }

    /**
     * @dev 检查操作是否已完成
     */
    function checkOperationDone(bytes32 id) external view returns (bool) {
        return super.isOperationDone(id);
    }

    /**
     * @dev 获取操作的时间戳
     */
    function getOperationTimestamp(bytes32 id) external view returns (uint256) {
        return super.getTimestamp(id);
    }
} 