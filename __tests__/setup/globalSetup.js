const { chromium } = require('@playwright/test');

// 全局测试配置
global.TEST_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  TEST_DB_URL: 'mysql://root:example@localhost:3306/mockdb',
  ADMIN_EMAIL: 'admin@test.com',
  ADMIN_PASSWORD: 'abcd1234',
  TIMEOUT: 30000
};

async function globalSetup(config) {
  // 设置全局变量
  process.env.TEST_BASE_URL = TEST_CONFIG.BASE_URL;
  process.env.TEST_DB_URL = TEST_CONFIG.TEST_DB_URL;
  
  console.log('🌍 全局测试配置已设置:');
  console.log(`   - 测试服务器: ${TEST_CONFIG.BASE_URL}`);
  console.log(`   - 测试数据库: ${TEST_CONFIG.TEST_DB_URL}`);
  console.log(`   - 管理员邮箱: ${TEST_CONFIG.ADMIN_EMAIL}`);
}

module.exports = globalSetup; 