export interface Proposal {
  id: number;
  title: string;
  description: string;
  voteCount: number;
  deadline: number;
  executed: boolean;
  minVotes: number;
  proposalType: number;
  category: number;
  creator: string;
  createdAt: number;
  options?: string[];
  optionVotes?: number[];
  hasVoted?: boolean;
}

export interface FormData {
  title: string;
  description: string;
  duration: string;
  minVotes: string;
  proposalType: number;
  category: number;
  options: string[];
}

export interface VotingStats {
  totalProposals: bigint;
  totalVotes: bigint;
  totalVotingPower: bigint;
  currentVotingFee: bigint;
  currentProposalFee: bigint;
}

export const ProposalTypeLabels = ['Simple Vote', 'Multiple Choice', 'Weighted Vote'];
export const ProposalCategoryLabels = ['Governance', 'Finance', 'Technical', 'Community'];

export const VOTING_CORE_ABI = [
  'function createProposal(string title, string description, uint256 durationHours, uint256 minVotes, uint8 proposalType, uint8 category, string[] options) external payable returns (uint256)',
  'function vote(uint256 proposalId, uint256 optionId) external payable',
  'function getProposal(uint256 proposalId) external view returns (string title, string description, uint256 voteCount, uint256 deadline, bool executed, uint256 minVotes, uint8 proposalType, uint8 category, address creator, uint256 createdAt)',
  'function getProposalOptions(uint256 proposalId) external view returns (string[] options, uint256[] optionVotes)',
  'function hasVoted(uint256 proposalId, address voter) external view returns (bool)',
  'function getProposalCount() external view returns (uint256)',
  'function getStats() external view returns (uint256 totalProposals, uint256 totalVotes, uint256 totalVotingPower, uint256 currentVotingFee, uint256 currentProposalFee)',
  'function votingPower(address account) external view returns (uint256)',
  'function executeProposal(uint256 proposalId) external'
]; 