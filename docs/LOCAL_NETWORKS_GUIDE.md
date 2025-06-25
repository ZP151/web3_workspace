# Local Development Networks Guide

This document provides instructions on how to set up and use the three main local development networks in this project: Anvil, Hardhat, and Ganache.

## Table of Contents
1. [Overview](#overview)
2. [Anvil (Recommended)](#anvil-recommended)
3. [Hardhat Built-in Network](#hardhat-built-in-network)
4. [Ganache](#ganache)
5. [Network Configuration Overview](#network-configuration-overview)
6. [Contract Deployment](#contract-deployment)

---

## Overview

Local development networks are servers that simulate the Ethereum blockchain on your computer. They allow you to quickly test, debug, and iterate before deploying smart contracts to public testnets or mainnet.

| Feature | Anvil | Hardhat | Ganache |
| :--- | :---: | :---: | :---: |
| **Recommended** | ✅ | | |
| **Speed** | Very Fast | Fast | Medium |
| **Persistence** | ✅ (File) | ❌ (Memory Only) | ✅ (Database) |
| **Chain ID** | `31338` | `31337` | `1337` |
| **Port** | `8546` | `8545` | `7545` |
| **Start Method**| Script | Script/Command | GUI / CLI |

---

## Anvil (Recommended)

Anvil is part of the [Foundry](https://getfoundry.sh/) toolkit. It's a high-performance local testnet node written in Rust with many advanced features such as state persistence and mainnet forking.

**This is the recommended local development environment for this project.**

### Starting Anvil

We provide a convenient script to manage Anvil instances.

*   **Start with Persistence** (Recommended):
    This mode saves blockchain state (transactions, contracts, etc.) to the `anvil-state.json` file. When you shut down and restart, all data will be restored.

    ```bash
    node scripts/start-networks.js anvil --persistent
    ```

*   **Load Existing Data** (if anvil-state.json file exists):
    When an `anvil-state.json` state file exists, using this command will automatically load the previously saved blockchain state, including all deployed contracts, account balances, and transaction history.

    ```bash
    node scripts/start-networks.js anvil --persistent
    ```

*   **Start a Fresh Instance** (without saving state):

    ```bash
    node scripts/start-networks.js anvil
    ```

*   **Force Start a Fresh Instance** (delete old persistent data):

    ```bash
    node scripts/start-networks.js anvil --persistent --fresh
    ```

### Stopping Anvil
Press `Ctrl + C` in the terminal window running Anvil to stop the service.

---

## Hardhat Built-in Network

Hardhat provides a built-in, memory-based local Ethereum network. It's great for running quick, one-off tests, but **does not** save state between restarts.

### Starting Hardhat Network

*   **Run as a standalone node**:
    This will start a Hardhat node in a separate terminal that you can connect your app or wallet to.

    ```bash
    npx hardhat node
    ```

*   **Start via script**:
    You can also use our provided script to start it.

    ```bash
    node scripts/start-networks.js hardhat
    ```

### Stopping Hardhat Network
Press `Ctrl + C` in the terminal window running the Hardhat node.

---

## Ganache

Ganache is part of the Truffle Suite and provides a personal blockchain with a graphical user interface (GUI). It's very useful for visually inspecting blocks, accounts, and transactions.

### Starting Ganache

1.  Download and install Ganache GUI from the [Truffle Suite website](https://trufflesuite.com/ganache/).
2.  Open the application.
3.  Click "QUICKSTART" or create a new workspace.
4.  Ganache will run on `http://127.0.0.1:7545` by default.

### Configuration

Make sure Ganache's network settings match the project configuration (`hardhat.config.js`):
*   **RPC Server**: `http://127.0.0.1:7545`
*   **Network ID (Chain ID)**: `1337`

---

## Network Configuration Overview

All network configurations are defined in the `hardhat.config.js` file.

| Network Name | Chain ID | RPC URL | Start Script/Command |
| :--- | :---: | :--- | :--- |
| **anvil** | `31338` | `http://127.0.0.1:8546` | `node scripts/start-networks.js anvil` |
| **hardhat**| `31337` | `http://127.0.0.1:8545` | `npx hardhat node` |
| **ganache**| `1337` | `http://127.0.0.1:7545` | Ganache GUI / CLI |

---

## Contract Deployment

We use a unified deployment script `deploy-master.js` to deploy all contracts and perform initialization.

To deploy contracts to a specific local network, use the `npx hardhat run` command with the `--network` flag.

*   **Deploy to Anvil**:

    ```bash
    npx hardhat run scripts/deploy-master.js --network anvil
    ```

*   **Deploy to Hardhat**:

    ```bash
    npx hardhat run scripts/deploy-master.js --network hardhat
    ```

*   **Deploy to Ganache**:

    ```bash
    npx hardhat run scripts/deploy-master.js --network ganache
    ```

After deployment is complete, the script will automatically update the `src/contracts/addresses.json` file so the frontend application can find the latest contract addresses.