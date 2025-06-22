const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 开始完整的Web3平台部署和设置...");
  console.log("=" * 80);
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 部署者地址:", deployer.address);
  console.log("💰 部署者余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log("🌐 网络 Chain ID:", chainId.toString());
  
  const deployedContracts = {};
  
  // 步骤 1: 部署所有智能合约
  console.log("\n📋 步骤 1: 部署智能合约");
  console.log("-" * 50);
  
  try {
    // 部署 EnhancedBank
    console.log("🏦 部署 EnhancedBank...");
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const enhancedBank = await EnhancedBank.deploy();
    await enhancedBank.waitForDeployment();
    deployedContracts.EnhancedBank = await enhancedBank.getAddress();
    console.log("✅ EnhancedBank 部署成功:", deployedContracts.EnhancedBank);
    
    // 部署 TokenFactory
    console.log("🏭 部署 TokenFactory...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy();
    await tokenFactory.waitForDeployment();
    deployedContracts.TokenFactory = await tokenFactory.getAddress();
    console.log("✅ TokenFactory 部署成功:", deployedContracts.TokenFactory);
    
    // 部署 WETH
    console.log("💎 部署 WETH...");
    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.waitForDeployment();
    deployedContracts.WETH = await weth.getAddress();
    console.log("✅ WETH 部署成功:", deployedContracts.WETH);
    
    // 部署 DEXPlatform
    console.log("🔄 部署 DEXPlatform...");
    const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
    const dexPlatform = await DEXPlatform.deploy(deployedContracts.WETH);
    await dexPlatform.waitForDeployment();
    deployedContracts.DEXPlatform = await dexPlatform.getAddress();
    console.log("✅ DEXPlatform 部署成功:", deployedContracts.DEXPlatform);
    
    // 部署 PlatformNFT
    console.log("🎨 部署 PlatformNFT...");
    const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
    const platformNFT = await PlatformNFT.deploy();
    await platformNFT.waitForDeployment();
    deployedContracts.PlatformNFT = await platformNFT.getAddress();
    console.log("✅ PlatformNFT 部署成功:", deployedContracts.PlatformNFT);
    
    // 部署 NFTMarketplace
    console.log("🏪 部署 NFTMarketplace...");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy(deployedContracts.PlatformNFT);
    await nftMarketplace.waitForDeployment();
    deployedContracts.NFTMarketplace = await nftMarketplace.getAddress();
    console.log("✅ NFTMarketplace 部署成功:", deployedContracts.NFTMarketplace);
    
    // 部署 VotingCore
    console.log("🗳️ 部署 VotingCore...");
    const VotingCore = await ethers.getContractFactory("VotingCore");
    const votingCore = await VotingCore.deploy();
    await votingCore.waitForDeployment();
    deployedContracts.VotingCore = await votingCore.getAddress();
    console.log("✅ VotingCore 部署成功:", deployedContracts.VotingCore);
    
  } catch (error) {
    console.error("❌ 合约部署失败:", error.message);
    process.exit(1);
  }
  
  // 步骤 2: 保存合约地址
  console.log("\n📄 步骤 2: 保存合约配置");
  console.log("-" * 50);
  
  const addressesPath = path.join(__dirname, '../src/contracts/addresses.json');
  let existingAddresses = {};
  
  if (fs.existsSync(addressesPath)) {
    existingAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  }
  
  existingAddresses[chainId.toString()] = deployedContracts;
  
  fs.writeFileSync(addressesPath, JSON.stringify(existingAddresses, null, 2));
  console.log("✅ 合约地址已保存到:", addressesPath);
  
  // 步骤 3: 部署测试代币
  console.log("\n🪙 步骤 3: 部署测试代币");
  console.log("-" * 50);
  
  try {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    // 部署 USDC
    console.log("💵 部署 USDC...");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    deployedContracts.USDC = await usdc.getAddress();
    console.log("✅ USDC 部署成功:", deployedContracts.USDC);
    
    // 部署 DAI
    console.log("💶 部署 DAI...");
    const dai = await MockERC20.deploy("Dai Stablecoin", "DAI", 18);
    await dai.waitForDeployment();
    deployedContracts.DAI = await dai.getAddress();
    console.log("✅ DAI 部署成功:", deployedContracts.DAI);
    
    // 更新配置文件
    existingAddresses[chainId.toString()] = deployedContracts;
    fs.writeFileSync(addressesPath, JSON.stringify(existingAddresses, null, 2));
    
  } catch (error) {
    console.error("❌ 测试代币部署失败:", error.message);
  }
  
  // 步骤 4: 初始化DEX交易池
  console.log("\n🔄 步骤 4: 初始化DEX交易池");
  console.log("-" * 50);
  
  try {
    const dexContract = await ethers.getContractAt("DEXPlatform", deployedContracts.DEXPlatform);
    const wethContract = await ethers.getContractAt("WETH", deployedContracts.WETH);
    const usdcContract = await ethers.getContractAt("MockERC20", deployedContracts.USDC);
    const daiContract = await ethers.getContractAt("MockERC20", deployedContracts.DAI);
    
    // 为部署者铸造代币
    await usdcContract.mint(deployer.address, ethers.parseUnits("10000", 6));
    await daiContract.mint(deployer.address, ethers.parseEther("10000"));
    
    // 存入一些ETH到WETH
    await wethContract.deposit({ value: ethers.parseEther("10") });
    
    // 创建交易池
    console.log("🔄 创建 WETH/USDC 交易池...");
    await dexContract.createPool(deployedContracts.WETH, deployedContracts.USDC);
    
    console.log("🔄 创建 WETH/DAI 交易池...");
    await dexContract.createPool(deployedContracts.WETH, deployedContracts.DAI);
    
    console.log("🔄 创建 USDC/DAI 交易池...");
    await dexContract.createPool(deployedContracts.USDC, deployedContracts.DAI);
    
    // 添加流动性
    const wethAmount = ethers.parseEther("1");
    const usdcAmount = ethers.parseUnits("2000", 6);
    const daiAmount = ethers.parseEther("2000");
    
    console.log("💧 添加 WETH/USDC 流动性...");
    await wethContract.approve(deployedContracts.DEXPlatform, wethAmount);
    await usdcContract.approve(deployedContracts.DEXPlatform, usdcAmount);
    await dexContract.addLiquidity(0, wethAmount, usdcAmount);
    
    console.log("💧 添加 WETH/DAI 流动性...");
    await wethContract.approve(deployedContracts.DEXPlatform, wethAmount);
    await daiContract.approve(deployedContracts.DEXPlatform, daiAmount);
    await dexContract.addLiquidity(1, wethAmount, daiAmount);
    
    console.log("✅ DEX交易池初始化完成");
    
  } catch (error) {
    console.error("❌ DEX初始化失败:", error.message);
  }
  
  // 步骤 5: 创建NFT测试数据
  console.log("\n🎨 步骤 5: 创建NFT测试数据");
  console.log("-" * 50);
  
  try {
    const nftContract = await ethers.getContractAt("PlatformNFT", deployedContracts.PlatformNFT);
    const marketplaceContract = await ethers.getContractAt("NFTMarketplace", deployedContracts.NFTMarketplace);
    const accounts = await ethers.getSigners();
    
    const nftTemplates = [
      { name: "Cosmic Dream #001", price: "0.1", shouldList: true },
      { name: "Digital Harmony", price: "0.05", shouldList: true },
      { name: "Cyber Punk Avatar #123", price: "0.12", shouldList: true },
      { name: "Virtual Pet Dragon", price: "0.06", shouldList: true },
      { name: "Music Visualizer NFT", price: "0.18", shouldList: false },
      { name: "Sports Moment #456", price: "0.09", shouldList: true },
      { name: "Collectible Card Alpha", price: "0.30", shouldList: false },
      { name: "Sunset Over Digital City", price: "0.08", shouldList: true }
    ];
    
    let currentTokenId = Number(await nftContract.getCurrentTokenId());
    let nftsCreated = 0;
    let nftsListed = 0;
    
    // 为多个用户创建NFT
    for (let i = 1; i < Math.min(accounts.length, 5) && nftsCreated < nftTemplates.length; i++) {
      const creator = accounts[i];
      const template = nftTemplates[nftsCreated];
      
      console.log(`🎨 用户 ${i} 创建: ${template.name}`);
      
      const tokenURI = `https://api.nft-platform.com/metadata/${currentTokenId}`;
      
      // 铸造NFT
      const mintTx = await nftContract.connect(creator).mint(
        creator.address,
        tokenURI,
        250, // 2.5% royalty
        { value: ethers.parseEther("0.001") }
      );
      await mintTx.wait();
      
      // 上架销售
      if (template.shouldList) {
        await nftContract.connect(creator).approve(deployedContracts.NFTMarketplace, currentTokenId);
        await marketplaceContract.connect(creator).listItem(
          currentTokenId,
          ethers.parseEther(template.price),
          0, // FIXED_PRICE
          0
        );
        nftsListed++;
        console.log(`  ✅ 已上架 (${template.price} ETH)`);
      } else {
        console.log(`  📦 保留在钱包中`);
      }
      
      currentTokenId++;
      nftsCreated++;
      
      // 添加延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ NFT数据创建完成 (${nftsCreated}个NFT, ${nftsListed}个上架)`);
    
  } catch (error) {
    console.error("❌ NFT数据创建失败:", error.message);
  }
  
  // 步骤 6: 创建投票提案
  console.log("\n🗳️ 步骤 6: 创建投票提案");
  console.log("-" * 50);
  
  try {
    const votingContract = await ethers.getContractAt("VotingCore", deployedContracts.VotingCore);
    const accounts = await ethers.getSigners();
    
    const proposals = [
      {
        title: "平台手续费调整提案",
        description: "建议将平台交易手续费从0.3%降低至0.25%，以提高用户体验和竞争力。"
      },
      {
        title: "新功能开发投票",
        description: "是否支持开发跨链桥功能，允许用户在不同区块链间转移资产？"
      },
      {
        title: "社区治理规则修订",
        description: "修订社区治理规则，增加最低投票参与度要求为总代币供应量的10%。"
      }
    ];
    
    for (let i = 0; i < proposals.length && i < 3; i++) {
      const creator = accounts[i + 1];
      const proposal = proposals[i];
      
      console.log(`📝 创建提案: ${proposal.title}`);
      
      const duration = 7 * 24 * 60 * 60; // 7天
      await votingContract.connect(creator).createProposal(
        proposal.title,
        proposal.description,
        duration
      );
      
      console.log(`  ✅ 提案创建成功`);
    }
    
    console.log("✅ 投票提案创建完成");
    
  } catch (error) {
    console.error("❌ 投票提案创建失败:", error.message);
  }
  
  // 总结
  console.log("\n" + "=" * 80);
  console.log("🎉 完整平台部署和设置完成！");
  console.log("=" * 80);
  
  console.log("\n📊 部署统计:");
  console.log(`✅ 智能合约: ${Object.keys(deployedContracts).length} 个`);
  console.log(`✅ 测试代币: 2 个 (USDC, DAI)`);
  console.log(`✅ DEX交易池: 3 个`);
  console.log(`✅ NFT测试数据: ~8 个`);
  console.log(`✅ 投票提案: 3 个`);
  
  console.log("\n📋 合约地址:");
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  console.log("\n💡 下一步:");
  console.log("   1. 启动前端应用: npm run dev");
  console.log("   2. 在MetaMask中切换到Ganache网络");
  console.log("   3. 导入Ganache账户进行测试");
  console.log("   4. 开始使用各个功能模块");
  
  console.log("\n🔄 重新部署:");
  console.log("   如果需要重新部署，请重新运行此脚本");
  console.log("   脚本会自动覆盖之前的部署配置");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署脚本执行失败:", error);
    console.error("详细错误:", error.stack);
    process.exit(1);
  }); 