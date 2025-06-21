# 投票组件库

这个目录包含了所有与投票功能相关的可复用组件。

## 📁 组件结构

### 核心组件
- **VotingStats.tsx** - 投票统计信息组件
- **CreateProposalForm.tsx** - 创建提案表单组件  
- **ProposalCard.tsx** - 提案卡片组件

### 工具和类型
- **useVotingContract.ts** - 投票相关的自定义Hook
- **types.ts** - TypeScript类型定义
- **index.ts** - 组件导出索引

## 🔧 组件功能

### VotingStats
显示投票系统的统计信息：
- 总提案数
- 总投票数  
- 投票费用
- 用户投票权重

### CreateProposalForm  
完整的提案创建表单：
- 提案标题和描述
- 投票类型选择（简单/多选/权重）
- 提案类别选择
- 投票时长和最少票数设置
- 多选题选项管理

### ProposalCard
单个提案的展示卡片：
- 提案信息展示
- 投票进度和状态
- 多选题选项投票
- 简单投票按钮

## 💡 使用示例

### 在页面中使用组件
```typescript
import { VotingStats, CreateProposalForm, ProposalCard } from '@/components/voting';

// 使用统计组件
<VotingStats stats={statsData} userVotingPower={powerData} />

// 使用创建表单
<CreateProposalForm
  show={showForm}
  onClose={() => setShowForm(false)}
  onSubmit={handleCreate}
  isCreating={loading}
/>

// 使用提案卡片
<ProposalCard
  proposal={proposalData}
  onVote={handleVote}
  isVoting={voting}
  isConnected={connected}
/>
```

### 使用自定义Hook
```typescript
import { useVotingContract, useCreateProposal } from '@/components/voting';

// 在组件中使用
const { isVoting, handleVote } = useVotingContract();
const { createProposal, isCreating } = useCreateProposal();
```

## 🎯 设计原则

1. **单一职责** - 每个组件只负责一个特定功能
2. **可复用性** - 组件可以在多个页面中使用
3. **类型安全** - 完整的TypeScript类型定义
4. **易于扩展** - 清晰的接口设计，便于添加新功能

## 📦 依赖

- React
- wagmi (用于Web3集成)
- viem (用于以太坊工具)
- UI组件库 (@/components/ui)

## 🔄 状态管理

组件使用本地状态管理，通过props传递数据和回调函数，保持组件的独立性和可测试性。 