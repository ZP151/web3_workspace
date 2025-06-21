import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Proposal {
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

interface ProposalCardProps {
  proposal: Proposal;
  onVote: (proposalId: number, optionId?: number, voteWeight?: number) => void;
  isVoting: boolean;
  isConnected: boolean;
  userVotingPower?: number;
}

const ProposalTypeLabels = ['Simple Vote', 'Multiple Choice', 'Weighted Vote'];
const ProposalCategoryLabels = ['Governance', 'Finance', 'Technical', 'Community'];

export default function ProposalCard({ proposal, onVote, isVoting, isConnected, userVotingPower = 1 }: ProposalCardProps) {
  const [voteWeight, setVoteWeight] = useState<number>(1);
  const [selectedWeightedOption, setSelectedWeightedOption] = useState<number>(0);
  
  // 设置最大投票权重为用户的实际投票权重
  const maxVotingPower = Math.max(userVotingPower, 1);
  
  const formatTimeRemaining = (deadline: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const isExpired = Math.floor(Date.now() / 1000) > proposal.deadline;
  const canVote = isConnected && !isVoting && !isExpired && !proposal.executed && !proposal.hasVoted;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{proposal.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">
                {ProposalTypeLabels[proposal.proposalType]}
              </Badge>
              <Badge variant="outline">
                {ProposalCategoryLabels[proposal.category]}
              </Badge>
              <Badge variant={
                isExpired ? "destructive" : 
                proposal.executed ? "default" : "secondary"
              }>
                {proposal.executed ? 'Executed' : 
                 isExpired ? 'Ended' : 'Active'}
              </Badge>
              {proposal.hasVoted && (
                <Badge variant="default">Voted</Badge>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Remaining: {formatTimeRemaining(proposal.deadline)}</div>
            <div>Creator: {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{proposal.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-blue-600">{proposal.voteCount}</div>
            <div className="text-sm text-gray-500">Current Votes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{proposal.minVotes}</div>
            <div className="text-sm text-gray-500">Required Votes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((proposal.voteCount / Math.max(proposal.minVotes, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-500">Progress</div>
          </div>
        </div>

        {/* Multiple choice options */}
        {proposal.proposalType === 1 && proposal.options && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Voting Options:</h4>
            <div className="space-y-2">
              {proposal.options.map((option, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{option}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {proposal.optionVotes?.[index] || 0} votes
                    </span>
                    <Button
                      size="sm"
                      onClick={() => onVote(proposal.id, index)}
                      disabled={!canVote}
                    >
                      Vote
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weighted vote options */}
        {proposal.proposalType === 2 && (
          <div className="mb-4">
            <h4 className="font-medium mb-3">权重投票</h4>
            
            {/* 投票选项 */}
            {proposal.options && proposal.options.length > 0 ? (
              <div className="space-y-3 mb-4">
                <div className="text-sm font-medium text-gray-700">选择投票选项:</div>
                {proposal.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="radio"
                      id={`weighted-option-${proposal.id}-${index}`}
                      name={`weighted-option-${proposal.id}`}
                      checked={selectedWeightedOption === index}
                      onChange={() => setSelectedWeightedOption(index)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label 
                      htmlFor={`weighted-option-${proposal.id}-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </label>
                    <span className="text-sm text-gray-500">
                      {proposal.optionVotes?.[index] || 0} votes
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">投票选项:</div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={`weighted-support-${proposal.id}`}
                    name={`weighted-option-${proposal.id}`}
                    checked={selectedWeightedOption === 0}
                    onChange={() => setSelectedWeightedOption(0)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`weighted-support-${proposal.id}`} className="cursor-pointer">
                    支持 (Support)
                  </label>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="radio"
                    id={`weighted-against-${proposal.id}`}
                    name={`weighted-option-${proposal.id}`}
                    checked={selectedWeightedOption === 1}
                    onChange={() => setSelectedWeightedOption(1)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`weighted-against-${proposal.id}`} className="cursor-pointer">
                    反对 (Against)
                  </label>
                </div>
              </div>
            )}
            
            {/* 投票权重设置 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                投票权重 (1-{maxVotingPower})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max={maxVotingPower}
                  value={Math.min(voteWeight, maxVotingPower)}
                  onChange={(e) => setVoteWeight(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="min-w-[60px] px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium text-center">
                  {Math.min(voteWeight, maxVotingPower)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                权重越高，投票影响力越大。消耗的投票费用也越高。您的最大投票权重: {maxVotingPower}
              </div>
            </div>
            
            {/* 投票按钮 */}
            <Button
              onClick={() => onVote(proposal.id, selectedWeightedOption, Math.min(voteWeight, maxVotingPower))}
              disabled={!canVote}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isVoting ? '投票中...' : `权重投票 (权重: ${Math.min(voteWeight, maxVotingPower)})`}
            </Button>
          </div>
        )}

        {/* Simple vote button */}
        {proposal.proposalType === 0 && (
          <div className="flex gap-2">
            <Button
              onClick={() => onVote(proposal.id, 0)}
              disabled={!canVote}
              className="bg-green-600 hover:bg-green-700"
            >
              {isVoting ? 'Voting...' : 'Vote'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 