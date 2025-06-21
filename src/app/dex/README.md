# DEX Platform 模块拆分结构

## 概述
原来的 1652 行大文件已被拆分为多个模块化组件，提高了代码的可维护性和可读性。

## 文件结构

```
src/app/dex/
├── page.tsx                    # 主页面入口 (重构后)
├── types.ts                    # 类型定义
├── README.md                   # 本文档
├── components/                 # 组件目录
│   ├── DEXNavigation.tsx      # 导航组件
│   ├── DEXInfoCard.tsx        # 信息卡片组件
│   ├── SwapTab.tsx            # 代币交换页面
│   ├── LiquidityTab.tsx       # 流动性添加页面
│   ├── PoolsTab.tsx           # 池子管理页面
│   ├── AnalyticsTab.tsx       # 分析统计页面
│   ├── OrdersTab.tsx          # 限价订单页面
│   └── MiningTab.tsx          # 流动性挖矿页面
├── hooks/                      # 自定义钩子
│   └── useDEXHooks.ts         # DEX相关钩子函数
└── utils/                      # 工具函数
    └── tokenUtils.ts          # 代币相关工具
```

## 组件说明

### 1. 主页面 (page.tsx)
- 负责整体布局和状态管理
- 协调各个子组件
- 处理钱包连接状态

### 2. 类型定义 (types.ts)
- `LiquidityPool`: 流动性池接口
- `SwapData`: 交换数据接口
- `LimitOrderData`: 限价订单接口
- `UserOrder`: 用户订单接口
- `MiningData`: 挖矿数据接口
- `TokenAddresses`: 代币地址接口

### 3. 组件模块

#### DEXNavigation
- 顶部导航栏
- 标签页切换

#### DEXInfoCard
- 用户基本信息展示
- 钱包地址、网络信息
- 流动性统计

#### SwapTab
- 代币交换功能
- 价格计算
- 滑点设置
- 授权检查

#### LiquidityTab
- 添加流动性
- APY估算
- 池子份额计算

#### PoolsTab
- 流动性池列表
- 池子统计信息
- 添加/移除流动性操作

#### AnalyticsTab
- DEX统计数据
- TVL、交易量等指标
- 图表预留位置

#### OrdersTab
- 限价订单创建
- 订单管理
- 取消订单功能

#### MiningTab
- 流动性挖矿
- 奖励领取
- 挖矿规则说明

### 4. 钩子函数 (hooks/useDEXHooks.ts)

#### useDEXContract
- 合约地址和ABI获取
- 代币地址配置
- 池ID计算

#### useSwapLogic
- 交换逻辑处理
- 输出金额计算
- 交换执行

#### useLimitOrders
- 限价订单管理
- 订单创建和取消

#### useMining
- 流动性挖矿逻辑
- 奖励领取

### 5. 工具函数 (utils/tokenUtils.ts)

#### getTokenAddresses
- 动态获取代币地址配置

#### erc20ABI
- ERC20 标准 ABI 定义

## 优势

1. **模块化**: 每个功能独立成组件，便于维护
2. **可复用**: 组件可在其他地方复用
3. **类型安全**: 完整的 TypeScript 类型定义
4. **逻辑分离**: 钩子函数分离业务逻辑
5. **易于测试**: 小模块便于单元测试
6. **团队协作**: 不同开发者可并行开发不同组件

## 使用方式

```tsx
// 在其他地方使用单个组件
import SwapTab from '@/app/dex/components/SwapTab';

// 使用钩子函数
import { useSwapLogic } from '@/app/dex/hooks/useDEXHooks';

// 使用类型定义
import { LiquidityPool } from '@/app/dex/types';
```

## 扩展性

新增功能时，只需：
1. 在 `components/` 下创建新组件
2. 在 `types.ts` 中添加类型定义
3. 在主页面中引入和使用
4. 如需要，在 `hooks/` 中添加业务逻辑

这种结构使得代码更加清晰、可维护，并且便于后续功能扩展。 