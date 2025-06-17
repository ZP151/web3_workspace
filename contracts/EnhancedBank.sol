// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EnhancedBank
 * @dev 增强版银行合约，支持存款、取款、利息计算、贷款和质押
 */
contract EnhancedBank is ReentrancyGuard, Ownable, Pausable {
    
    struct Account {
        uint256 balance;
        uint256 lastDepositTime;
        uint256 totalDeposited;
        uint256 totalWithdrawn;
    }
    
    struct Loan {
        uint256 amount;
        uint256 collateral;
        uint256 startTime;
        uint256 interestRate; // 年利率，基点表示 (8.5% = 850)
        bool isActive;
    }
    
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod; // 锁定期（秒）
        uint256 rewardRate; // 年利率，基点表示 (12.5% = 1250)
        bool isActive;
    }
    
    mapping(address => Account) public accounts;
    mapping(address => Loan[]) public userLoans;
    mapping(address => Stake[]) public userStakes;
    
    uint256 public totalBankBalance;
    uint256 public totalLoanAmount;
    uint256 public totalStakedAmount;
    
    uint256 public constant DEPOSIT_INTEREST_RATE = 5; // 5% 年利率
    uint256 public constant LOAN_INTEREST_RATE = 850; // 8.5% 年利率
    uint256 public constant STAKING_REWARD_RATE = 1250; // 12.5% 年利率
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant COLLATERAL_RATIO = 150; // 150% 抵押率
    uint256 public constant STAKING_LOCK_PERIOD = 7 days; // 7天锁定期
    
    uint256 public minimumDeposit = 0.01 ether;
    uint256 public minimumLoan = 0.1 ether;
    uint256 public minimumStake = 0.1 ether;
    
    event Deposit(address indexed account, uint256 amount, uint256 newBalance);
    event Withdrawal(address indexed account, uint256 amount, uint256 newBalance);
    event InterestPaid(address indexed account, uint256 interest);
    event LoanCreated(address indexed borrower, uint256 loanId, uint256 amount, uint256 collateral);
    event LoanRepaid(address indexed borrower, uint256 loanId, uint256 amount);
    event StakeCreated(address indexed staker, uint256 stakeId, uint256 amount);
    event StakeWithdrawn(address indexed staker, uint256 stakeId, uint256 amount, uint256 reward);
    
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
     * @dev 申请贷款
     */
    function requestLoan(uint256 _loanAmount) 
        external 
        payable 
        whenNotPaused 
        validAmount(_loanAmount) 
        nonReentrant 
    {
        require(_loanAmount >= minimumLoan, "Loan amount too small");
        
        uint256 requiredCollateral = (_loanAmount * COLLATERAL_RATIO) / 100;
        require(msg.value >= requiredCollateral, "Insufficient collateral");
        require(address(this).balance >= _loanAmount, "Insufficient bank liquidity");
        
        Loan memory newLoan = Loan({
            amount: _loanAmount,
            collateral: msg.value,
            startTime: block.timestamp,
            interestRate: LOAN_INTEREST_RATE,
            isActive: true
        });
        
        userLoans[msg.sender].push(newLoan);
        uint256 loanId = userLoans[msg.sender].length - 1;
        
        totalLoanAmount += _loanAmount;
        
        // 发放贷款
        (bool success, ) = msg.sender.call{value: _loanAmount}("");
        require(success, "Loan transfer failed");
        
        emit LoanCreated(msg.sender, loanId, _loanAmount, msg.value);
    }
    
    /**
     * @dev 偿还贷款
     */
    function repayLoan(uint256 _loanId) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
    {
        require(_loanId < userLoans[msg.sender].length, "Invalid loan ID");
        
        Loan storage loan = userLoans[msg.sender][_loanId];
        require(loan.isActive, "Loan is not active");
        
        uint256 interest = calculateLoanInterest(msg.sender, _loanId);
        uint256 totalRepayment = loan.amount + interest;
        
        require(msg.value >= totalRepayment, "Insufficient repayment amount");
        
        // 标记贷款为已偿还
        loan.isActive = false;
        totalLoanAmount -= loan.amount;
        
        // 退还抵押品
        uint256 collateralToReturn = loan.collateral;
        
        // 退还多余的还款
        uint256 excessPayment = msg.value - totalRepayment;
        uint256 totalRefund = collateralToReturn + excessPayment;
        
        if (totalRefund > 0) {
            (bool success, ) = msg.sender.call{value: totalRefund}("");
            require(success, "Refund transfer failed");
        }
        
        emit LoanRepaid(msg.sender, _loanId, totalRepayment);
    }
    
    /**
     * @dev 质押ETH
     */
    function stake() 
        external 
        payable 
        whenNotPaused 
        validAmount(msg.value) 
        nonReentrant 
    {
        require(msg.value >= minimumStake, "Stake amount too small");
        
        Stake memory newStake = Stake({
            amount: msg.value,
            startTime: block.timestamp,
            lockPeriod: STAKING_LOCK_PERIOD,
            rewardRate: STAKING_REWARD_RATE,
            isActive: true
        });
        
        userStakes[msg.sender].push(newStake);
        uint256 stakeId = userStakes[msg.sender].length - 1;
        
        totalStakedAmount += msg.value;
        
        emit StakeCreated(msg.sender, stakeId, msg.value);
    }
    
    /**
     * @dev 解除质押
     */
    function unstake(uint256 _stakeId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(_stakeId < userStakes[msg.sender].length, "Invalid stake ID");
        
        Stake storage stakeInfo = userStakes[msg.sender][_stakeId];
        require(stakeInfo.isActive, "Stake is not active");
        require(block.timestamp >= stakeInfo.startTime + stakeInfo.lockPeriod, "Stake is still locked");
        
        uint256 reward = calculateStakingReward(msg.sender, _stakeId);
        uint256 totalWithdrawal = stakeInfo.amount + reward;
        
        // 标记质押为已解除
        stakeInfo.isActive = false;
        totalStakedAmount -= stakeInfo.amount;
        
        // 发放质押本金和奖励
        (bool success, ) = msg.sender.call{value: totalWithdrawal}("");
        require(success, "Unstake transfer failed");
        
        emit StakeWithdrawn(msg.sender, _stakeId, stakeInfo.amount, reward);
    }
    
    /**
     * @dev 计算并支付存款利息
     */
    function _payInterest(address _account) internal {
        Account storage account = accounts[_account];
        
        if (account.balance > 0 && account.lastDepositTime > 0) {
            uint256 timeElapsed = block.timestamp - account.lastDepositTime;
            uint256 interest = (account.balance * DEPOSIT_INTEREST_RATE * timeElapsed) / 
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
     * @dev 计算贷款利息
     */
    function calculateLoanInterest(address _borrower, uint256 _loanId) 
        public 
        view 
        returns (uint256) 
    {
        require(_loanId < userLoans[_borrower].length, "Invalid loan ID");
        
        Loan storage loan = userLoans[_borrower][_loanId];
        if (!loan.isActive) return 0;
        
        uint256 timeElapsed = block.timestamp - loan.startTime;
        return (loan.amount * loan.interestRate * timeElapsed) / (10000 * SECONDS_PER_YEAR);
    }
    
    /**
     * @dev 计算质押奖励
     */
    function calculateStakingReward(address _staker, uint256 _stakeId) 
        public 
        view 
        returns (uint256) 
    {
        require(_stakeId < userStakes[_staker].length, "Invalid stake ID");
        
        Stake storage stakeInfo = userStakes[_staker][_stakeId];
        if (!stakeInfo.isActive) return 0;
        
        uint256 timeElapsed = block.timestamp - stakeInfo.startTime;
        return (stakeInfo.amount * stakeInfo.rewardRate * timeElapsed) / (10000 * SECONDS_PER_YEAR);
    }
    
    /**
     * @dev 获取用户贷款信息
     */
    function getUserLoans(address _user) 
        external 
        view 
        returns (Loan[] memory) 
    {
        return userLoans[_user];
    }
    
    /**
     * @dev 获取用户质押信息
     */
    function getUserStakes(address _user) 
        external 
        view 
        returns (Stake[] memory) 
    {
        return userStakes[_user];
    }
    
    /**
     * @dev 获取账户详细信息
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
        uint256 interest = 0;
        
        if (account.balance > 0 && account.lastDepositTime > 0) {
            uint256 timeElapsed = block.timestamp - account.lastDepositTime;
            interest = (account.balance * DEPOSIT_INTEREST_RATE * timeElapsed) / 
                      (100 * SECONDS_PER_YEAR);
        }
        
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
     */
    function setMinimumDeposit(uint256 _amount) external onlyOwner {
        minimumDeposit = _amount;
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
     * @dev 接收以太币
     */
    receive() external payable {
        // 允许向合约发送以太币
    }
} 