# 本地开发网络指南

本文档提供有关如何在此项目中设置和使用三个主要本地开发网络的说明：Anvil、Hardhat 和 Ganache。

## 目录
1.  [概述](#概述)
2.  [Anvil (推荐)](#anvil-推荐)
3.  [Hardhat 内置网络](#hardhat-内置网络)
4.  [Ganache](#ganache)
5.  [网络配置一览](#网络配置一览)
6.  [部署合约](#部署合约)

---

## 概述

本地开发网络是在您的计算机上模拟以太坊区块链的服务器。它们允许您在将智能合约部署到公共测试网或主网之前，快速地进行测试、调试和迭代。

| 特性 | Anvil | Hardhat | Ganache |
| :--- | :---: | :---: | :---: |
| **推荐** | ✅ | | |
| **速度** | 非常快 | 快 | 中等 |
| **持久化** | ✅ (文件) | ❌ (仅内存) | ✅ (数据库) |
| **Chain ID** | `31338` | `31337` | `1337` |
| **端口** | `8546` | `8545` | `7545` |
| **启动方式**| 脚本 | 脚本/命令 | GUI / CLI |

---

## Anvil (推荐)

Anvil 是 [Foundry](https://getfoundry.sh/) 工具包的一部分。它是一个用 Rust 编写的高性能本地测试网节点，具有许多高级功能，例如状态持久化和主网分叉。

**这是本项目推荐的本地开发环境。**

### 启动 Anvil

我们提供了一个方便的脚本来管理 Anvil 实例。

*   **启动并开启持久化** (推荐):
    此模式会将区块链状态（交易、合约等）保存到 `anvil-state.json` 文件中。关闭并重新启动后，所有数据都将恢复。

    ```bash
    node scripts/start-networks.js anvil --persistent
    ```

*   **重载现有数据** (如果已有 anvil-state.json 文件):
    当存在 `anvil-state.json` 状态文件时，使用此命令会自动加载之前保存的区块链状态，包括所有已部署的合约、账户余额和交易历史。

    ```bash
    node scripts/start-networks.js anvil --persistent
    ```

*   **启动一个全新的实例** (不保存状态):

    ```bash
    node scripts/start-networks.js anvil
    ```

*   **强制启动一个全新的实例** (删除旧的持久化数据):

    ```bash
    node scripts/start-networks.js anvil --persistent --fresh
    ```

### 停止 Anvil
在运行 Anvil 的终端窗口中，按 `Ctrl + C` 即可停止服务。

---

## Hardhat 内置网络

Hardhat 提供一个内置的、基于内存的本地以太坊网络。它非常适合运行快速、一次性的测试，但**不会**在重启之间保存状态。

### 启动 Hardhat 网络

*   **作为独立节点运行**:
    这将在一个单独的终端中启动 Hardhat 节点，您可以将应用或钱包连接到它。

    ```bash
    npx hardhat node
    ```

*   **通过脚本启动**:
    您也可以使用我们提供的脚本来启动它。

    ```bash
    node scripts/start-networks.js hardhat
    ```

### 停止 Hardhat 网络
在运行 Hardhat 节点的终端窗口中，按 `Ctrl + C`。

---

## Ganache

Ganache 是 Truffle Suite 的一部分，提供一个带有图形用户界面（GUI）的个人区块链。它对于可视化地检查区块、账户和交易非常有用。

### 启动 Ganache

1.  从 [Truffle Suite 官网](https://trufflesuite.com/ganache/) 下载并安装 Ganache GUI。
2.  打开应用。
3.  点击 "QUICKSTART" 或创建一个新的工作区。
4.  Ganache 将默认在 `http://127.0.0.1:7545` 上运行。

### 配置

请确保 Ganache 的网络设置与项目配置 (`hardhat.config.js`) 匹配：
*   **RPC Server**: `http://127.0.0.1:7545`
*   **Network ID (Chain ID)**: `1337`

---

## 网络配置一览

所有网络配置都定义在 `hardhat.config.js` 文件中。

| 网络名称 | Chain ID | RPC URL | 启动脚本/命令 |
| :--- | :---: | :--- | :--- |
| **anvil** | `31338` | `http://127.0.0.1:8546` | `node scripts/start-networks.js anvil` |
| **hardhat**| `31337` | `http://127.0.0.1:8545` | `npx hardhat node` |
| **ganache**| `1337` | `http://127.0.0.1:7545` | Ganache GUI / CLI |

---

## 部署合约

我们使用一个统一的部署脚本 `deploy-master.js` 来部署所有合约并进行初始化。

要将合约部署到特定的本地网络，请使用 `npx hardhat run` 命令并附带 `--network` 标志。

*   **部署到 Anvil**:

    ```bash
    npx hardhat run scripts/deploy-master.js --network anvil
    ```

*   **部署到 Hardhat**:

    ```bash
    npx hardhat run scripts/deploy-master.js --network hardhat
    ```

*   **部署到 Ganache**:

    ```bash
    npx hardhat run scripts/deploy-master.js --network ganache
    ```

部署完成后，脚本会自动更新 `src/contracts/addresses.json` 文件，以便前端应用可以找到最新的合约地址。