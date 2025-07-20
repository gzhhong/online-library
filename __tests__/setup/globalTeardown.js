const { clearTestData } = require('./testSetup');

async function globalTeardown(config) {
  console.log('🧹 全局测试清理...');
  
  try {
    // 在所有测试完成后清理数据
    await clearTestData();
    console.log('✅ 全局测试清理完成');
  } catch (error) {
    console.error('❌ 全局测试清理失败:', error);
  }
}

module.exports = globalTeardown; 