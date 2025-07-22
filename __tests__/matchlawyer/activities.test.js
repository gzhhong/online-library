const { test, expect } = require('@playwright/test');
const { prisma, clearTestData } = require('../setup/testSetup');
const { buildUrl, login, waitForPageLoad, waitForElement } = require('../utils/testHelpers');
const { addBenefitGroups } = require('../utils/dbInit');

test.describe('MatchLawyer 活动管理', () => {
  let adminCookie;
  
  test.beforeAll(async ({ browser }) => {
    console.log('🚀 开始初始化活动管理测试数据...');
    
    // 清空测试数据
    await clearTestData();

    // 初始化权益分组数据
    const benefitGroups = await addBenefitGroups();
    
    // 获取admin cookie
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await login(adminPage);
    
    const adminCookies = await adminContext.cookies();
    adminCookie = adminCookies.find(cookie => cookie.name === 'token' || cookie.name.includes('auth'));
    
    await adminContext.close();
    
    console.log('✅ 活动管理测试数据初始化完成');
  });

  test('1. 验证可以创建免费活动', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问活动管理页面
    await page.goto(buildUrl('/matchlawyer/activities'));
    await waitForPageLoad(page);
    
    // 点击"添加活动"按钮
    await page.click('[data-testid="add-activity-button"]');
    
    // 等待对话框出现
    await waitForElement(page, '[role="dialog"]');
    
    // 填写活动信息
    await page.fill('[data-testid="activity-title-input"]', '测试免费活动');
    await page.fill('[data-testid="activity-description-input"]', '这是一个测试免费活动');
    
    // 设置开始时间（明天）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startTime = tomorrow.toISOString().slice(0, 16);
    await page.fill('[data-testid="activity-start-time-input"]', startTime);
    
    // 设置结束时间（后天）
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const endTime = dayAfterTomorrow.toISOString().slice(0, 16);
    await page.fill('[data-testid="activity-end-time-input"]', endTime);
    
    await page.fill('[data-testid="activity-location-input"]', '测试地点');
    
    // 选择权益类型为"免费活动"
    await page.getByRole('combobox', { name: '权益类型选择框' }).click();
    await page.getByRole('option', { name: '培训 (免费)' }).click();
    
    // 点击保存按钮
    await page.click('[data-testid="save-activity-button"]');
    
    // 等待对话框关闭
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // 验证活动已创建
    await expect(page.locator('text=测试免费活动')).toBeVisible();
    await expect(page.locator('text=免费')).toBeVisible();
  });

  test('2. 验证可以创建收费活动', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问活动管理页面
    await page.goto(buildUrl('/matchlawyer/activities'));
    await waitForPageLoad(page);
    
    // 点击"添加活动"按钮
    await page.click('[data-testid="add-activity-button"]');
    
    // 等待对话框出现
    await waitForElement(page, '[role="dialog"]');
    
    // 填写活动信息
    await page.fill('[data-testid="activity-title-input"]', '测试收费活动');
    await page.fill('[data-testid="activity-description-input"]', '这是一个测试收费活动');
    
    // 设置开始时间（明天）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startTime = tomorrow.toISOString().slice(0, 16);
    await page.fill('[data-testid="activity-start-time-input"]', startTime);
    
    // 设置结束时间（后天）
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const endTime = dayAfterTomorrow.toISOString().slice(0, 16);
    await page.fill('[data-testid="activity-end-time-input"]', endTime);
    
    await page.fill('[data-testid="activity-location-input"]', '测试地点');
    
    // 选择权益类型为"会议 (收费)"
    await page.getByRole('combobox', { name: '权益类型选择框' }).click();
    await page.getByRole('option', { name: '会议 (收费)' }).click();
    
    // 设置价格
    await page.fill('[data-testid="activity-price-input"]', '100');
    
    // 等待100ms让下拉框完全消失
    await page.waitForTimeout(100);
    
    // 点击保存按钮
    await page.click('[data-testid="save-activity-button"]');
    
    // 等待对话框关闭
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // 验证活动已创建
    await expect(page.locator('text=测试收费活动')).toBeVisible();
    await expect(page.locator('text=¥100')).toBeVisible();
  });

  test('3. 验证活动列表显示权益类型信息', async ({ page }) => {
    // 设置认证cookie
    if (adminCookie) {
      await page.context().addCookies([adminCookie]);
    }
    
    // 访问活动管理页面
    await page.goto(buildUrl('/matchlawyer/activities'));
    await waitForPageLoad(page);
    
    // 验证页面标题
    await expect(page.locator('[data-testid="page-title"]')).toContainText('活动管理');
    
    // 验证表格存在
    await expect(page.locator('table')).toBeVisible();
    
    // 验证表头包含权益类型相关信息
    await expect(page.locator('text=收费状态')).toBeVisible();
    
    // 打印活动数据库信息
    const activities = await prisma.activity.findMany({
      include: {
        benefitType: true,
        activityMembers: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📊 活动数据库信息:');
    console.log(`总共有 ${activities.length} 个活动`);
    
    activities.forEach((activity, index) => {
      console.log(`\n活动 ${index + 1}:`);
      console.log(`  - ID: ${activity.id}`);
      console.log(`  - 标题: ${activity.title}`);
      console.log(`  - 权益类型ID: ${activity.benefitTypeId || '无'}`);
      console.log(`  - 权益类型标题: ${activity.benefitType?.title || '无'}`);
      console.log(`  - 权益类型是否收费: ${activity.benefitType?.isPaid || false}`);
      console.log(`  - 价格: ¥${activity.price}`);
      console.log(`  - 目标群体: ${activity.targetGroups}`);
      console.log(`  - 参与成员数: ${activity.activityMembers.length}`);
      console.log(`  - 创建时间: ${activity.createdAt}`);
    });
  });
}); 