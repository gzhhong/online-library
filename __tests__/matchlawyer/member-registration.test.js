const { test, expect } = require('@playwright/test');
const { prisma, clearTestData } = require('../setup/testSetup');
const { buildUrl, login, waitForPageLoad, waitForElement, waitForElementHidden } = require('../utils/testHelpers');
const { addRoles, addDefaultMenus, addBenefitTypes, addBenefitGroups } = require('../utils/dbInit');

test.describe('MatchLawyer 会员注册', () => {
  let adminCookie;
  
  // 在所有测试前初始化数据并登录
  test.beforeAll(async ({ browser }) => {
    console.log('🚀 开始初始化会员注册测试数据...');
    
    // 清空测试数据
    await clearTestData();

    // 初始化权限数据
    const roles = await addRoles();
    const menus = await addDefaultMenus(roles);
    const benefitTypes = await addBenefitTypes();
    const benefitGroups = await addBenefitGroups();
    
    // 获取admin cookie
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await login(adminPage);
    
    const adminCookies = await adminContext.cookies();
    adminCookie = adminCookies.find(cookie => cookie.name === 'token' || cookie.name.includes('auth'));
    
    await adminContext.close();
    
    console.log('✅ 会员注册测试数据初始化完成');
  });

  test('1. 验证可以注册律师会员', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问注册页面
    await page.goto(buildUrl('/matchlawyer/register'));
    await waitForPageLoad(page);
    
    // 在成员类型下拉框选择"律师"
    await page.getByRole('combobox', { name: '成员类型选择框' }).click();
    await page.getByRole('option', { name: '律师' }).click();
    
    // 在权益类型下拉框选择"一星会员"
    await page.getByRole('combobox', { name: '权益类型选择框' }).click();
    await page.getByRole('option', { name: '一星会员' }).click();
    
    // 律师姓名填写"张三"
    await page.fill('[data-testid="member-name-input"]', '张三');
    
    // 执业资格号填写823981928398
    await page.fill('[data-testid="member-id-input"]', '823981928398');
    
    // 邮箱填写zhangsanlvshi@test.com
    await page.fill('[data-testid="member-email-input"]', 'zhangsanlvshi@test.com');
    
    // 手机号填写13900000000
    await page.fill('[data-testid="member-phone-input"]', '13900000000');
    
    // 行业标签选择"法学"
    await page.locator('text=法学').click();
    
    // 点击"提交注册"
    await page.click('[data-testid="submit-register-button"]');
    
    // 等待提交完成
    await page.waitForTimeout(2000);
    
    // 验证注册成功（可以通过成功消息来验证）
    await expect(page.locator('text=注册成功，等待审核')).toBeVisible();
  });
  
  test('2. 验证可以注册企业会员', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问注册页面
    await page.goto(buildUrl('/matchlawyer/register'));
    await waitForPageLoad(page);
    
    // 在成员类型下拉框选择"企业"
    await page.getByRole('combobox', { name: '成员类型选择框' }).click();
    await page.getByRole('option', { name: '企业' }).click();
    
    // 验证权益类型下拉框只有"免费会员"一个选项
    await page.getByRole('combobox', { name: '权益类型选择框' }).click();
    const options = await page.locator('[role="option"]').all();
    expect(options).toHaveLength(1);
    await expect(page.locator('[role="option"]').first()).toContainText('免费会员');
    
    // 选择"免费会员"
    await page.locator('[role="option"]').first().click();
    
    // 企业名称填写"测试技术公司"
    await page.fill('[data-testid="member-name-input"]', '测试技术公司');
    
    // 纳税号填写923892839
    await page.fill('[data-testid="member-id-input"]', '923892839');
    
    // 邮箱填写ceshiqiye@test.com
    await page.fill('[data-testid="member-email-input"]', 'ceshiqiye@test.com');
    
    // 手机号填写15900000000
    await page.fill('[data-testid="member-phone-input"]', '15900000000');
    
    // 点击"提交注册"
    await page.click('[data-testid="submit-register-button"]');
    
    // 等待提交完成
    await page.waitForTimeout(2000);
    
    // 验证注册成功
    await expect(page.locator('text=注册成功，等待审核')).toBeVisible();
  });
  
  test('3. 验证会员列表显示正确', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问会员列表页面
    await page.goto(buildUrl('/matchlawyer/members'));
    await waitForPageLoad(page);
    
    // 验证页面上显示两个条目
    await expect(page.locator('[data-testid="members-table"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="member-name-1"]')).toContainText('张三');
    await expect(page.locator('[data-testid="member-type-1"]')).toContainText('律师');
    await expect(page.locator('[data-testid="member-benefit-1"]')).toContainText('一星会员');
    await expect(page.locator('[data-testid="member-paid-1"]')).toContainText('未付费');
    await expect(page.locator('[data-testid="member-status-1"]')).toContainText('待审核');
    
    await expect(page.locator('[data-testid="member-name-0"]')).toContainText('测试技术公司');
    await expect(page.locator('[data-testid="member-type-0"]')).toContainText('企业');
    await expect(page.locator('[data-testid="member-benefit-0"]')).toContainText('免费会员');
    await expect(page.locator('[data-testid="member-status-0"]')).toContainText('待审核');
  });
  
  test('4. 验证删除权益组功能', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问权益分组页面
    await page.goto(buildUrl('/matchlawyer/benefit/group'));
    await waitForPageLoad(page);
    
    // 找到label为"权益组：免费会员 (适用：企业, 总价：¥0)"的组
    const targetGroup = page.locator('[data-testid="group-title-label"]').filter({ hasText: '权益组：免费会员 (适用：企业, 总价：¥0)' });
    await expect(targetGroup).toBeVisible();
    
    // 找到该组旁边的"删除组"按钮
    const deleteButton = targetGroup.locator('xpath=../..').locator('[data-testid="delete-group-button"]');
    await expect(deleteButton).toBeVisible();
    
    // 点击删除组按钮
    await deleteButton.click();
    
    // 在确认对话框中点击"OK"
    page.on('dialog', dialog => dialog.accept());
    
    // 等待删除操作完成
    await page.waitForTimeout(2000);
    
    // 验证被删除的权益组仍然显示在页面上（说明删除失败）
    await expect(targetGroup).toBeVisible();
  });
}); 