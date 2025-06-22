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
    
    struct SocialTransfer {
        address from;
        address to;
        uint256 amount;
        string message;
        uint256 timestamp;
        bool isPublic;
    }
    
    struct SavingsGoal {
        string name;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        uint256 rewardRate; // 达成目标的奖励利率
        bool isActive;
        bool isAchieved;
    }
    
    struct FlashLoan {
        address borrower;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
        bool isActive;
    }
    
    struct CommunityPool {
        string name;
        uint256 totalAmount;
        uint256 participantCount;
        uint256 rewardRate;
        bool isActive;
        mapping(address => uint256) contributions;
        mapping(address => uint256) lastContributionTime;
    }
    
    mapping(address => Account) public accounts;
    mapping(address => Loan[]) public userLoans;
    mapping(address => Stake[]) public userStakes;
    mapping(address => SocialTransfer[]) public userSocialTransfers;
    mapping(address => SavingsGoal[]) public userSavingsGoals;
    mapping(address => FlashLoan) public activeFlashLoans;
    mapping(uint256 => CommunityPool) public communityPools;
    mapping(address => uint256[]) public userPoolParticipation;
    
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
    
    uint256 public nextPoolId = 1;
    uint256 public constant FLASH_LOAN_FEE = 5; // 0.05% 闪电贷手续费
    uint256 public constant COMMUNITY_REWARD_RATE = 800; // 8% 社区池奖励率
    
    event Deposit(address indexed account, uint256 amount, uint256 newBalance);
    event Withdrawal(address indexed account, uint256 amount, uint256 newBalance);
    event InterestPaid(address indexed account, uint256 interest);
    event LoanCreated(address indexed borrower, uint256 loanId, uint256 amount, uint256 collateral);
    event LoanRepaid(address indexed borrower, uint256 loanId, uint256 amount);
    event StakeCreated(address indexed staker, uint256 stakeId, uint256 amount);
    event StakeWithdrawn(address indexed staker, uint256 stakeId, uint256 amount, uint256 reward);
    event Transfer(address indexed from, address indexed to, uint256 amount, string transferType);
    event ExternalTransfer(address indexed from, address indexed to, uint256 amount);
    event UserToUserTransfer(address indexed from, address indexed to, uint256 amount);
    event SocialTransferSent(address indexed from, address indexed to, uint256 amount, string message, bool isPublic);
    event SavingsGoalCreated(address indexed user, uint256 goalId, string name, uint256 targetAmount);
    event SavingsGoalAchieved(address indexed user, uint256 goalId, uint256 rewardAmount);
    event FlashLoanTaken(address indexed borrower, uint256 amount, uint256 fee);
    event FlashLoanRepaid(address indexed borrower, uint256 amount, uint256 fee);
    event CommunityPoolCreated(uint256 indexed poolId, string name, uint256 rewardRate);
    event CommunityPoolContribution(uint256 indexed poolId, address indexed contributor, uint256 amount);
    
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
    
    /**
     * @dev 内部账户转账 - 将银行余额转给其他用户的银行账户
     */
    function transferInternal(address _to, uint256 _amount) 
        external 
        whenNotPaused 
        validAmount(_amount) 
        sufficientBalance(_amount) 
        nonReentrant 
    {
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot transfer to yourself");
        
        // 先计算并支付利息给双方
        _payInterest(msg.sender);
        _payInterest(_to);
        
        Account storage fromAccount = accounts[msg.sender];
        Account storage toAccount = accounts[_to];
        
        fromAccount.balance -= _amount;
        toAccount.balance += _amount;
        
        emit Transfer(msg.sender, _to, _amount, "internal");
    }
    
    /**
     * @dev 外部转账 - 将银行余额直接转到外部地址
     */
    function transferExternal(address payable _to, uint256 _amount) 
        external 
        whenNotPaused 
        validAmount(_amount) 
        sufficientBalance(_amount) 
        nonReentrant 
    {
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot transfer to yourself");
        
        // 先计算并支付利息
        _payInterest(msg.sender);
        
        Account storage account = accounts[msg.sender];
        account.balance -= _amount;
        account.totalWithdrawn += _amount;
        
        totalBankBalance -= _amount;
        
        // 转账给接收者
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "External transfer failed");
        
        emit ExternalTransfer(msg.sender, _to, _amount);
    }
    
    /**
     * @dev 批量转账 - 一次性转账给多个地址
     */
    function batchTransfer(address[] calldata _recipients, uint256[] calldata _amounts, bool _internal) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length > 0 && _recipients.length <= 50, "Invalid recipients count");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_amounts[i] > 0, "Invalid amount");
            totalAmount += _amounts[i];
        }
        
        require(accounts[msg.sender].balance >= totalAmount, "Insufficient total balance");
        
        // 先计算并支付利息
        _payInterest(msg.sender);
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            uint256 amount = _amounts[i];
            
            require(recipient != address(0), "Invalid recipient");
            require(recipient != msg.sender, "Cannot transfer to yourself");
            
            if (_internal) {
                // 内部转账
                _payInterest(recipient);
                accounts[msg.sender].balance -= amount;
                accounts[recipient].balance += amount;
                emit Transfer(msg.sender, recipient, amount, "batch_internal");
            } else {
                // 外部转账
                accounts[msg.sender].balance -= amount;
                accounts[msg.sender].totalWithdrawn += amount;
                totalBankBalance -= amount;
                
                (bool success, ) = payable(recipient).call{value: amount}("");
                require(success, "Batch external transfer failed");
                emit ExternalTransfer(msg.sender, recipient, amount);
            }
        }
    }
    
    /**
     * @dev 用户到用户转账 - 使用钱包余额，通过合约记录转账
     */
    function userToUserTransfer(address payable _to) 
        external 
        payable
        whenNotPaused 
        validAmount(msg.value) 
        nonReentrant 
    {
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot transfer to yourself");
        
        // 直接转账给接收者
        (bool success, ) = _to.call{value: msg.value}("");
        require(success, "User transfer failed");
        
        // 记录转账事件用于统计和追踪
        emit UserToUserTransfer(msg.sender, _to, msg.value);
    }
    
    /**
     * @dev 批量用户转账 - 使用钱包余额，批量转给多个用户
     */
    function batchUserTransfer(address[] calldata _recipients, uint256[] calldata _amounts) 
        external 
        payable
        whenNotPaused 
        nonReentrant 
    {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length > 0 && _recipients.length <= 50, "Invalid recipients count");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            require(_amounts[i] > 0, "Invalid amount");
            totalAmount += _amounts[i];
        }
        
        require(msg.value >= totalAmount, "Insufficient payment amount");
        
        // 执行所有转账
        for (uint256 i = 0; i < _recipients.length; i++) {
            address payable recipient = payable(_recipients[i]);
            uint256 amount = _amounts[i];
            
            require(recipient != address(0), "Invalid recipient");
            require(recipient != msg.sender, "Cannot transfer to yourself");
            
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "Batch user transfer failed");
            
            emit UserToUserTransfer(msg.sender, recipient, amount);
        }
        
        // 退还多余的金额
        uint256 refund = msg.value - totalAmount;
        if (refund > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: refund}("");
            require(refundSuccess, "Refund failed");
        }
    }
    
    // ===========================================
    // Web3 创新功能实现
    // ===========================================
    
    /**
     * @dev 社交转账 - 带消息和公开选项的转账
     */
    function socialTransfer(address payable _to, string calldata _message, bool _isPublic) 
        external 
        payable
        whenNotPaused 
        validAmount(msg.value) 
        nonReentrant 
    {
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot transfer to yourself");
        require(bytes(_message).length <= 280, "Message too long"); // Twitter风格限制
        
        // 执行转账
        (bool success, ) = _to.call{value: msg.value}("");
        require(success, "Social transfer failed");
        
        // 记录社交转账
        SocialTransfer memory newTransfer = SocialTransfer({
            from: msg.sender,
            to: _to,
            amount: msg.value,
            message: _message,
            timestamp: block.timestamp,
            isPublic: _isPublic
        });
        
        userSocialTransfers[msg.sender].push(newTransfer);
        userSocialTransfers[_to].push(newTransfer);
        
        emit SocialTransferSent(msg.sender, _to, msg.value, _message, _isPublic);
    }
    
    /**
     * @dev 创建储蓄目标
     */
    function createSavingsGoal(
        string calldata _name,
        uint256 _targetAmount,
        uint256 _durationDays
    ) external {
        require(_targetAmount >= 0.1 ether, "Target amount too small");
        require(_durationDays >= 7 && _durationDays <= 365, "Invalid duration");
        require(bytes(_name).length > 0 && bytes(_name).length <= 50, "Invalid goal name");
        
        uint256 deadline = block.timestamp + (_durationDays * 1 days);
        uint256 rewardRate = _calculateGoalRewardRate(_durationDays, _targetAmount);
        
        SavingsGoal memory newGoal = SavingsGoal({
            name: _name,
            targetAmount: _targetAmount,
            currentAmount: 0,
            deadline: deadline,
            rewardRate: rewardRate,
            isActive: true,
            isAchieved: false
        });
        
        userSavingsGoals[msg.sender].push(newGoal);
        uint256 goalId = userSavingsGoals[msg.sender].length - 1;
        
        emit SavingsGoalCreated(msg.sender, goalId, _name, _targetAmount);
    }
    
    /**
     * @dev 向储蓄目标存款
     */
    function contributeToSavingsGoal(uint256 _goalId) 
        external 
        payable 
        whenNotPaused 
        validAmount(msg.value) 
        nonReentrant 
    {
        require(_goalId < userSavingsGoals[msg.sender].length, "Invalid goal ID");
        
        SavingsGoal storage goal = userSavingsGoals[msg.sender][_goalId];
        require(goal.isActive, "Goal is not active");
        require(block.timestamp <= goal.deadline, "Goal deadline passed");
        require(!goal.isAchieved, "Goal already achieved");
        
        // 存入银行账户
        _payInterest(msg.sender);
        Account storage account = accounts[msg.sender];
        account.balance += msg.value;
        account.totalDeposited += msg.value;
        totalBankBalance += msg.value;
        
        // 更新目标进度
        goal.currentAmount += msg.value;
        
        // 检查是否达成目标
        if (goal.currentAmount >= goal.targetAmount) {
            goal.isAchieved = true;
            uint256 rewardAmount = (goal.targetAmount * goal.rewardRate) / 10000;
            account.balance += rewardAmount;
            totalBankBalance += rewardAmount;
            
            emit SavingsGoalAchieved(msg.sender, _goalId, rewardAmount);
        }
        
        emit Deposit(msg.sender, msg.value, account.balance);
    }
    
    /**
     * @dev 闪电贷 - DeFi特色功能
     */
    function takeFlashLoan(uint256 _amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(_amount > 0 && _amount <= address(this).balance / 2, "Invalid loan amount");
        require(!activeFlashLoans[msg.sender].isActive, "Active flash loan exists");
        
        uint256 fee = (_amount * FLASH_LOAN_FEE) / 10000;
        
        // 记录闪电贷
        activeFlashLoans[msg.sender] = FlashLoan({
            borrower: msg.sender,
            amount: _amount,
            fee: fee,
            timestamp: block.timestamp,
            isActive: true
        });
        
        // 发放贷款
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Flash loan transfer failed");
        
        emit FlashLoanTaken(msg.sender, _amount, fee);
    }
    
    /**
     * @dev 偿还闪电贷
     */
    function repayFlashLoan() 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
    {
        FlashLoan storage loan = activeFlashLoans[msg.sender];
        require(loan.isActive, "No active flash loan");
        require(block.timestamp <= loan.timestamp + 1 hours, "Flash loan expired");
        
        uint256 totalRepayment = loan.amount + loan.fee;
        require(msg.value >= totalRepayment, "Insufficient repayment");
        
        // 清除贷款记录
        loan.isActive = false;
        
        // 退还多余资金
        if (msg.value > totalRepayment) {
            (bool success, ) = msg.sender.call{value: msg.value - totalRepayment}("");
            require(success, "Refund failed");
        }
        
        emit FlashLoanRepaid(msg.sender, loan.amount, loan.fee);
    }
    
    /**
     * @dev 创建社区储蓄池
     */
    function createCommunityPool(string calldata _name) external onlyOwner {
        require(bytes(_name).length > 0 && bytes(_name).length <= 50, "Invalid pool name");
        
        uint256 poolId = nextPoolId++;
        CommunityPool storage pool = communityPools[poolId];
        pool.name = _name;
        pool.totalAmount = 0;
        pool.participantCount = 0;
        pool.rewardRate = COMMUNITY_REWARD_RATE;
        pool.isActive = true;
        
        emit CommunityPoolCreated(poolId, _name, COMMUNITY_REWARD_RATE);
    }
    
    /**
     * @dev 向社区池贡献
     */
    function contributeToPool(uint256 _poolId) 
        external 
        payable 
        whenNotPaused 
        validAmount(msg.value) 
        nonReentrant 
    {
        require(communityPools[_poolId].isActive, "Pool not active");
        
        CommunityPool storage pool = communityPools[_poolId];
        
        // 首次参与
        if (pool.contributions[msg.sender] == 0) {
            pool.participantCount++;
            userPoolParticipation[msg.sender].push(_poolId);
        }
        
        pool.contributions[msg.sender] += msg.value;
        pool.lastContributionTime[msg.sender] = block.timestamp;
        pool.totalAmount += msg.value;
        
        emit CommunityPoolContribution(_poolId, msg.sender, msg.value);
    }
    
    /**
     * @dev 跨链转账支持（概念实现）
     */
    function initiateCrossChainTransfer(
        address _to,
        uint256 _amount,
        uint256 _targetChainId
    ) external payable whenNotPaused validAmount(msg.value) nonReentrant {
        require(_to != address(0), "Invalid recipient");
        require(_targetChainId != block.chainid, "Same chain transfer");
        require(msg.value == _amount, "Amount mismatch");
        
        // 简化的跨链转账逻辑
        // 实际实现需要集成LayerZero、Chainlink CCIP等协议
        
        emit CrossChainTransferInitiated(msg.sender, _to, _amount, _targetChainId);
    }
    
    // ===========================================
    // 辅助函数
    // ===========================================
    
    /**
     * @dev 计算储蓄目标奖励利率
     */
    function _calculateGoalRewardRate(uint256 _days, uint256 _amount) internal pure returns (uint256) {
        uint256 baseRate = 200; // 2%
        uint256 timeBonus = (_days / 30) * 50; // 每月额外0.5%
        uint256 amountBonus = (_amount / 1 ether) * 10; // 每ETH额外0.1%
        return baseRate + timeBonus + amountBonus;
    }
    
    /**
     * @dev 获取用户社交转账记录
     */
    function getUserSocialTransfers(address _user) external view returns (SocialTransfer[] memory) {
        return userSocialTransfers[_user];
    }
    
    /**
     * @dev 获取用户储蓄目标
     */
    function getUserSavingsGoals(address _user) external view returns (SavingsGoal[] memory) {
        return userSavingsGoals[_user];
    }
    
    /**
     * @dev 获取社区池信息
     */
    function getPoolInfo(uint256 _poolId) external view returns (
        string memory name,
        uint256 totalAmount,
        uint256 participantCount,
        uint256 rewardRate,
        bool isActive
    ) {
        CommunityPool storage pool = communityPools[_poolId];
        return (pool.name, pool.totalAmount, pool.participantCount, pool.rewardRate, pool.isActive);
    }
    
    /**
     * @dev 获取用户在池中的贡献
     */
    function getUserPoolContribution(uint256 _poolId, address _user) external view returns (uint256) {
        return communityPools[_poolId].contributions[_user];
    }
    
    // 新增事件
    event CrossChainTransferInitiated(address indexed from, address indexed to, uint256 amount, uint256 targetChainId);
} 