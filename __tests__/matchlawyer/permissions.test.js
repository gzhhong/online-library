const { test, expect } = require('@playwright/test');
const { prisma, clearTestData } = require('../setup/testSetup');
const { buildUrl, login, waitForPageLoad, waitForElement, waitForElementHidden } = require('../utils/testHelpers');
const { addRoles, addDefaultMenus } = require('../utils/dbInit');

test.describe('MatchLawyer 权限验证', () => {
  let adminCookie;
  let operatorCookie;
  
  // 在所有测试前初始化数据并登录
  test.beforeAll(async ({ browser }) => {
    console.log('🚀 开始初始化权限数据...');
    
    // 清空测试数据
    await clearTestData();

    // 初始化权限数据
    const roles = await addRoles();
    const menus = await addDefaultMenus(roles);
    
    // 验证数据库中的数据
    const roles_in_db = await prisma.employeeRoles.findMany();
    expect(roles_in_db).toHaveLength(3);
    
    const menus_in_db = await prisma.menuSetting.findMany();
    expect(menus_in_db).toHaveLength(13); // 7个一级菜单 + 6个子菜单

    // 获取admin cookie
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await login(adminPage);
    
    const adminCookies = await adminContext.cookies();
    adminCookie = adminCookies.find(cookie => cookie.name === 'token' || cookie.name.includes('auth'));
    
    await adminContext.close();
    
    console.log('✅ 权限数据初始化完成');
  });


  test('1. 验证员工管理页面可以添加员工', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问员工管理页面
    await page.goto(buildUrl('/matchlawyer/settings/employee'));
    await waitForPageLoad(page);
    
    // 验证页面标题
    await expect(page.locator('[data-testid="page-title"]')).toContainText('员工管理');
    
    // 点击"新增员工"按钮
    await page.click('[data-testid="add-employee-button"]');
    
    // 等待对话框出现
    await waitForElement(page, '[data-testid="employee-dialog"]');
    
    // 填写员工信息
    await page.fill('[data-testid="employee-name-input"]', '张三');
    await page.fill('[data-testid="employee-email-input"]', 'zhangsan@test.com');
    await page.fill('[data-testid="employee-phone-input"]', '13100000000');
    await page.fill('[data-testid="employee-password-input"]', 'abcd1234');
    
    // 选择角色 - 直接设置值
    const adminRole = await prisma.employeeRoles.findFirst({ where: { name: 'admin' } });
    console.log(adminRole);
    await page.getByRole('combobox', { name: '员工角色选择框' }).click();
    await page.getByRole('option', { name: 'admin - 最高权限' }).click();
    // 点击保存按钮
    await page.click('[data-testid="save-button"]');
    
    // 等待对话框关闭
    await waitForElementHidden(page, '[data-testid="employee-dialog"]');
    
    // 验证员工已添加
    await expect(page.locator('text=张三')).toBeVisible();
    await expect(page.locator('text=zhangsan@test.com')).toBeVisible();
    // 验证数据库中的员工数据
    const employees = await prisma.employee.findMany();
    expect(employees).toHaveLength(1);
    expect(employees[0].name).toBe('张三');
    expect(employees[0].email).toBe('zhangsan@test.com');
    expect(employees[0].phone).toBe('13100000000');
    expect(employees[0].roleId).toBe(adminRole.id);
  });
  
  test('2. 验证可以添加李四员工', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问员工管理页面
    await page.goto(buildUrl('/matchlawyer/settings/employee'));
    await waitForPageLoad(page);
    
    // 点击"新增员工"按钮
    await page.click('[data-testid="add-employee-button"]');
    
    // 等待对话框出现
    await waitForElement(page, '[data-testid="employee-dialog"]');
    
    // 填写员工信息
    await page.fill('[data-testid="employee-name-input"]', '李四');
    await page.fill('[data-testid="employee-email-input"]', 'lisi@test.com');
    await page.fill('[data-testid="employee-phone-input"]', '13200000000');
    await page.fill('[data-testid="employee-password-input"]', 'abcd1234');
    
    // 选择角色 - 直接设置值
    const operatorRole = await prisma.employeeRoles.findFirst({ where: { name: 'operator' } });
    await page.getByRole('combobox', { name: '员工角色选择框' }).click();
    await page.getByRole('option', { name: 'operator - 运营权限' }).click();
    
    // 点击保存按钮
    await page.click('[data-testid="save-button"]');
    
    // 等待对话框关闭
    await waitForElementHidden(page, '[data-testid="employee-dialog"]');
    
    // 验证员工已添加
    await expect(page.locator('text=李四')).toBeVisible();
    await expect(page.locator('text=lisi@test.com')).toBeVisible();
    // 验证数据库中的员工数据
    const employees = await prisma.employee.findMany();
    expect(employees).toHaveLength(2);
    expect(employees[1].name).toBe('李四');
    expect(employees[1].email).toBe('lisi@test.com');
    expect(employees[1].phone).toBe('13200000000');
    expect(employees[1].roleId).toBe(operatorRole.id);
  });
  
  test('3. 验证菜单设置页面显示正确的菜单项', async ({ page }) => {
    // 设置认证cookie
    
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问菜单设置页面
    await page.goto(buildUrl('/matchlawyer/settings/menusetting'));
    await waitForPageLoad(page);
    
    // 验证菜单项存在
    await expect(page.getByTestId('menu-item-Setting')).toBeVisible();
    await expect(page.getByTestId('menu-item-Tag Management')).toBeVisible();
    await expect(page.getByTestId('menu-item-Member')).toBeVisible();
    
  });
  
  test('4. 验证张三（admin）可以看到Setting菜单', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问industries页面
    await page.goto(buildUrl('/matchlawyer/industries'));
    await waitForPageLoad(page);
    
    // 验证Setting菜单项存在
    await expect(page.locator('[data-testid="menu-item-Setting"]')).toBeVisible();
  });
  
  test('5. 验证李四（operator）看不到Setting菜单', async ({ page }) => {
    // 设置认证cookie
    
    // 获取admin cookie
    await page.goto(buildUrl('/matchlawyer/login'));
    
    // 等待页面加载
    await waitForPageLoad(page);
    
    // 填写登录表单
    await page.fill('[data-testid="email-input"]', 'lisi@test.com');
    await page.fill('[data-testid="password-input"]', 'abcd1234');
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]');
    
    // 等待页面跳转
    await page.waitForURL('**/matchlawyer/industries');

    await expect(page.getByTestId('menu-item-Setting')).not.toBeVisible();
    await expect(page.getByTestId('menu-item-Tag Management')).toBeVisible();
    await expect(page.getByTestId('menu-item-Member')).toBeVisible();
  });
}); 