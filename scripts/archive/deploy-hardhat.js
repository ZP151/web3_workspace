const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 部署到Hardhat本地网络...");
  
  const [deployer] = await hre.ethers.getSigners();
  const chainId = hre.network.config.chainId;

  console.log("📋 部署信息:");
  console.log(`网络: ${hre.network.name}`);
  console.log(`链ID: ${chainId}`);
  console.log(`部署者: ${deployer.address}`);
  console.log(`余额: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  // 部署Mock代币
  console.log("\n💰 部署Mock代币...");
  
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  
  const weth = await MockERC20.deploy(
    "Wrapped Ether", 
    "WETH", 
    18, 
    1000000 // 1M WETH
  );
  await weth.waitForDeployment();
  console.log(`✅ WETH部署成功: ${await weth.getAddress()}`);

  const usdc = await MockERC20.deploy(
    "USD Coin", 
    "USDC", 
    6, 
    1000000 // 1M USDC
  );
  await usdc.waitForDeployment();
  console.log(`✅ USDC部署成功: ${await usdc.getAddress()}`);

  const dai = await MockERC20.deploy(
    "Dai Stablecoin", 
    "DAI", 
    18, 
    1000000 // 1M DAI
  );
  await dai.waitForDeployment();
  console.log(`✅ DAI部署成功: ${await dai.getAddress()}`);

  // 部署SimpleBank
  console.log("\n🏦 部署SimpleBank...");
  const SimpleBank = await hre.ethers.getContractFactory("SimpleBank");
  const simpleBank = await SimpleBank.deploy();
  await simpleBank.waitForDeployment();
  console.log(`✅ SimpleBank部署成功: ${await simpleBank.getAddress()}`);

  // 部署EnhancedBank
  console.log("\n🏦 部署EnhancedBank...");
  const EnhancedBank = await hre.ethers.getContractFactory("EnhancedBank");
  const enhancedBank = await EnhancedBank.deploy();
  await enhancedBank.waitForDeployment();
  console.log(`✅ EnhancedBank部署成功: ${await enhancedBank.getAddress()}`);

  // 部署NFTMarketplace
  console.log("\n🖼️ 部署NFTMarketplace...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy();
  await nftMarketplace.waitForDeployment();
  console.log(`✅ NFTMarketplace部署成功: ${await nftMarketplace.getAddress()}`);

  // 部署TokenFactory
  console.log("\n🏭 部署TokenFactory...");
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  console.log(`✅ TokenFactory部署成功: ${await tokenFactory.getAddress()}`);

  // 部署VotingCore
  console.log("\n🗳️ 部署VotingCore...");
  const VotingCore = await hre.ethers.getContractFactory("VotingCore");
  const votingCore = await VotingCore.deploy();
  await votingCore.waitForDeployment();
  console.log(`✅ VotingCore部署成功: ${await votingCore.getAddress()}`);

  // 部署DEXPlatform
  console.log("\n🔄 部署DEXPlatform...");
  const DEXPlatform = await hre.ethers.getContractFactory("DEXPlatform");
  const dexPlatform = await DEXPlatform.deploy();
  await dexPlatform.waitForDeployment();
  console.log(`✅ DEXPlatform部署成功: ${await dexPlatform.getAddress()}`);

  // 保存合约地址
  const contractAddresses = {
    SimpleBank: await simpleBank.getAddress(),
    EnhancedBank: await enhancedBank.getAddress(),
    NFTMarketplace: await nftMarketplace.getAddress(),
    TokenFactory: await tokenFactory.getAddress(),
    VotingCore: await votingCore.getAddress(),
    DEXPlatform: await dexPlatform.getAddress(),
    WETH: await weth.getAddress(),
    USDC: await usdc.getAddress(),
    DAI: await dai.getAddress()
  };

  // 确保目录存在
  const contractsDir = path.join(__dirname, '../src/contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // 读取现有地址并更新
  const addressesPath = path.join(contractsDir, 'addresses.json');
  let allAddresses = {};
  if (fs.existsSync(addressesPath)) {
    allAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  }

  allAddresses[chainId.toString()] = contractAddresses;
  fs.writeFileSync(addressesPath, JSON.stringify(allAddresses, null, 2));

  console.log("\n📝 合约地址已保存到 src/contracts/addresses.json");

  // 初始化DEX池子
  console.log("\n🔄 初始化DEX流动性池...");
  
  const wethAddress = await weth.getAddress();
  const usdcAddress = await usdc.getAddress();
  const daiAddress = await dai.getAddress();

  // 创建WETH/USDC池子
  await dexPlatform.createPool(wethAddress, usdcAddress, 30); // 0.3%费率
  console.log("✅ WETH/USDC池子创建成功");

  // 创建WETH/DAI池子
  await dexPlatform.createPool(wethAddress, daiAddress, 30);
  console.log("✅ WETH/DAI池子创建成功");

  // 创建USDC/DAI池子
  await dexPlatform.createPool(usdcAddress, daiAddress, 5); // 0.05%费率
  console.log("✅ USDC/DAI池子创建成功");

  // 为部署者授权和添加初始流动性
  console.log("\n💧 添加初始流动性...");
  
  const wethAmount = hre.ethers.parseEther("100"); // 100 WETH
  const usdcAmount = hre.ethers.parseUnits("200000", 6); // 200,000 USDC
  const daiAmount = hre.ethers.parseEther("200000"); // 200,000 DAI
  
  // 授权代币
  await weth.approve(await dexPlatform.getAddress(), hre.ethers.parseEther("1000"));
  await usdc.approve(await dexPlatform.getAddress(), hre.ethers.parseUnits("1000000", 6));
  await dai.approve(await dexPlatform.getAddress(), hre.ethers.parseEther("1000000"));
  
  console.log("✅ 代币授权完成");

  // 获取池子ID
  const allPools = await dexPlatform.getAllPools();
  
  if (allPools.length >= 3) {
    // 添加WETH/USDC流动性
    await dexPlatform.addLiquidity(
      allPools[0], // WETH/USDC池子
      wethAmount,
      usdcAmount,
      hre.ethers.parseEther("95"), // 最少95 WETH
      hre.ethers.parseUnits("190000", 6) // 最少190,000 USDC
    );
    console.log("✅ WETH/USDC池子流动性添加成功");

    // 添加WETH/DAI流动性
    await dexPlatform.addLiquidity(
      allPools[1], // WETH/DAI池子
      wethAmount,
      daiAmount,
      hre.ethers.parseEther("95"), // 最少95 WETH
      hre.ethers.parseEther("190000") // 最少190,000 DAI
    );
    console.log("✅ WETH/DAI池子流动性添加成功");

    // 添加USDC/DAI流动性
    await dexPlatform.addLiquidity(
      allPools[2], // USDC/DAI池子
      usdcAmount,
      daiAmount,
      hre.ethers.parseUnits("190000", 6), // 最少190,000 USDC
      hre.ethers.parseEther("190000") // 最少190,000 DAI
    );
    console.log("✅ USDC/DAI池子流动性添加成功");
  }

  // 创建测试提案
  console.log("\n🗳️ 创建测试提案...");
  
  const createFee = hre.ethers.parseEther("0.01");
  
  // 创建简单投票提案
  await votingCore.createProposal(
    "提高平台交易费用",
    "提议将平台交易费用从0.05%提高到0.1%，以维持平台运营和开发。",
    72, // 72小时
    10, // 最少10票
    0,  // 简单投票
    1,  // 财务类别
    [], // 简单投票没有选项
    { value: createFee }
  );
  console.log("✅ 简单投票提案创建成功");

  // 创建多选提案
  await votingCore.createProposal(
    "选择新的流动性挖矿奖励代币",
    "我们需要为流动性挖矿选择新的奖励代币，请从以下选项中选择最合适的代币。",
    48, // 48小时
    5,  // 最少5票
    1,  // 多选投票
    1,  // 财务类别
    ["USDC", "DAI", "WETH", "自定义代币"], // 多选选项
    { value: createFee }
  );
  console.log("✅ 多选投票提案创建成功");

  // 创建权重投票提案
  await votingCore.createProposal(
    "权重投票测试提案",
    "这是一个测试权重投票功能的提案，用户可以根据自己的投票权重进行投票。",
    24, // 24小时
    3,  // 最少3票
    2,  // 权重投票
    0,  // 治理类别
    [], // 权重投票没有预设选项
    { value: createFee }
  );
  console.log("✅ 权重投票提案创建成功");

  console.log("\n🎉 Hardhat本地网络部署完成！");
  console.log("\n📋 使用说明:");
  console.log("1. 启动Hardhat本地节点: npx hardhat node");
  console.log("2. 在MetaMask中添加本地网络:");
  console.log("   - 网络名称: Hardhat Local");
  console.log("   - RPC URL: http://127.0.0.1:8545");
  console.log("   - 链ID: 31337");
  console.log("   - 货币符号: ETH");
  console.log("3. 导入测试账户私钥到MetaMask");
  console.log("4. 前端应用将自动连接到本地网络");
  
  console.log("\n💰 代币余额:");
  console.log(`WETH: ${hre.ethers.formatEther(await weth.balanceOf(deployer.address))}`);
  console.log(`USDC: ${hre.ethers.formatUnits(await usdc.balanceOf(deployer.address), 6)}`);
  console.log(`DAI: ${hre.ethers.formatEther(await dai.balanceOf(deployer.address))}`);
  
  console.log("\n📊 DEX状态:");
  const finalPools = await dexPlatform.getAllPools();
  console.log(`流动性池数量: ${finalPools.length}`);
  
  console.log("\n🗳️ 投票状态:");
  const proposalCount = await votingCore.getProposalCount();
  console.log(`提案数量: ${proposalCount}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 