// 测试工具函数
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3001',
  TEST_DB_URL: 'mysql://root:example@localhost:3306/mockdb',
  ADMIN_EMAIL: 'admin@test.com',
  ADMIN_PASSWORD: 'abcd1234',
  TIMEOUT: 30000
};

// 获取测试配置
function getTestConfig() {
  return TEST_CONFIG;
}

// 构建完整的URL
function buildUrl(path) {
  return `${TEST_CONFIG.BASE_URL}${path}`;
}

// 登录函数
async function login(page) {
  await page.goto(buildUrl('/matchlawyer/login'));
  await page.fill('[data-testid="email-input"]', TEST_CONFIG.ADMIN_EMAIL);
  await page.fill('[data-testid="password-input"]', TEST_CONFIG.ADMIN_PASSWORD);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(buildUrl('/matchlawyer/industries'));
}

// 等待页面加载完成
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
}

// 等待元素可见
async function waitForElement(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

// 等待元素隐藏
async function waitForElementHidden(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

module.exports = {
  TEST_CONFIG,
  getTestConfig,
  buildUrl,
  login,
  waitForPageLoad,
  waitForElement,
  waitForElementHidden
}; 