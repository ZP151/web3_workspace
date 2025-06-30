const hre = require("hardhat");

async function main() {
    console.log("🏗️ 部署并测试AccessControl增强版NFT合约");
    console.log("==================================================");
    
    const [deployer, alice, bob, charlie] = await hre.ethers.getSigners();
    
    console.log(`👤 部署者: ${deployer.address}`);
    console.log(`👤 Alice: ${alice.address}`);
    console.log(`👤 Bob: ${bob.address}`);
    console.log(`👤 Charlie: ${charlie.address}`);
    
    console.log("\n🚀 部署PlatformNFTv2合约...");
    console.log("----------------------------------------------------------------------");
    
    // 部署合约
    const PlatformNFTv2 = await hre.ethers.getContractFactory("PlatformNFTv2");
    const nftv2 = await PlatformNFTv2.deploy(deployer.address);
    await nftv2.waitForDeployment();
    
    const nftv2Address = await nftv2.getAddress();
    console.log(`✅ PlatformNFTv2部署完成: ${nftv2Address}`);
    
    // 定义角色
    const DEFAULT_ADMIN_ROLE = await nftv2.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await nftv2.MINTER_ROLE();
    const PAUSER_ROLE = await nftv2.PAUSER_ROLE();
    const FEE_MANAGER_ROLE = await nftv2.FEE_MANAGER_ROLE();
    const EMERGENCY_ROLE = await nftv2.EMERGENCY_ROLE();
    
    console.log("\n🔐 角色定义:");
    console.log("----------------------------------------------------------------------");
    console.log(`🔑 DEFAULT_ADMIN_ROLE: ${DEFAULT_ADMIN_ROLE}`);
    console.log(`🎨 MINTER_ROLE: ${MINTER_ROLE}`);
    console.log(`⏸️ PAUSER_ROLE: ${PAUSER_ROLE}`);
    console.log(`💰 FEE_MANAGER_ROLE: ${FEE_MANAGER_ROLE}`);
    console.log(`🚨 EMERGENCY_ROLE: ${EMERGENCY_ROLE}`);
    
    console.log("\n📋 初始权限检查:");
    console.log("----------------------------------------------------------------------");
    console.log(`✅ 部署者拥有管理员权限: ${await nftv2.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)}`);
    console.log(`✅ 部署者拥有铸造权限: ${await nftv2.hasRole(MINTER_ROLE, deployer.address)}`);
    console.log(`✅ 部署者拥有暂停权限: ${await nftv2.hasRole(PAUSER_ROLE, deployer.address)}`);
    console.log(`✅ 部署者拥有费用管理权限: ${await nftv2.hasRole(FEE_MANAGER_ROLE, deployer.address)}`);
    console.log(`✅ 部署者拥有紧急权限: ${await nftv2.hasRole(EMERGENCY_ROLE, deployer.address)}`);
    
    console.log("\n🎯 分配细粒度权限:");
    console.log("----------------------------------------------------------------------");
    
    // 给Alice分配铸造权限
    console.log("🎨 给Alice分配MINTER_ROLE...");
    await nftv2.grantRoleWithReason(MINTER_ROLE, alice.address, "Alice is the designated NFT creator");
    console.log(`✅ Alice现在拥有铸造权限: ${await nftv2.hasRole(MINTER_ROLE, alice.address)}`);
    
    // 给Bob分配暂停权限
    console.log("⏸️ 给Bob分配PAUSER_ROLE...");
    await nftv2.grantRoleWithReason(PAUSER_ROLE, bob.address, "Bob is responsible for emergency pausing");
    console.log(`✅ Bob现在拥有暂停权限: ${await nftv2.hasRole(PAUSER_ROLE, bob.address)}`);
    
    // 给Charlie分配费用管理权限
    console.log("💰 给Charlie分配FEE_MANAGER_ROLE...");
    await nftv2.grantRoleWithReason(FEE_MANAGER_ROLE, charlie.address, "Charlie manages platform fees");
    console.log(`✅ Charlie现在拥有费用管理权限: ${await nftv2.hasRole(FEE_MANAGER_ROLE, charlie.address)}`);
    
    console.log("\n🧪 测试权限隔离:");
    console.log("======================================================================");
    
    // 测试1: Alice可以铸造NFT
    console.log("\n1️⃣ 测试Alice的铸造权限:");
    console.log("----------------------------------------------------------------------");
    try {
        const mintTx = await nftv2.connect(alice).mint(
            alice.address,
            "ipfs://alice-nft-uri",
            250, // 2.5% royalty
            { value: hre.ethers.parseEther("0.001") }
        );
        await mintTx.wait();
        console.log("✅ Alice成功铸造NFT (有铸造权限)");
        
        const totalSupply = await nftv2.totalSupply();
        console.log(`📊 当前NFT总数: ${totalSupply}`);
    } catch (error) {
        console.log(`❌ Alice铸造失败: ${error.message}`);
    }
    
    // 测试2: Bob不能铸造NFT
    console.log("\n2️⃣ 测试Bob的权限限制:");
    console.log("----------------------------------------------------------------------");
    try {
        await nftv2.connect(bob).mint(
            bob.address,
            "ipfs://bob-nft-uri",
            250,
            { value: hre.ethers.parseEther("0.001") }
        );
        console.log("❌ 意外：Bob成功铸造了NFT！");
    } catch (error) {
        console.log("✅ 正确：Bob无法铸造NFT (没有铸造权限)");
        console.log(`   错误信息: ${error.message.substring(0, 100)}...`);
    }
    
    // 测试3: Bob可以暂停合约
    console.log("\n3️⃣ 测试Bob的暂停权限:");
    console.log("----------------------------------------------------------------------");
    try {
        const pauseTx = await nftv2.connect(bob).pause();
        await pauseTx.wait();
        console.log("✅ Bob成功暂停合约 (有暂停权限)");
        
        const isPaused = await nftv2.paused();
        console.log(`🔒 合约暂停状态: ${isPaused}`);
    } catch (error) {
        console.log(`❌ Bob暂停失败: ${error.message}`);
    }
    
    // 测试4: Alice不能取消暂停
    console.log("\n4️⃣ 测试权限隔离 - Alice不能取消暂停:");
    console.log("----------------------------------------------------------------------");
    try {
        await nftv2.connect(alice).unpause();
        console.log("❌ 意外：Alice成功取消了暂停！");
    } catch (error) {
        console.log("✅ 正确：Alice无法取消暂停 (没有暂停权限)");
        console.log(`   错误信息: ${error.message.substring(0, 100)}...`);
    }
    
    // 测试5: Bob恢复合约
    console.log("\n5️⃣ 测试Bob恢复合约:");
    console.log("----------------------------------------------------------------------");
    try {
        const unpauseTx = await nftv2.connect(bob).unpause();
        await unpauseTx.wait();
        console.log("✅ Bob成功恢复合约运行");
        
        const isPaused = await nftv2.paused();
        console.log(`🔓 合约暂停状态: ${isPaused}`);
    } catch (error) {
        console.log(`❌ Bob恢复失败: ${error.message}`);
    }
    
    // 测试6: Charlie可以设置费用
    console.log("\n6️⃣ 测试Charlie的费用管理权限:");
    console.log("----------------------------------------------------------------------");
    try {
        const oldFee = await nftv2.mintFee();
        console.log(`💰 当前铸造费用: ${hre.ethers.formatEther(oldFee)} ETH`);
        
        const setFeeTx = await nftv2.connect(charlie).setMintFee(hre.ethers.parseEther("0.002"));
        await setFeeTx.wait();
        
        const newFee = await nftv2.mintFee();
        console.log("✅ Charlie成功设置费用 (有费用管理权限)");
        console.log(`💰 新铸造费用: ${hre.ethers.formatEther(newFee)} ETH`);
    } catch (error) {
        console.log(`❌ Charlie设置费用失败: ${error.message}`);
    }
    
    // 测试7: 公开铸造功能
    console.log("\n7️⃣ 测试公开铸造功能:");
    console.log("----------------------------------------------------------------------");
    try {
        const publicMintTx = await nftv2.connect(bob).publicMint(
            bob.address,
            "ipfs://public-mint-uri",
            500, // 5% royalty
            { value: hre.ethers.parseEther("0.002") } // 使用新费用
        );
        await publicMintTx.wait();
        console.log("✅ Bob成功通过公开铸造创建NFT");
        
        const totalSupply = await nftv2.totalSupply();
        console.log(`📊 当前NFT总数: ${totalSupply}`);
    } catch (error) {
        console.log(`❌ 公开铸造失败: ${error.message}`);
    }
    
    // 测试8: 批量铸造
    console.log("\n8️⃣ 测试Alice的批量铸造功能:");
    console.log("----------------------------------------------------------------------");
    try {
        const recipients = [alice.address, bob.address, charlie.address];
        const uris = [
            "ipfs://batch-uri-1",
            "ipfs://batch-uri-2", 
            "ipfs://batch-uri-3"
        ];
        const royalties = [250, 500, 750]; // 2.5%, 5%, 7.5%
        
        const batchMintTx = await nftv2.connect(alice).batchMint(
            recipients,
            uris,
            royalties,
            { value: hre.ethers.parseEther("0.006") } // 3 * 0.002 ETH
        );
        await batchMintTx.wait();
        console.log("✅ Alice成功批量铸造3个NFT");
        
        const totalSupply = await nftv2.totalSupply();
        console.log(`📊 当前NFT总数: ${totalSupply}`);
    } catch (error) {
        console.log(`❌ 批量铸造失败: ${error.message}`);
    }
    
    console.log("\n📊 最终权限状态总结:");
    console.log("======================================================================");
    console.log("👤 用户权限分配:");
    console.log(`   部署者: 超级管理员 + 所有权限`);
    console.log(`   Alice: MINTER_ROLE (可以铸造NFT和批量铸造)`);
    console.log(`   Bob: PAUSER_ROLE (可以暂停/恢复合约)`);
    console.log(`   Charlie: FEE_MANAGER_ROLE (可以设置费用)`);
    console.log("");
    console.log("✅ AccessControl优势演示:");
    console.log("   • 细粒度权限控制");
    console.log("   • 职责分离，降低单点风险");
    console.log("   • 可审计的权限变更");
    console.log("   • 灵活的角色管理");
    console.log("   • 公开功能与管理员功能分离");
    
    console.log("\n🔐 安全改进对比:");
    console.log("======================================================================");
    console.log("❌ Ownable模式问题:");
    console.log("   • 单一所有者，单点故障");
    console.log("   • 无法委托特定权限");
    console.log("   • 权限过于集中");
    console.log("");
    console.log("✅ AccessControl优势:");
    console.log("   • 多角色权限分配");
    console.log("   • 最小权限原则");
    console.log("   • 角色继承和管理");
    console.log("   • 权限变更可追踪");
    
    console.log("\n🎯 下一步建议:");
    console.log("======================================================================");
    console.log("1. 🏛️ 为不同角色设置多重签名钱包");
    console.log("2. ⏰ 添加时间锁定控制关键操作");
    console.log("3. 📊 实施链上治理机制");
    console.log("4. 🔄 考虑可升级代理模式");
    
    console.log("\n✅ AccessControl升级演示完成");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 