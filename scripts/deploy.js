const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function updateAddressesConfig(deployedContracts, networkName, chainId) {
  const addressesPath = path.join(__dirname, "../src/contracts/addresses.json");
  
  try {
    // 读取现有配置，如果不存在则创建空对象
    let addresses = {};
    if (fs.existsSync(addressesPath)) {
      const addressesData = fs.readFileSync(addressesPath, "utf8");
      addresses = JSON.parse(addressesData);
    }

    // 更新指定网络的地址
    addresses[chainId.toString()] = {
      ...deployedContracts,
      network: networkName,
      deployedAt: new Date().toISOString()
    };

    // 写入配置文件
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log(`✅ 配置文件已更新: ${addressesPath}`);
    console.log(`📍 网络: ${networkName} (Chain ID: ${chainId})`);
    
  } catch (error) {
    console.error("❌ 更新配置文件失败:", error.message);
  }
}

async function updateContractsConfig(deployedContracts, chainId) {
  const contractsPath = path.join(__dirname, "../src/config/contracts.ts");
  
  try {
    // 读取现有配置文件
    let configContent = fs.readFileSync(contractsPath, "utf8");
    
    // 构建新的地址配置
    const newAddresses = Object.entries(deployedContracts)
      .map(([name, address]) => `    ${name}: '${address}',`)
      .join('\n');
    
    // 替换指定网络的配置
    const chainIdPattern = new RegExp(`(\\s*${chainId}:\\s*{[^}]*)(})`);
    const replacement = `  ${chainId}: {\n${newAddresses}\n  },`;
    
    if (configContent.match(chainIdPattern)) {
      configContent = configContent.replace(chainIdPattern, replacement);
    } else {
      // 如果网络配置不存在，添加新的配置
      const addressesPattern = /(export const CONTRACT_ADDRESSES = {[^}]*)(} as const;)/;
      const newConfig = `${replacement}\n  $2`;
      configContent = configContent.replace(addressesPattern, `$1  ${newConfig}`);
    }
    
    fs.writeFileSync(contractsPath, configContent);
    console.log(`✅ contracts.ts 配置已更新`);
    
  } catch (error) {
    console.error("❌ 更新 contracts.ts 失败:", error.message);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const networkName = getNetworkName(chainId);
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);

  // 合约地址存储
  const deployedContracts = {};

  try {
    // 1. 部署 VotingCore 合约
    console.log("\n=== 部署 VotingCore 合约 ===");
    const VotingCore = await ethers.getContractFactory("VotingCore");
    const votingCore = await VotingCore.deploy();
    await votingCore.waitForDeployment();
    const votingCoreAddress = await votingCore.getAddress();
    deployedContracts.VotingCore = votingCoreAddress;
    console.log("VotingCore 合约地址:", votingCoreAddress);

    // 2. 部署 SimpleBank 合约
    console.log("\n=== 部署 SimpleBank 合约 ===");
    const SimpleBank = await ethers.getContractFactory("SimpleBank");
    const simpleBank = await SimpleBank.deploy();
    await simpleBank.waitForDeployment();
    const simpleBankAddress = await simpleBank.getAddress();
    deployedContracts.SimpleBank = simpleBankAddress;
    console.log("SimpleBank 合约地址:", simpleBankAddress);

    // 3. 部署 TokenFactory 合约
    console.log("\n=== 部署 TokenFactory 合约 ===");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(deployer.address); // 使用部署者作为费用接收地址
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    deployedContracts.TokenFactory = tokenFactoryAddress;
    console.log("TokenFactory 合约地址:", tokenFactoryAddress);

    // 4. 部署 PlatformNFT 合约
    console.log("\n=== 部署 PlatformNFT 合约 ===");
    const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
    const platformNFT = await PlatformNFT.deploy();
    await platformNFT.waitForDeployment();
    const platformNFTAddress = await platformNFT.getAddress();
    deployedContracts.PlatformNFT = platformNFTAddress;
    console.log("PlatformNFT 合约地址:", platformNFTAddress);

    // 5. 部署 NFTMarketplace 合约
    console.log("\n=== 部署 NFTMarketplace 合约 ===");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy(platformNFTAddress, deployer.address);
    await nftMarketplace.waitForDeployment();
    const nftMarketplaceAddress = await nftMarketplace.getAddress();
    deployedContracts.NFTMarketplace = nftMarketplaceAddress;
    console.log("NFTMarketplace 合约地址:", nftMarketplaceAddress);

    // 6. 部署 DEXPlatform 合约
    console.log("\n=== 部署 DEXPlatform 合约 ===");
    const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
    const dexPlatform = await DEXPlatform.deploy(deployer.address); // 使用部署者作为费用接收地址
    await dexPlatform.waitForDeployment();
    const dexPlatformAddress = await dexPlatform.getAddress();
    deployedContracts.DEXPlatform = dexPlatformAddress;
    console.log("DEXPlatform 合约地址:", dexPlatformAddress);

    // 输出所有合约地址汇总
    console.log("\n" + "=".repeat(50));
    console.log("🎉 所有合约部署完成！");
    console.log("=".repeat(50));
    
    console.log("\n📋 合约地址汇总:");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });

    // 自动更新配置文件
    console.log("\n📝 自动更新配置文件...");
    await updateAddressesConfig(deployedContracts, networkName, chainId);
    await updateContractsConfig(deployedContracts, chainId);

    // 生成环境变量配置
    console.log("\n📝 环境变量配置 (.env.local):");
    console.log(`NEXT_PUBLIC_VOTING_CORE_ADDRESS=${deployedContracts.VotingCore}`);
    console.log(`NEXT_PUBLIC_SIMPLE_BANK_ADDRESS=${deployedContracts.SimpleBank}`);
    console.log(`NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=${deployedContracts.TokenFactory}`);
    console.log(`NEXT_PUBLIC_PLATFORM_NFT_ADDRESS=${deployedContracts.PlatformNFT}`);
    console.log(`NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS=${deployedContracts.NFTMarketplace}`);
    console.log(`NEXT_PUBLIC_DEX_PLATFORM_ADDRESS=${deployedContracts.DEXPlatform}`);

    // 验证部署的合约
    console.log("\n🔍 验证合约部署状态:");
    for (const [name, address] of Object.entries(deployedContracts)) {
      const code = await ethers.provider.getCode(address);
      if (code === "0x") {
        console.log(`❌ ${name}: 部署失败`);
      } else {
        console.log(`✅ ${name}: 部署成功`);
      }
    }

    // 设置初始配置（可选）
    console.log("\n⚙️ 设置初始配置...");
    
    // 创建示例投票提案（需要支付费用）
    try {
      const createProposalTx = await votingCore.createProposal(
        "平台治理改进提案 - 降低交易费用",
        24, // 24小时投票期
        10, // 最少需要10票
        { value: ethers.parseEther("0.001") } // 支付创建费用
      );
      await createProposalTx.wait();
      console.log("✅ 示例投票提案创建成功");
    } catch (error) {
      console.log("⚠️ 创建示例投票提案失败:", error.message);
    }

    // 在银行合约中存入一些初始资金
    try {
      const depositTx = await simpleBank.deposit({ value: ethers.parseEther("1.0") });
      await depositTx.wait();
      console.log("✅ 银行合约初始存款成功 (1 ETH)");
    } catch (error) {
      console.log("⚠️ 银行合约初始存款失败:", error.message);
    }

  } catch (error) {
    console.error("❌ 部署过程中发生错误:", error);
    throw error;
  }

  console.log("\n🚀 智能合约平台部署完成！");
  console.log("现在可以启动前端应用：npm run dev");
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 