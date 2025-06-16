// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SimpleBank
 * @dev 现代化银行合约，支持存款、取款和利息计算
 */
contract SimpleBank is ReentrancyGuard, Ownable, Pausable {
    
    struct Account {
        uint256 balance;
        uint256 lastDepositTime;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
    }
    
    mapping(address => Account) public accounts;
    uint256 public totalBankBalance;
    uint256 public constant INTEREST_RATE = 5; // 5% 年利率
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public minimumDeposit = 0.01 ether;
    
    event Deposit(address indexed account, uint256 amount, uint256 newBalance);
    event Withdrawal(address indexed account, uint256 amount, uint256 newBalance);
    event InterestPaid(address indexed account, uint256 interest);
    event MinimumDepositUpdated(uint256 oldAmount, uint256 newAmount);
    
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }
    
    modifier sufficientBalance(uint256 _amount) {
        require(accounts[msg.sender].balance >= _amount, "Insufficient balance");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // 初始化时可以设置一些参数
    }
    
    /**
     * @dev 存款函数
     */
    function deposit() 
        external 
        payable 
        whenNotPaused 
        validAmount(msg.value) 
        nonReentrant 
    {
        require(msg.value >= minimumDeposit, "Deposit amount too small");
        
        // 先计算并支付利息
        _payInterest(msg.sender);
        
        Account storage account = accounts[msg.sender];
        account.balance += msg.value;
        account.lastDepositTime = block.timestamp;
        account.totalDeposited += msg.value;
        
        totalBankBalance += msg.value;
        
        emit Deposit(msg.sender, msg.value, account.balance);
    }
    
    /**
     * @dev 取款函数
     * @param _amount 取款金额
     */
    function withdraw(uint256 _amount) 
        external 
        whenNotPaused 
        validAmount(_amount) 
        sufficientBalance(_amount) 
        nonReentrant 
    {
        // 先计算并支付利息
        _payInterest(msg.sender);
        
        Account storage account = accounts[msg.sender];
        account.balance -= _amount;
        account.totalWithdrawn += _amount;
        
        totalBankBalance -= _amount;
        
        // 转账给用户
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, _amount, account.balance);
    }
    
    /**
     * @dev 提取全部余额
     */
    function withdrawAll() 
        external 
        whenNotPaused 
        nonReentrant 
    {
        // 先计算并支付利息
        _payInterest(msg.sender);
        
        Account storage account = accounts[msg.sender];
        uint256 accountBalance = account.balance;
        require(accountBalance > 0, "No balance to withdraw");
        
        account.balance = 0;
        account.totalWithdrawn += accountBalance;
        totalBankBalance -= accountBalance;
        
        // 转账给用户
        (bool success, ) = msg.sender.call{value: accountBalance}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, accountBalance, 0);
    }
    
    /**
     * @dev 计算并支付利息
     * @param _account 账户地址
     */
    function _payInterest(address _account) internal {
        Account storage account = accounts[_account];
        
        if (account.balance > 0 && account.lastDepositTime > 0) {
            uint256 timeElapsed = block.timestamp - account.lastDepositTime;
            uint256 interest = (account.balance * INTEREST_RATE * timeElapsed) / 
                              (100 * SECONDS_PER_YEAR);
            
            if (interest > 0) {
                account.balance += interest;
                totalBankBalance += interest;
                account.lastDepositTime = block.timestamp;
                
                emit InterestPaid(_account, interest);
            }
        }
    }
    
    /**
     * @dev 手动计算利息（只读）
     * @param _account 账户地址
     */
    function calculateInterest(address _account) 
        external 
        view 
        returns (uint256) 
    {
        Account storage account = accounts[_account];
        
        if (account.balance == 0 || account.lastDepositTime == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - account.lastDepositTime;
        return (account.balance * INTEREST_RATE * timeElapsed) / 
               (100 * SECONDS_PER_YEAR);
    }
    
    /**
     * @dev 获取账户详细信息
     * @param _account 账户地址
     */
    function getAccountInfo(address _account) 
        external 
        view 
        returns (
            uint256 balance,
            uint256 lastDepositTime,
            uint256 totalDeposited,
            uint256 totalWithdrawn,
            uint256 pendingInterest
        ) 
    {
        Account storage account = accounts[_account];
        uint256 interest = this.calculateInterest(_account);
        
        return (
            account.balance,
            account.lastDepositTime,
            account.totalDeposited,
            account.totalWithdrawn,
            interest
        );
    }
    
    /**
     * @dev 设置最小存款金额（仅所有者）
     * @param _amount 新的最小存款金额
     */
    function setMinimumDeposit(uint256 _amount) external onlyOwner {
        uint256 oldAmount = minimumDeposit;
        minimumDeposit = _amount;
        emit MinimumDepositUpdated(oldAmount, _amount);
    }
    
    /**
     * @dev 暂停合约（仅所有者）
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约（仅所有者）
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 紧急提款（仅所有者，仅在暂停状态下）
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev 获取合约余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 接收以太币（用于向合约添加资金支付利息）
     */
    receive() external payable {
        // 允许向合约发送以太币用于支付利息
    }
} 