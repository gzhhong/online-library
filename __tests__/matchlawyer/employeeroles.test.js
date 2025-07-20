const { test, expect } = require('@playwright/test');
const { prisma, clearTestData } = require('../setup/testSetup');
const { buildUrl, login, waitForPageLoad, waitForElement, waitForElementHidden } = require('../utils/testHelpers');

test.describe('MatchLawyer 员工角色管理', () => {
  let authCookie;
  
  // 在所有测试前清空数据并登录
  test.beforeAll(async ({ browser }) => {
    // 清空测试数据
    await clearTestData();
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 使用工具函数登录
    await login(page);
    
    // 获取认证cookie
    const cookies = await context.cookies();
    authCookie = cookies.find(cookie => cookie.name === 'token' || cookie.name.includes('auth'));
    
    await context.close();
  });
  
  test('1. 应该能够访问员工角色管理页面', async ({ page }) => {
    // 设置认证cookie
    if (authCookie) {
      await page.context().addCookies([authCookie]);
    }
    
    // 访问员工角色管理页面
    await page.goto(buildUrl('/matchlawyer/settings/employeeroles'));
    
    // 等待页面加载
    await waitForPageLoad(page);
    
    // 验证页面标题
    await expect(page.locator('[data-testid="page-title"]')).toContainText('角色设置');
  });
  
  test('2. 应该能够添加admin角色', async ({ page }) => {
    // 设置认证cookie
    if (authCookie) {
      await page.context().addCookies([authCookie]);
    }
    
    // 访问员工角色管理页面
    await page.goto(buildUrl('/matchlawyer/settings/employeeroles'));
    await waitForPageLoad(page);
    
    // 点击"新增角色"按钮
    await page.click('[data-testid="add-role-button"]');
    
    // 等待对话框出现
    await page.waitForSelector('[data-testid="role-dialog"]');
    
    // 填写角色信息
    await page.fill('[data-testid="role-name-input"]', 'admin');
    await page.fill('[data-testid="role-description-input"]', '最高权限');
    
    // 点击保存按钮
    await page.click('[data-testid="save-button"]');
    
    // 等待对话框关闭
    await page.waitForSelector('[data-testid="role-dialog"]', { state: 'hidden' });
    
    // 验证角色已添加
    await expect(page.locator('text=admin')).toBeVisible();
    await expect(page.locator('text=最高权限')).toBeVisible();
  });
  
  test('3. 应该能够添加operator角色', async ({ page }) => {
    // 设置认证cookie
    if (authCookie) {
      await page.context().addCookies([authCookie]);
    }
    
    // 访问员工角色管理页面
    await page.goto(buildUrl('/matchlawyer/settings/employeeroles'));
    await waitForPageLoad(page);
    
    // 点击"新增角色"按钮
    await page.click('[data-testid="add-role-button"]');
    
    // 等待对话框出现
    await page.waitForSelector('[data-testid="role-dialog"]');
    
    // 填写角色信息
    await page.fill('[data-testid="role-name-input"]', 'operator');
    await page.fill('[data-testid="role-description-input"]', '运维权限');
    
    // 点击保存按钮
    await page.click('[data-testid="save-button"]');
    
    // 等待对话框关闭
    await page.waitForSelector('[data-testid="role-dialog"]', { state: 'hidden' });
    
    // 验证角色已添加
    await expect(page.locator('text=operator')).toBeVisible();
    await expect(page.locator('text=运维权限')).toBeVisible();
  });
  
  test('4. 应该能够添加user角色', async ({ page }) => {
    // 设置认证cookie
    if (authCookie) {
      await page.context().addCookies([authCookie]);
    }
    
    // 访问员工角色管理页面
    await page.goto(buildUrl('/matchlawyer/settings/employeeroles'));
    await waitForPageLoad(page);
    
    // 点击"新增角色"按钮
    await page.click('[data-testid="add-role-button"]');
    
    // 等待对话框出现
    await page.waitForSelector('[data-testid="role-dialog"]');
    
    // 填写角色信息
    await page.fill('[data-testid="role-name-input"]', 'user');
    await page.fill('[data-testid="role-description-input"]', '普通权限');
    
    // 点击保存按钮
    await page.click('[data-testid="save-button"]');
    
    // 等待对话框关闭
    await page.waitForSelector('[data-testid="role-dialog"]', { state: 'hidden' });
    
    // 验证角色已添加
    await expect(page.locator('text=user')).toBeVisible();
    await expect(page.locator('text=普通权限')).toBeVisible();
  });
  
  test('5. 应该能够验证所有角色都出现在页面上', async ({ page }) => {
    // 设置认证cookie
    if (authCookie) {
      await page.context().addCookies([authCookie]);
    }
    
    // 访问员工角色管理页面
    await page.goto(buildUrl('/matchlawyer/settings/employeeroles'));
    await waitForPageLoad(page);
    
    // 验证所有角色都存在
    await expect(page.locator('text=admin')).toBeVisible();
    await expect(page.locator('text=operator')).toBeVisible();
    await expect(page.locator('text=user')).toBeVisible();
    
    // 验证角色描述都存在
    await expect(page.locator('text=最高权限')).toBeVisible();
    await expect(page.locator('text=运维权限')).toBeVisible();
    await expect(page.locator('text=普通权限')).toBeVisible();
  });
  
  test('6. 应该能够验证数据库中的角色数据', async () => {
    // 验证数据库中的角色
    const roles = await prisma.employeeRoles.findMany({
      where: {
        name: {
          in: ['admin', 'operator', 'user']
        }
      },
      orderBy: { name: 'asc' }
    });
    
    expect(roles).toHaveLength(3);
    
    // 验证admin角色
    const adminRole = roles.find(role => role.name === 'admin');
    expect(adminRole).toBeDefined();
    expect(adminRole.description).toBe('最高权限');
    
    // 验证operator角色
    const operatorRole = roles.find(role => role.name === 'operator');
    expect(operatorRole).toBeDefined();
    expect(operatorRole.description).toBe('运维权限');
    
    // 验证user角色
    const userRole = roles.find(role => role.name === 'user');
    expect(userRole).toBeDefined();
    expect(userRole.description).toBe('普通权限');
  });
}); 