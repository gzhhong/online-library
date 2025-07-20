const { test, expect } = require('@playwright/test');
const { clearTestData } = require('../setup/testSetup');
const { buildUrl, waitForPageLoad } = require('../utils/testHelpers');

test.describe('MatchLawyer 登录功能', () => {
  test.beforeAll(async () => {
    // 清空测试数据
    await clearTestData();
  });
  test('应该能够成功登录并跳转到industries页面', async ({ page }) => {
    // 访问登录页面
    await page.goto(buildUrl('/matchlawyer/login'));
    
    // 等待页面加载
    await waitForPageLoad(page);
    
    // 填写登录表单
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'abcd1234');
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');
    
    // 等待页面跳转
    await page.waitForURL('**/matchlawyer/industries');
    
    // 验证当前URL
    expect(page.url()).toContain('/matchlawyer/industries');
    
    // 验证登录成功（检查页面标题或特定元素）
    await expect(page.locator('h1, h2, h3, h4, h5, h6')).toContainText(/行业|Industry/i);
  });
  
  test('登录失败时应该显示错误信息', async ({ page }) => {
    // 访问登录页面
    await page.goto(buildUrl('/matchlawyer/login'));
    
    // 填写错误的登录信息
    await page.fill('[data-testid="email-input"]', 'wrong@test.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');
    
    // 等待错误信息出现
    await page.waitForTimeout(1000);
    
    // 验证错误信息
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
  
  test('表单验证应该正常工作', async ({ page }) => {
    // 访问登录页面
    await page.goto(buildUrl('/matchlawyer/login'));
    
    // 尝试提交空表单
    await page.click('[data-testid="login-button"]');
    
    // 等待验证错误出现
    await page.waitForTimeout(500);
    
    // 验证表单验证错误（Material-UI的表单验证）
    const validationErrors = page.locator('.MuiFormHelperText-root, [role="alert"]');
    await expect(validationErrors.first()).toBeVisible();
  });
}); 