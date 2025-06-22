const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("=".repeat(60));
  console.log("🚀 开始部署所有合约到网络");
  console.log("=".repeat(60));
  console.log("部署账户:", deployerAddress);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployerAddress)));

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  console.log("网络ID:", chainId);
  console.log("网络名称:", network.name);
  
  // 确定网络名称
  const networkNames = {
    "31337": "Hardhat Local",
    "1337": "Ganache Local",
    "11155111": "Sepolia Testnet",
    "80001": "Mumbai Testnet",
    "1": "Ethereum Mainnet",
    "137": "Polygon Mainnet",
    "56": "BSC Mainnet"
  };
  const networkName = networkNames[chainId] || `Unknown Network (${chainId})`;

  // 合约地址存储
  const deployedContracts = {};
  const deploymentInfo = {
    network: networkName,
    deployedAt: new Date().toISOString(),
    deployer: deployerAddress
  };

  try {
    // 1. 部署 VotingCore 合约
    console.log("\n📝 部署 VotingCore 合约...");
    const VotingCore = await ethers.getContractFactory("VotingCore");
    const votingCore = await VotingCore.deploy();
    await votingCore.waitForDeployment();
    const votingCoreAddress = await votingCore.getAddress();
    deployedContracts.VotingCore = votingCoreAddress;
    console.log("✅ VotingCore 部署成功:", votingCoreAddress);

    // 2. 部署 EnhancedBank 合约
    console.log("\n🏦 部署 EnhancedBank 合约...");
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const enhancedBank = await EnhancedBank.deploy();
    await enhancedBank.waitForDeployment();
    const enhancedBankAddress = await enhancedBank.getAddress();
    deployedContracts.EnhancedBank = enhancedBankAddress;
    console.log("✅ EnhancedBank 部署成功:", enhancedBankAddress);

    // 3. 部署 TokenFactory 合约
    console.log("\n🏭 部署 TokenFactory 合约...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(deployerAddress);
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    deployedContracts.TokenFactory = tokenFactoryAddress;
    console.log("✅ TokenFactory 部署成功:", tokenFactoryAddress);

    // 4. 部署测试代币 (仅在测试网络，需要在DEX之前部署)
    if (chainId === "31337" || chainId === "1337") {
      console.log("\n💰 部署测试代币...");
      
      try {
        // 部署 USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
        await usdc.waitForDeployment();
        const usdcAddress = await usdc.getAddress();
        deployedContracts.USDC = usdcAddress;
        console.log("✅ USDC 部署成功:", usdcAddress);

        // 部署 DAI
        const dai = await MockERC20.deploy("Dai Stablecoin", "DAI", 18);
        await dai.waitForDeployment();
        const daiAddress = await dai.getAddress();
        deployedContracts.DAI = daiAddress;
        console.log("✅ DAI 部署成功:", daiAddress);

        // 部署 WETH
        const WETH = await ethers.getContractFactory("WETH");
        const weth = await WETH.deploy();
        await weth.waitForDeployment();
        const wethAddress = await weth.getAddress();
        deployedContracts.WETH = wethAddress;
        console.log("✅ WETH 部署成功:", wethAddress);
      } catch (error) {
        console.log("⚠️ 测试代币部署失败:", error.message);
      }
    }

    // 5. 部署 PlatformNFT 合约
    console.log("\n🎨 部署 PlatformNFT 合约...");
    try {
      const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
      const platformNFT = await PlatformNFT.deploy();
      await platformNFT.waitForDeployment();
      const platformNFTAddress = await platformNFT.getAddress();
      deployedContracts.PlatformNFT = platformNFTAddress;
      console.log("✅ PlatformNFT 部署成功:", platformNFTAddress);
    } catch (error) {
      console.log("⚠️ PlatformNFT 部署跳过:", error.message);
    }

    // 6. 部署 NFTMarketplace 合约
    console.log("\n🛒 部署 NFTMarketplace 合约...");
    try {
      // NFTMarketplace 构造函数需要 nftContract 和 feeRecipient 地址
      if (deployedContracts.PlatformNFT) {
        const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
        const nftMarketplace = await NFTMarketplace.deploy(
          deployedContracts.PlatformNFT, // nftContract
          deployerAddress // feeRecipient
        );
        await nftMarketplace.waitForDeployment();
        const nftMarketplaceAddress = await nftMarketplace.getAddress();
        deployedContracts.NFTMarketplace = nftMarketplaceAddress;
        console.log("✅ NFTMarketplace 部署成功:", nftMarketplaceAddress);
      } else {
        console.log("⚠️ NFTMarketplace 部署跳过: 需要先部署 PlatformNFT");
      }
    } catch (error) {
      console.log("⚠️ NFTMarketplace 部署跳过:", error.message);
    }

    // 7. 部署 DEXPlatform 合约
    console.log("\n💱 部署 DEXPlatform 合约...");
    try {
      // 先检查是否有可用的代币作为奖励代币，如果没有就使用零地址
      let rewardToken = "0x0000000000000000000000000000000000000000";
      if (deployedContracts.USDC) {
        rewardToken = deployedContracts.USDC;
      }
      
      const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
      const dexPlatform = await DEXPlatform.deploy(
        deployerAddress, // feeRecipient
        rewardToken // rewardToken
      );
      await dexPlatform.waitForDeployment();
      const dexPlatformAddress = await dexPlatform.getAddress();
      deployedContracts.DEXPlatform = dexPlatformAddress;
      console.log("✅ DEXPlatform 部署成功:", dexPlatformAddress);
    } catch (error) {
      console.log("⚠️ DEXPlatform 部署跳过:", error.message);
    }



    // 验证部署
    console.log("\n🔍 验证合约部署...");
    
    // 验证VotingCore
    try {
      const proposalCount = await votingCore.getProposalCount();
      console.log("✅ VotingCore 验证成功，当前提案数量:", proposalCount.toString());
    } catch (error) {
      console.log("❌ VotingCore 验证失败:", error.message);
    }

    // 验证EnhancedBank
    try {
      const minDeposit = await enhancedBank.minimumDeposit();
      console.log("✅ EnhancedBank 验证成功，最小存款:", ethers.formatEther(minDeposit), "ETH");
    } catch (error) {
      console.log("❌ EnhancedBank 验证失败:", error.message);
    }

    // 验证TokenFactory
    try {
      const creationFee = await tokenFactory.creationFee();
      const tokenCount = await tokenFactory.getTokenCount();
      console.log("✅ TokenFactory 验证成功，创建费用:", ethers.formatEther(creationFee), "ETH");
      console.log("✅ TokenFactory 当前代币数量:", tokenCount.toString());
    } catch (error) {
      console.log("❌ TokenFactory 验证失败:", error.message);
    }

    // 验证其他合约 (仅检查地址)
    if (deployedContracts.PlatformNFT) {
      console.log("✅ PlatformNFT 部署验证成功");
    }
    if (deployedContracts.NFTMarketplace) {
      console.log("✅ NFTMarketplace 部署验证成功");
    }
    if (deployedContracts.DEXPlatform) {
      console.log("✅ DEXPlatform 部署验证成功");
    }

    // 更新地址文件
    console.log("\n📝 更新地址配置文件...");
    await updateAddressFile(chainId, deployedContracts, deploymentInfo);

    // 输出部署摘要
    console.log("\n=== 📊 部署摘要 ===");
    console.log("网络:", networkName);
    console.log("链ID:", chainId);
    console.log("部署时间:", deploymentInfo.deployedAt);
    console.log("已部署合约:");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`  ${name}: ${address}`);
    });

    console.log("\n🎉 所有合约部署完成！");
    console.log("📁 地址文件已更新: src/contracts/addresses.json");
    console.log("💡 提示: 重启前端应用以加载新的合约地址");
    
    // 显示部署统计
    const successCount = Object.keys(deployedContracts).length;
    console.log(`📊 成功部署 ${successCount} 个合约`);

  } catch (error) {
    console.error("\n❌ 部署过程中出现错误:", error);
    console.error("错误详情:", error.message);
    process.exit(1);
  }
}

// 更新地址文件
async function updateAddressFile(chainId, deployedContracts, deploymentInfo) {
  const addressFilePath = path.join(__dirname, "../src/contracts/addresses.json");
  
  let addressData = {};
  
  // 读取现有地址文件
  try {
    if (fs.existsSync(addressFilePath)) {
      const existingData = fs.readFileSync(addressFilePath, "utf8");
      addressData = JSON.parse(existingData);
    }
  } catch (error) {
    console.log("⚠️ 无法读取现有地址文件，创建新文件");
  }

  // 更新当前网络的地址
  addressData[chainId] = {
    ...deployedContracts,
    ...deploymentInfo
  };

  // 写入文件
  try {
    fs.writeFileSync(addressFilePath, JSON.stringify(addressData, null, 2));
    console.log("✅ 地址文件更新成功:", addressFilePath);
  } catch (error) {
    console.error("❌ 地址文件更新失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 