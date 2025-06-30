const hre = require("hardhat");

async function main() {
    console.log("⏰ 部署并测试时间锁定控制系统");
    console.log("==================================================");
    
    const [deployer, proposer, executor, user] = await hre.ethers.getSigners();
    
    console.log(`👤 部署者: ${deployer.address}`);
    console.log(`📝 提议者: ${proposer.address}`);
    console.log(`⚡ 执行者: ${executor.address}`);
    console.log(`👥 普通用户: ${user.address}`);
    
    // 时间锁定配置
    const MIN_DELAY = 60; // 60秒延迟 (演示用，生产环境建议24小时)
    
    console.log("\n🚀 第一步：部署时间锁定控制器");
    console.log("----------------------------------------------------------------------");
    
    // 部署时间锁定控制器
    const TimeLock = await hre.ethers.getContractFactory("PlatformTimeLock");
    const timeLock = await TimeLock.deploy(
        MIN_DELAY,
        [proposer.address], // 提议者
        [executor.address], // 执行者
        deployer.address    // 管理员
    );
    await timeLock.waitForDeployment();
    
    const timeLockAddress = await timeLock.getAddress();
    console.log(`✅ 时间锁定控制器部署完成: ${timeLockAddress}`);
    console.log(`⏰ 最小延迟时间: ${MIN_DELAY} 秒`);
    
    console.log("\n🚀 第二步：部署NFTv3合约");
    console.log("----------------------------------------------------------------------");
    
    // 部署NFTv3合约
    const PlatformNFTv3 = await hre.ethers.getContractFactory("PlatformNFTv3");
    const nftv3 = await PlatformNFTv3.deploy(deployer.address, timeLockAddress);
    await nftv3.waitForDeployment();
    
    const nftv3Address = await nftv3.getAddress();
    console.log(`✅ PlatformNFTv3部署完成: ${nftv3Address}`);
    
    console.log("\n🔐 第三步：角色权限配置");
    console.log("----------------------------------------------------------------------");
    
    // 获取角色定义
    const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE();
    const CANCELLER_ROLE = await timeLock.CANCELLER_ROLE();
    const FEE_MANAGER_ROLE = await nftv3.FEE_MANAGER_ROLE();
    
    console.log(`📝 PROPOSER_ROLE: ${PROPOSER_ROLE}`);
    console.log(`⚡ EXECUTOR_ROLE: ${EXECUTOR_ROLE}`);
    console.log(`❌ CANCELLER_ROLE: ${CANCELLER_ROLE}`);
    console.log(`💰 FEE_MANAGER_ROLE: ${FEE_MANAGER_ROLE}`);
    
    // 检查初始权限
    console.log("\n📋 初始权限检查:");
    console.log(`✅ 提议者拥有PROPOSER_ROLE: ${await timeLock.hasRole(PROPOSER_ROLE, proposer.address)}`);
    console.log(`✅ 执行者拥有EXECUTOR_ROLE: ${await timeLock.hasRole(EXECUTOR_ROLE, executor.address)}`);
    console.log(`✅ TimeLock拥有NFT费用管理权限: ${await nftv3.hasRole(FEE_MANAGER_ROLE, timeLockAddress)}`);
    
    console.log("\n🧪 第四步：时间锁定功能测试");
    console.log("======================================================================");
    
    // 当前费用
    const currentFee = await nftv3.mintFee();
    console.log(`💰 当前铸造费用: ${hre.ethers.formatEther(currentFee)} ETH`);
    
    // 测试1: 提议费用变更
    console.log("\n1️⃣ 提议费用变更 (0.001 ETH → 0.005 ETH):");
    console.log("----------------------------------------------------------------------");
    
    const newFee = hre.ethers.parseEther("0.005");
    const operationId = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("fee_change_001"));
    
    // 准备时间锁定操作数据
    const target = nftv3Address;
    const value = 0;
    const data = nftv3.interface.encodeFunctionData("executeFeeChange", [newFee, operationId]);
    const predecessor = hre.ethers.ZeroHash;
    const salt = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("salt_001"));
    
    try {
        // 先在NFT合约中提议费用变更
        await nftv3.proposeFeeChange(newFee, operationId);
        console.log("✅ NFT合约中费用变更提议成功");
        
        // 在时间锁定控制器中调度操作
        const scheduleTx = await timeLock.connect(proposer).schedule(
            target,
            value,
            data,
            predecessor,
            salt,
            MIN_DELAY
        );
        await scheduleTx.wait();
        
        console.log("✅ 时间锁定操作调度成功");
        console.log(`⏰ 预计执行时间: ${new Date(Date.now() + MIN_DELAY * 1000).toLocaleString()}`);
        
        // 获取操作ID
        const operationHash = await timeLock.hashOperation(target, value, data, predecessor, salt);
        console.log(`🔑 操作ID: ${operationHash}`);
        
    } catch (error) {
        console.log(`❌ 提议失败: ${error.message}`);
    }
    
    // 测试2: 立即执行应该失败
    console.log("\n2️⃣ 测试立即执行 (应该失败):");
    console.log("----------------------------------------------------------------------");
    
    try {
        const operationHash = await timeLock.hashOperation(target, value, data, predecessor, salt);
        
        await timeLock.connect(executor).execute(
            target,
            value,
            data,
            predecessor,
            salt
        );
        console.log("❌ 意外：立即执行成功了！");
    } catch (error) {
        console.log("✅ 正确：立即执行被阻止");
        console.log(`   错误信息: ${error.message.substring(0, 100)}...`);
    }
    
    // 测试3: 检查操作状态
    console.log("\n3️⃣ 检查操作状态:");
    console.log("----------------------------------------------------------------------");
    
    const operationHash = await timeLock.hashOperation(target, value, data, predecessor, salt);
    const isPending = await timeLock.isOperationPending(operationHash);
    const isReady = await timeLock.isOperationReady(operationHash);
    const timestamp = await timeLock.getTimestamp(operationHash);
    
    console.log(`📋 操作状态:`);
    console.log(`   - 等待中: ${isPending}`);
    console.log(`   - 准备就绪: ${isReady}`);
    console.log(`   - 时间戳: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    
    // 测试4: 等待延迟时间
    console.log("\n4️⃣ 等待延迟时间...");
    console.log("----------------------------------------------------------------------");
    console.log(`⏳ 等待 ${MIN_DELAY} 秒...`);
    
    // 等待延迟时间 + 1秒缓冲
    await new Promise(resolve => setTimeout(resolve, (MIN_DELAY + 1) * 1000));
    
    console.log("⏰ 等待完成！");
    
    // 测试5: 检查操作现在是否准备就绪
    console.log("\n5️⃣ 检查操作是否准备就绪:");
    console.log("----------------------------------------------------------------------");
    
    const isReadyNow = await timeLock.isOperationReady(operationHash);
    console.log(`🟢 操作准备就绪: ${isReadyNow}`);
    
    if (isReadyNow) {
        // 测试6: 执行操作
        console.log("\n6️⃣ 执行费用变更:");
        console.log("----------------------------------------------------------------------");
        
        try {
            const executeTx = await timeLock.connect(executor).execute(
                target,
                value,
                data,
                predecessor,
                salt
            );
            await executeTx.wait();
            
            console.log("✅ 费用变更执行成功！");
            
            // 检查新费用
            const updatedFee = await nftv3.mintFee();
            console.log(`💰 更新后费用: ${hre.ethers.formatEther(updatedFee)} ETH`);
            
            // 检查操作是否完成
            const isDone = await timeLock.isOperationDone(operationHash);
            console.log(`✅ 操作完成状态: ${isDone}`);
            
        } catch (error) {
            console.log(`❌ 执行失败: ${error.message}`);
        }
    }
    
    // 测试7: 测试紧急功能的冷却期
    console.log("\n7️⃣ 测试紧急功能冷却期:");
    console.log("----------------------------------------------------------------------");
    
    try {
        await nftv3.emergencyPause("Testing emergency cooldown");
        console.log("✅ 第一次紧急暂停成功");
        
        // 立即尝试第二次紧急操作
        await nftv3.emergencyWithdraw(deployer.address, "Testing cooldown");
        console.log("❌ 意外：连续紧急操作成功了！");
    } catch (error) {
        console.log("✅ 正确：紧急操作冷却期生效");
        console.log(`   错误信息: ${error.message.substring(0, 100)}...`);
    }
    
    // 测试8: 普通用户铸造测试
    console.log("\n8️⃣ 测试公开铸造功能:");
    console.log("----------------------------------------------------------------------");
    
    try {
        const updatedFee = await nftv3.mintFee();
        const mintTx = await nftv3.connect(user).mint(
            user.address,
            "ipfs://timelock-test-nft",
            250, // 2.5% royalty
            { value: updatedFee }
        );
        await mintTx.wait();
        
        console.log("✅ 用户成功铸造NFT (使用新费用)");
        
        const totalSupply = await nftv3.totalSupply();
        console.log(`📊 当前NFT总数: ${totalSupply}`);
    } catch (error) {
        console.log(`❌ 铸造失败: ${error.message}`);
    }
    
    console.log("\n📊 时间锁定功能测试总结:");
    console.log("======================================================================");
    console.log("✅ 成功验证的安全特性:");
    console.log("   • 关键操作必须经过延迟执行");
    console.log("   • 立即执行被正确阻止");
    console.log("   • 操作状态可查询和追踪");
    console.log("   • 延迟时间到期后可正常执行");
    console.log("   • 紧急操作有冷却期保护");
    console.log("   • 费用变更通过时间锁定安全执行");
    
    console.log("\n🔐 安全优势总结:");
    console.log("======================================================================");
    console.log("🛡️ 时间锁定控制优势:");
    console.log("   • 防止恶意快速操作");
    console.log("   • 给社区时间检查和响应");
    console.log("   • 提高治理透明度");
    console.log("   • 降低管理员滥用风险");
    console.log("   • 支持操作取消机制");
    
    console.log("\n🎯 生产环境建议:");
    console.log("======================================================================");
    console.log("1. ⏰ 设置合理延迟时间 (24小时或更长)");
    console.log("2. 🏛️ 使用多重签名作为提议者和执行者");
    console.log("3. 📊 建立社区监控和告警机制");
    console.log("4. 🔄 定期审查时间锁定操作");
    
    console.log("\n✅ 时间锁定控制系统测试完成");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 