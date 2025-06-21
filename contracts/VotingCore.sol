// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VotingCore
 * @dev 现代化投票智能合约，支持提案创建、付费投票和执行
 */
contract VotingCore is Ownable, ReentrancyGuard {
    
    enum ProposalType { SIMPLE, MULTIPLE_CHOICE, WEIGHTED }
    enum ProposalCategory { GOVERNANCE, FINANCE, TECHNICAL, COMMUNITY }
    
    struct Proposal {
        string title;
        string description;
        uint256 voteCount;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votes; // 用户投票权重
        uint256 minVotes; // 最少投票数要求
        ProposalType proposalType;
        ProposalCategory category;
        address creator;
        uint256 createdAt;
        string[] options; // 多选题选项
        mapping(uint256 => uint256) optionVotes; // 选项投票数
    }
    
    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    
    // 投票权重映射
    mapping(address => uint256) public votingPower;
    uint256 public totalVotingPower;
    
    // 费用设置
    uint256 public proposalCreationFee = 0.001 ether; // 创建提案费用
    uint256 public votingFee = 0.001 ether; // 投票费用
    uint256 public baseVotingPower = 1; // 基础投票权重
    
    // 统计数据
    uint256 public totalProposals;
    uint256 public totalVotes;
    mapping(address => uint256) public userProposalCount;
    mapping(address => uint256) public userVoteCount;
    
    event ProposalCreated(
        uint256 indexed proposalId, 
        string title,
        string description, 
        uint256 deadline,
        uint256 minVotes,
        address indexed creator,
        ProposalType proposalType,
        ProposalCategory category
    );
    
    event VoteCast(
        uint256 indexed proposalId, 
        address indexed voter, 
        uint256 weight,
        uint256 optionId
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    
    event VotingPowerUpdated(address indexed account, uint256 oldPower, uint256 newPower);
    
    event VotingFeeUpdated(uint256 oldFee, uint256 newFee);
    
    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId < _proposalIdCounter, "Proposal does not exist");
        _;
    }
    
    modifier votingActive(uint256 _proposalId) {
        require(block.timestamp <= proposals[_proposalId].deadline, "Voting period has ended");
        _;
    }
    
    modifier votingEnded(uint256 _proposalId) {
        require(block.timestamp > proposals[_proposalId].deadline, "Voting period is still active");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // 给创建者初始投票权
        votingPower[msg.sender] = 1000;
        totalVotingPower = 1000;
        emit VotingPowerUpdated(msg.sender, 0, 1000);
    }
    
    /**
     * @dev 创建新提案 - 任何用户都可以创建
     */
    function createProposal(
        string memory _title,
        string memory _description, 
        uint256 _durationHours,
        uint256 _minVotes,
        ProposalType _proposalType,
        ProposalCategory _category,
        string[] memory _options
    ) external payable returns (uint256 proposalId) {
        require(_durationHours > 0, "Duration must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(msg.value >= proposalCreationFee, "Insufficient fee for proposal creation");
        
        // 如果是多选题，需要提供选项
        if (_proposalType == ProposalType.MULTIPLE_CHOICE) {
            require(_options.length >= 2, "Multiple choice needs at least 2 options");
            require(_options.length <= 10, "Too many options");
        }
        
        // 给新用户基础投票权
        if (votingPower[msg.sender] == 0) {
            votingPower[msg.sender] = baseVotingPower;
            totalVotingPower += baseVotingPower;
            emit VotingPowerUpdated(msg.sender, 0, baseVotingPower);
        }
        
        proposalId = _proposalIdCounter;
        uint256 deadline = block.timestamp + (_durationHours * 1 hours);
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.deadline = deadline;
        newProposal.voteCount = 0;
        newProposal.executed = false;
        newProposal.minVotes = _minVotes;
        newProposal.proposalType = _proposalType;
        newProposal.category = _category;
        newProposal.creator = msg.sender;
        newProposal.createdAt = block.timestamp;
        
        // 设置选项
        for (uint256 i = 0; i < _options.length; i++) {
            newProposal.options.push(_options[i]);
        }
        
        emit ProposalCreated(
            proposalId, 
            _title,
            _description, 
            deadline, 
            _minVotes, 
            msg.sender,
            _proposalType,
            _category
        );
        
        _proposalIdCounter++;
        totalProposals++;
        userProposalCount[msg.sender]++;
        
        // 返回多余的费用
        if (msg.value > proposalCreationFee) {
            payable(msg.sender).transfer(msg.value - proposalCreationFee);
        }
    }
    
    /**
     * @dev 付费投票 - 用户需要支付投票费用
     */
    function vote(uint256 _proposalId, uint256 _optionId) 
        external 
        payable
        proposalExists(_proposalId) 
        votingActive(_proposalId)
        nonReentrant 
    {
        _voteWithWeight(_proposalId, _optionId, 0); // 使用用户基础权重
    }
    
    /**
     * @dev 权重投票 - 允许用户指定投票权重
     */
    function voteWithWeight(uint256 _proposalId, uint256 _optionId, uint256 _weight) 
        external 
        payable
        proposalExists(_proposalId) 
        votingActive(_proposalId)
        nonReentrant 
    {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.proposalType == ProposalType.WEIGHTED, "Not a weighted vote proposal");
        require(_weight > 0, "Weight must be greater than 0");
        require(_weight <= votingPower[msg.sender], "Weight exceeds voting power");
        
        _voteWithWeight(_proposalId, _optionId, _weight);
    }
    
    /**
     * @dev 内部投票函数
     */
    function _voteWithWeight(uint256 _proposalId, uint256 _optionId, uint256 _customWeight) 
        internal 
    {
        require(msg.value >= votingFee, "Insufficient voting fee");
        
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // 验证选项ID
        if (proposal.proposalType == ProposalType.MULTIPLE_CHOICE) {
            require(_optionId < proposal.options.length, "Invalid option");
        } else {
            require(_optionId == 0, "Simple vote should use option 0");
        }
        
        // 如果用户没有投票权，根据支付费用分配权重
        if (votingPower[msg.sender] == 0) {
            uint256 power = baseVotingPower;
            // 支付更多费用可以获得更多投票权重
            if (msg.value >= votingFee * 5) {
                power = 5;
            } else if (msg.value >= votingFee * 3) {
                power = 3;
            } else if (msg.value >= votingFee * 2) {
                power = 2;
            }
            
            votingPower[msg.sender] = power;
            totalVotingPower += power;
            emit VotingPowerUpdated(msg.sender, 0, power);
        }
        
        // 确定实际使用的投票权重
        uint256 actualWeight;
        if (_customWeight > 0 && proposal.proposalType == ProposalType.WEIGHTED) {
            actualWeight = _customWeight;
            // 权重投票需要按权重比例支付费用
            uint256 requiredFee = votingFee * _customWeight;
            require(msg.value >= requiredFee, "Insufficient fee for weighted vote");
        } else {
            actualWeight = votingPower[msg.sender];
        }
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = actualWeight;
        proposal.voteCount += actualWeight;
        
        // 记录选项投票
        if (proposal.proposalType == ProposalType.MULTIPLE_CHOICE || proposal.proposalType == ProposalType.WEIGHTED) {
            proposal.optionVotes[_optionId] += actualWeight;
        }
        
        totalVotes++;
        userVoteCount[msg.sender]++;
        
        emit VoteCast(_proposalId, msg.sender, actualWeight, _optionId);
        
        // 返回多余的费用
        uint256 usedFee = (_customWeight > 0 && proposal.proposalType == ProposalType.WEIGHTED) 
            ? votingFee * _customWeight 
            : votingFee;
        if (msg.value > usedFee) {
            payable(msg.sender).transfer(msg.value - usedFee);
        }
    }
    
    /**
     * @dev 执行提案
     */
    function executeProposal(uint256 _proposalId) 
        external 
        proposalExists(_proposalId)
        votingEnded(_proposalId)
    {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.voteCount >= proposal.minVotes, "Insufficient votes");
        
        // 只有提案创建者或合约所有者可以执行
        require(
            msg.sender == proposal.creator || msg.sender == owner(),
            "Not authorized to execute"
        );
        
        proposal.executed = true;
        emit ProposalExecuted(_proposalId);
    }
    
    /**
     * @dev 获取提案完整信息
     */
    function getProposal(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId)
        returns (
            string memory title,
            string memory description,
            uint256 voteCount,
            uint256 deadline,
            bool executed,
            uint256 minVotes,
            ProposalType proposalType,
            ProposalCategory category,
            address creator,
            uint256 createdAt
        ) 
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.title,
            proposal.description, 
            proposal.voteCount, 
            proposal.deadline, 
            proposal.executed,
            proposal.minVotes,
            proposal.proposalType,
            proposal.category,
            proposal.creator,
            proposal.createdAt
        );
    }
    
    /**
     * @dev 获取提案选项
     */
    function getProposalOptions(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId)
        returns (string[] memory options, uint256[] memory optionVotes) 
    {
        Proposal storage proposal = proposals[_proposalId];
        options = proposal.options;
        optionVotes = new uint256[](proposal.options.length);
        
        for (uint256 i = 0; i < proposal.options.length; i++) {
            optionVotes[i] = proposal.optionVotes[i];
        }
    }
    
    /**
     * @dev 检查是否已投票
     */
    function hasVoted(uint256 _proposalId, address _voter) 
        external 
        view 
        proposalExists(_proposalId)
        returns (bool) 
    {
        return proposals[_proposalId].hasVoted[_voter];
    }
    
    /**
     * @dev 获取用户在特定提案的投票权重
     */
    function getUserVote(uint256 _proposalId, address _voter) 
        external 
        view 
        proposalExists(_proposalId)
        returns (uint256) 
    {
        return proposals[_proposalId].votes[_voter];
    }
    
    /**
     * @dev 获取提案总数
     */
    function getProposalCount() external view returns (uint256) {
        return _proposalIdCounter;
    }
    
    /**
     * @dev 获取统计数据
     */
    function getStats() external view returns (
        uint256 _totalProposals,
        uint256 _totalVotes,
        uint256 _totalVotingPower,
        uint256 _currentVotingFee,
        uint256 _currentProposalFee
    ) {
        return (
            totalProposals,
            totalVotes,
            totalVotingPower,
            votingFee,
            proposalCreationFee
        );
    }
    
    /**
     * @dev 设置投票费用 - 只有所有者可以调用
     */
    function setVotingFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = votingFee;
        votingFee = _newFee;
        emit VotingFeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @dev 设置提案创建费用
     */
    function setProposalCreationFee(uint256 _newFee) external onlyOwner {
        proposalCreationFee = _newFee;
    }
    
    /**
     * @dev 设置基础投票权重
     */
    function setBaseVotingPower(uint256 _newPower) external onlyOwner {
        baseVotingPower = _newPower;
    }
    
    /**
     * @dev 设置投票权重
     */
    function setVotingPower(address _account, uint256 _power) external onlyOwner {
        require(_account != address(0), "Invalid address");
        
        uint256 oldPower = votingPower[_account];
        votingPower[_account] = _power;
        
        // 更新总投票权重
        totalVotingPower = totalVotingPower - oldPower + _power;
        
        emit VotingPowerUpdated(_account, oldPower, _power);
    }
    
    /**
     * @dev 提取合约余额 - 只有所有者可以调用
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev 紧急暂停提案投票
     */
    function emergencyPauseProposal(uint256 _proposalId) external onlyOwner proposalExists(_proposalId) {
        proposals[_proposalId].deadline = block.timestamp;
    }
} 