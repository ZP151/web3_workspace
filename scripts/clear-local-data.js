// 清理本地存储数据的脚本
// 用于解决合约地址变更后的历史数据冲突

console.log('🧹 本地数据清理工具');
console.log('==========================================');

// 模拟清理建议
const LOCAL_STORAGE_KEYS = [
  'voting_proposals_*',
  'banking_transactions_*', 
  'created_tokens_*',
  'user_settings_*'
];

console.log('\n📋 建议清理的数据类型:');
LOCAL_STORAGE_KEYS.forEach(key => {
  console.log(`  - ${key}`);
});

console.log('\n🔧 手动清理步骤:');
console.log('1. 打开浏览器开发者工具 (F12)');
console.log('2. 转到 Application/Storage > Local Storage');
console.log('3. 找到 http://localhost:3000');
console.log('4. 删除包含旧合约地址的数据项');

console.log('\n💡 或者在浏览器控制台执行:');
console.log('localStorage.clear() // 清理所有本地数据');

console.log('\n✅ 清理完成后:');
console.log('- 重新连接钱包');
console.log('- 确认切换到正确的网络');
console.log('- 新的交易会使用正确的合约地址');

console.log('\n🌐 新的合约地址 (Ganache网络):');
console.log('- VotingCore: 0xddAb3597629E73e0a7Ea830D2B924eB3a1f8Bd9a');
console.log('- SimpleBank: 0xf9970A467c735dA0A50bB401218F80Da78b34683');
console.log('- TokenFactory: 0xF6697085dcfA7e2BA07662c6472191daF249a9BD'); 