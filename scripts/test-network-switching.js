const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function testNetworkSwitching() {
  console.log("🧪 测试网络切换和合约功能");
  console.log("=".repeat(50));

  // 读取合约地址配置
  const addressesPath = path.join(__dirname, "../src/contracts/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // 获取当前网络信息
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log(`\n📡 当前连接网络: Chain ID ${chainId}`);
  console.log(`📍 网络名称: ${getNetworkName(chainId)}`);

  // 获取当前网络的合约地址
  const networkAddresses = addresses[chainId.toString()];
  if (!networkAddresses) {
    console.log(`❌ 未找到 Chain ID ${chainId} 的合约地址配置`);
    return;
  }

  console.log(`\n📋 ${networkAddresses.network} 合约地址:`);
  Object.entries(networkAddresses).forEach(([name, address]) => {
    if (name !== 'network' && name !== 'deployedAt') {
      console.log(`  ${name}: ${address || '未部署'}`);
    }
  });

  // 测试VotingCore合约
  if (networkAddresses.VotingCore) {
    console.log(`\n🗳️  测试 VotingCore 合约...`);
    try {
      const VotingCore = await ethers.getContractFactory("VotingCore");
      const votingContract = VotingCore.attach(networkAddresses.VotingCore);
      
      // 检查合约基本信息
      const proposalCount = await votingContract.getProposalCount();
      console.log(`  ✅ Proposal 总数: ${proposalCount}`);

      // 检查创建费用
      const creationFee = await votingContract.proposalCreationFee();
      console.log(`  ✅ 创建费用: ${ethers.formatEther(creationFee)} ETH`);

      // 如果有提案，获取第一个提案信息
      if (proposalCount > 0) {
        const proposal = await votingContract.getProposal(0);
        console.log(`  ✅ 提案 #0: "${proposal.description}"`);
        console.log(`    截止时间: ${new Date(Number(proposal.deadline) * 1000).toLocaleString()}`);
        console.log(`    赞成票: ${proposal.voteCount}`);
        console.log(`    已执行: ${proposal.executed ? '是' : '否'}`);
      }

    } catch (error) {
      console.log(`  ❌ VotingCore 测试失败: ${error.message}`);
    }
  }

  // 测试SimpleBank合约
  if (networkAddresses.SimpleBank) {
    console.log(`\n🏦 测试 SimpleBank 合约...`);
    try {
      const SimpleBank = await ethers.getContractFactory("SimpleBank");
      const bankContract = SimpleBank.attach(networkAddresses.SimpleBank);
      
      // 获取第一个账户信息
      const [deployer] = await ethers.getSigners();
      const balance = await bankContract.balances(deployer.address);
      console.log(`  ✅ 账户余额: ${ethers.formatEther(balance)} ETH`);

      // 获取总存款
      const totalDeposits = await bankContract.totalDeposited();
      console.log(`  ✅ 总存款: ${ethers.formatEther(totalDeposits)} ETH`);

    } catch (error) {
      console.log(`  ❌ SimpleBank 测试失败: ${error.message}`);
    }
  }

  // 测试TokenFactory合约
  if (networkAddresses.TokenFactory) {
    console.log(`\n🏭 测试 TokenFactory 合约...`);
    try {
      const TokenFactory = await ethers.getContractFactory("TokenFactory");
      const factoryContract = TokenFactory.attach(networkAddresses.TokenFactory);
      
      // 检查创建费用
      const creationFee = await factoryContract.creationFee();
      console.log(`  ✅ Token创建费用: ${ethers.formatEther(creationFee)} ETH`);

      // 获取已创建的代币数量
      const tokenCount = await factoryContract.getTokenCount();
      console.log(`  ✅ 已创建代币数量: ${tokenCount}`);

    } catch (error) {
      console.log(`  ❌ TokenFactory 测试失败: ${error.message}`);
    }
  }

  console.log(`\n✅ ${networkAddresses.network} 网络测试完成！`);
}

function getNetworkName(chainId) {
  switch (chainId) {
    case 31337:
      return "Hardhat Local";
    case 1337:
      return "Ganache Local";
    case 1:
      return "Ethereum Mainnet";
    case 11155111:
      return "Sepolia Testnet";
    case 80001:
      return "Mumbai Testnet";
    case 137:
      return "Polygon Mainnet";
    default:
      return `Unknown Network (${chainId})`;
  }
}

// 执行测试
testNetworkSwitching()
  .then(() => {
    console.log("\n🎉 网络切换测试完成!");
  })
  .catch((error) => {
    console.error("❌ 测试失败:", error);
  }); 