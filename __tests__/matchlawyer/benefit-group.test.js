const { test, expect } = require('@playwright/test');
const { prisma, clearTestData } = require('../setup/testSetup');
const { buildUrl, login, waitForPageLoad, waitForElement, waitForElementHidden } = require('../utils/testHelpers');
const { addRoles, addDefaultMenus, addBenefitTypes } = require('../utils/dbInit');

test.describe('MatchLawyer 权益分组管理', () => {
  let adminCookie;
  
  // 在所有测试前初始化数据并登录
  test.beforeAll(async ({ browser }) => {
    console.log('🚀 开始初始化权益分组测试数据...');
    
    // 清空测试数据
    await clearTestData();

    // 初始化权限数据
    const roles = await addRoles();
    const menus = await addDefaultMenus(roles);
    const benefitTypes = await addBenefitTypes();
    
    // 验证数据库中的数据
    const roles_in_db = await prisma.employeeRoles.findMany();
    expect(roles_in_db).toHaveLength(3);
    
    const menus_in_db = await prisma.menuSetting.findMany();
    expect(menus_in_db).toHaveLength(13); // 7个一级菜单 + 6个子菜单

    const benefitTypes_in_db = await prisma.benefitType.findMany();
    expect(benefitTypes_in_db).toHaveLength(4);

    // 获取admin cookie
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await login(adminPage);
    
    const adminCookies = await adminContext.cookies();
    adminCookie = adminCookies.find(cookie => cookie.name === 'token' || cookie.name.includes('auth'));
    
    await adminContext.close();
    
    console.log('✅ 权益分组测试数据初始化完成');
  });

  test('1. 验证可以创建权益组并添加权益项', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问权益分组页面
    await page.goto(buildUrl('/matchlawyer/benefit/group'));
    await waitForPageLoad(page);
    
    // 验证页面标题
    await expect(page.locator('[data-testid="page-title"]')).toContainText('权益分组管理');
    
    // 找到"标题"输入框，填入"一星会员"
    await page.fill('[data-testid="group-title-input"]', '一星会员');
    
    // 在使用对象下拉菜单选择"律师"
    await page.getByRole('combobox', { name: '适用对象选择框' }).click();
    await page.getByRole('option', { name: '律师' }).click();
    
    // 点击"增加权益组"按钮
    await page.click('[data-testid="add-group-button"]');
    
    // 验证页面上是否有一个label，内容为"权益组：一星会员 (适用：律师, 总价：¥0)"
    await expect(page.locator('[data-testid="group-title-label"]')).toContainText('权益组：一星会员 (适用：律师, 总价：¥0)');
    
    // 找到"为当前权益组增加权益项"的div
    const addBenefitSection = page.locator('[data-testid="add-benefit-item-section"]');
    await expect(addBenefitSection).toBeVisible();
    
    // 在"权益类型"下拉框选择"会议（收费）"
    await page.getByRole('combobox', { name: '权益类型选择框' }).click();
    await page.getByRole('option', { name: '会议 (收费)' }).click();
    
    // 次数输入3
    await page.fill('[data-testid="benefit-times-input"]', '3');
    
    // 价格为100
    await page.fill('[data-testid="benefit-price-input"]', '100');
    
    // 点击"添加到权益组"按钮
    await page.click('[data-testid="add-to-group-button"]');
    
    // 等待页面更新
    await page.waitForTimeout(200);
    
    // 验证"会议（收费）"，3次，¥100展示在页面中
    await expect(page.locator('text=会议 (收费)')).toBeVisible();
    await expect(page.locator('text=3次')).toBeVisible();
//    await expect(page.locator('text=¥100')).toBeVisible();
    
    // 验证这些内容属于同一个MuiCardContent-root class的div
    const cardContent = page.locator('.MuiCardContent-root').first();
    await expect(cardContent.locator('text=会议 (收费)')).toBeVisible();
    await expect(cardContent.locator('text=3次')).toBeVisible();
//    await expect(cardContent.locator('text=¥100')).toBeVisible();
    
    // 在"权益类型"下拉框选择"培训（收费）"
    await page.getByRole('combobox', { name: '权益类型选择框' }).click();
    await page.getByRole('option', { name: '培训 (收费)' }).click();
    
    // 次数输入2
    await page.fill('[data-testid="benefit-times-input"]', '2');
    
    // 价格为200
    await page.fill('[data-testid="benefit-price-input"]', '200');
    
    // 点击"增加权益项"按钮
    await page.click('[data-testid="add-benefit-item-button"]');
    
    // 等待页面更新
    await page.waitForTimeout(1000);
    
    // 验证"培训（收费）"，2次，¥200显示在页面上
    await expect(page.locator('text=培训 (收费)')).toBeVisible();
    await expect(page.locator('text=2次')).toBeVisible();
//    await expect(page.locator('text=¥200')).toBeVisible();
    
    // 验证label的内容为"权益组：一星会员 (适用：律师, 总价：¥300)"
    await expect(page.locator('[data-testid="group-title-label"]')).toContainText('权益组：一星会员 (适用：律师, 总价：¥300)');
  });
  
  test('2. 验证BenefitGroup表的数据', async () => {
    // 验证BenefitGroup表中有2个数据
    const benefitGroups = await prisma.benefitGroup.findMany({
      where: {
        title: '一星会员'
      },
      include: {
        benefitType: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    expect(benefitGroups).toHaveLength(2);
    
    // 验证第一个数据：会议
    const meetingGroup = benefitGroups[0];
    expect(meetingGroup.title).toBe('一星会员');
    expect(meetingGroup.benefitTypeId).toBe('000001');
    expect(meetingGroup.times).toBe(3);
    expect(meetingGroup.price.toString()).toBe('100');
    expect(meetingGroup.notShow).toBe(false);
    expect(meetingGroup.forWhom).toBe('律师');
    expect(meetingGroup.benefitType.title).toBe('会议');
    
    // 验证第二个数据：培训
    const trainingGroup = benefitGroups[1];
    expect(trainingGroup.title).toBe('一星会员');
    expect(trainingGroup.benefitTypeId).toBe('000002');
    expect(trainingGroup.times).toBe(2);
    expect(trainingGroup.price.toString()).toBe('200');
    expect(trainingGroup.notShow).toBe(false);
    expect(trainingGroup.forWhom).toBe('律师');
    expect(trainingGroup.benefitType.title).toBe('培训');
  });
}); 