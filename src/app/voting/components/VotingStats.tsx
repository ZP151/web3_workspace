import { Card, CardContent } from '@/components/ui/card';
import { formatEther } from 'viem';

interface VotingStatsProps {
  stats: readonly [bigint, bigint, bigint, bigint, bigint] | undefined;
  userVotingPower: bigint | undefined;
}

export default function VotingStats({ stats, userVotingPower }: VotingStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold text-blue-600">{stats[0]?.toString() || '0'}</div>
          <p className="text-sm text-gray-500">Total Proposals</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold text-green-600">{stats[1]?.toString() || '0'}</div>
          <p className="text-sm text-gray-500">Total Votes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold text-purple-600">
            {formatEther(stats[3] || BigInt(0))} ETH
          </div>
          <p className="text-sm text-gray-500">Voting Fee</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-2xl font-bold text-orange-600">
            {userVotingPower ? userVotingPower.toString() : '0'}
          </div>
          <p className="text-sm text-gray-500">My Voting Power</p>
        </CardContent>
      </Card>
    </div>
  );
} 