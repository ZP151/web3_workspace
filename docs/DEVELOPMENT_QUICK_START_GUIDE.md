# Development Quick Start Guide

This guide provides a straightforward workflow for setting up and running the local development environment.

## 🚀 Recommended Workflow (Fresh Start)

This is the recommended approach for most development tasks. It ensures a clean slate, preventing issues with outdated data or contract addresses. You will need **three separate terminal windows**.

### 1. Terminal 1: Start the Blockchain Network

First, start a fresh Anvil local network. This provides a clean blockchain for development.

```bash
# Start a fresh, clean Anvil network
node scripts/start-networks.js anvil --fresh
```
Keep this terminal window open. It will display the blockchain activity.

### 2. Terminal 2: Deploy Smart Contracts

Once the network is running, deploy the smart contracts to it. This step also populates the network with initial sample data.

```bash
# Deploy all contracts and sample data
npx hardhat run scripts/deploy-master.js --network anvil
```
This command only needs to be run once after starting the network. It updates the `src/contracts/addresses.json` file, which the frontend uses to connect to the contracts.

### 3. Terminal 3: Start the Frontend Application

Finally, start the Next.js frontend development server.

```bash
# Install dependencies if you haven't already
npm install

# Start the frontend
npm run dev
```
You can now open your browser to `http://localhost:3000` to interact with the application.

---

## 🔄 Resuming Development with Persistent Data

If you previously stopped a persistent Anvil session and want to continue with the saved data, use this workflow.

### 1. Terminal 1: Start Persistent Network

Start the Anvil network using the `--persistent` flag. This will load the state from your last session from `anvil-state.json`.

```bash
# Start Anvil and load the last saved state
node scripts/start-networks.js anvil --persistent
```

### 2. Terminal 2: Start the Frontend Application

With the blockchain running with its previous data, you can start the frontend.

```bash
# Start the frontend
npm run dev
```

### ⚠️ Troubleshooting Persistent Mode

If the frontend shows empty data or behaves unexpectedly, you might have a **contract address mismatch**. This happens if the contract addresses in `src/contracts/addresses.json` don't match the ones saved in `anvil-state.json`.

**To fix this:**

1.  **Use the address checker tool** to verify:
    ```bash
    node scripts/anvil-network-debug/persistence-test-suite/check-contract-addresses.js
    ```

2.  **If a mismatch is found, use the fix tool**:
    ```bash
    # Option A: Redeploy to the running persistent network (preserves data)
    node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --redeploy

    # Option B: Start fresh (easiest, but erases old data)
    node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --fresh
    ```

For more details, see the [Anvil Persistence Test Suite Guide](../scripts/anvil-network-debug/persistence-test-suite/README.md).

## 🖥️ Terminal Window Summary

| Terminal 1 | Terminal 2 | Terminal 3 |
| :--- | :--- | :--- |
| **Blockchain** | **Contract Deployment** | **Frontend App** |
| `node scripts/start-networks.js ...` | `npx hardhat run ...` | `npm run dev` |
| (Keep running) | (Run once per deployment) | (Keep running) | 