// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VotingCore
 * @dev 现代化投票智能合约，支持提案创建、投票和执行
 */
contract VotingCore is Ownable, ReentrancyGuard {
    
    struct Proposal {
        string description;
        uint256 voteCount;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
        uint256 minVotes; // 最少投票数要求
    }
    
    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    
    // 投票权重映射
    mapping(address => uint256) public votingPower;
    uint256 public totalVotingPower;
    
    // 创建提案费用
    uint256 public proposalCreationFee = 0.001 ether; // 0.001 ETH to create a proposal
    
    event ProposalCreated(
        uint256 indexed proposalId, 
        string description, 
        uint256 deadline,
        uint256 minVotes,
        address indexed creator
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event VotingPowerUpdated(address indexed account, uint256 oldPower, uint256 newPower);
    
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
        
        // 给所有用户基础投票权
        votingPower[address(0)] = 1; // 设置默认投票权
    }
    
    /**
     * @dev 创建新提案 - 任何用户都可以创建
     * @param _description 提案描述
     * @param _durationHours 投票持续时间（小时）
     * @param _minVotes 最少投票数要求
     */
    function createProposal(
        string memory _description, 
        uint256 _durationHours,
        uint256 _minVotes
    ) external payable {
        require(_durationHours > 0, "Duration must be greater than 0");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(msg.value >= proposalCreationFee, "Insufficient fee for proposal creation");
        
        // 给新用户基础投票权
        if (votingPower[msg.sender] == 0) {
            votingPower[msg.sender] = 1;
            totalVotingPower += 1;
            emit VotingPowerUpdated(msg.sender, 0, 1);
        }
        
        uint256 proposalId = _proposalIdCounter;
        uint256 deadline = block.timestamp + (_durationHours * 1 hours);
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.description = _description;
        newProposal.deadline = deadline;
        newProposal.voteCount = 0;
        newProposal.executed = false;
        newProposal.minVotes = _minVotes;
        
        emit ProposalCreated(proposalId, _description, deadline, _minVotes, msg.sender);
        _proposalIdCounter++;
        
        // 返回多余的费用
        if (msg.value > proposalCreationFee) {
            payable(msg.sender).transfer(msg.value - proposalCreationFee);
        }
    }
    
    /**
     * @dev 投票 - 自动给用户分配投票权
     * @param _proposalId 提案ID
     */
    function vote(uint256 _proposalId) 
        external 
        proposalExists(_proposalId) 
        votingActive(_proposalId)
        nonReentrant 
    {
        // 如果用户没有投票权，自动分配基础权重
        if (votingPower[msg.sender] == 0) {
            votingPower[msg.sender] = 1;
            totalVotingPower += 1;
            emit VotingPowerUpdated(msg.sender, 0, 1);
        }
        
        require(!proposals[_proposalId].hasVoted[msg.sender], "Already voted");
        
        proposals[_proposalId].hasVoted[msg.sender] = true;
        proposals[_proposalId].voteCount += votingPower[msg.sender];
        
        emit VoteCast(_proposalId, msg.sender, votingPower[msg.sender]);
    }
    
    /**
     * @dev 执行提案
     * @param _proposalId 提案ID
     */
    function executeProposal(uint256 _proposalId) 
        external 
        onlyOwner
        proposalExists(_proposalId)
        votingEnded(_proposalId)
    {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.voteCount >= proposal.minVotes, "Insufficient votes");
        
        proposal.executed = true;
        emit ProposalExecuted(_proposalId);
    }
    
    /**
     * @dev 设置投票权重
     * @param _account 账户地址
     * @param _power 投票权重
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
     * @dev 获取提案信息
     * @param _proposalId 提案ID
     */
    function getProposal(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId)
        returns (
            string memory description,
            uint256 voteCount,
            uint256 deadline,
            bool executed,
            uint256 minVotes
        ) 
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.description, 
            proposal.voteCount, 
            proposal.deadline, 
            proposal.executed,
            proposal.minVotes
        );
    }
    
    /**
     * @dev 检查是否已投票
     * @param _proposalId 提案ID
     * @param _voter 投票者地址
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
     * @dev 获取当前提案总数
     */
    function getProposalCount() external view returns (uint256) {
        return _proposalIdCounter;
    }
    
    /**
     * @dev 检查提案是否可以执行
     * @param _proposalId 提案ID
     */
    function canExecute(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId)
        returns (bool) 
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            block.timestamp > proposal.deadline &&
            !proposal.executed &&
            proposal.voteCount >= proposal.minVotes
        );
    }
    
    /**
     * @dev 设置提案创建费用 - 仅owner可调用
     * @param _fee 新的费用金额
     */
    function setProposalCreationFee(uint256 _fee) external onlyOwner {
        proposalCreationFee = _fee;
    }
    
    /**
     * @dev 获取合约余额 - 仅owner可调用
     */
    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 提取合约费用 - 仅owner可调用
     */
    function withdrawFees() external onlyOwner {
        require(address(this).balance > 0, "No fees to withdraw");
        payable(owner()).transfer(address(this).balance);
    }
} 