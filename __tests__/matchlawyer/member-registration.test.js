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
  
  test('5. 验证Member数据库内容与输入一致', async () => {
    // 查询数据库中的成员信息
    const members = await prisma.member.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📊 Member数据库信息:');
    console.log(`总共有 ${members.length} 个成员`);
    
    members.forEach((member, index) => {
      console.log(`\n成员 ${index + 1}:`);
      console.log(`  - ID: ${member.id}`);
      console.log(`  - 姓名: ${member.name}`);
      console.log(`  - 类型: ${member.type}`);
      console.log(`  - 权益分组ID: ${member.benefitGroup}`);
      console.log(`  - 邮箱: ${member.email}`);
      console.log(`  - 手机号: ${member.phone}`);
      console.log(`  - 证件号: ${member.idNumber}`);
      console.log(`  - 工作单位: ${member.company || '无'}`);
      console.log(`  - 状态: ${member.status}`);
      console.log(`  - 是否付费: ${member.isPaid}`);
      console.log(`  - 创建时间: ${member.createdAt}`);
    });
    
    // 验证有两个成员
    expect(members).toHaveLength(2);
    
    // 验证律师成员信息
    const lawyerMember = members.find(m => m.name === '张三');
    expect(lawyerMember).toBeDefined();
    expect(lawyerMember.type).toBe('律师');
    expect(lawyerMember.email).toBe('zhangsanlvshi@test.com');
    expect(lawyerMember.phone).toBe('13900000000');
    expect(lawyerMember.idNumber).toBe('823981928398');
    expect(lawyerMember.status).toBe(0); // 待审核
    expect(lawyerMember.isPaid).toBe(false);
    
    // 验证企业成员信息
    const companyMember = members.find(m => m.name === '测试技术公司');
    expect(companyMember).toBeDefined();
    expect(companyMember.type).toBe('企业');
    expect(companyMember.email).toBe('ceshiqiye@test.com');
    expect(companyMember.phone).toBe('15900000000');
    expect(companyMember.idNumber).toBe('923892839');
    expect(companyMember.status).toBe(0); // 待审核
    expect(companyMember.isPaid).toBe(false);
    
    // 验证权益分组ID是否正确存储（应该是groupId而不是title）
    // 查询BenefitGroup表获取groupId和title的对应关系
    const benefitGroups = await prisma.benefitGroup.findMany({
      select: {
        groupId: true,
        title: true,
        forWhom: true
      },
      orderBy: [
        { groupId: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    // 按groupId分组，去重
    const groupedGroups = {};
    benefitGroups.forEach(group => {
      if (!groupedGroups[group.groupId]) {
        groupedGroups[group.groupId] = {
          groupId: group.groupId,
          title: group.title,
          forWhom: group.forWhom
        };
      }
    });
    
    console.log('\n📋 BenefitGroup信息:');
    Object.values(groupedGroups).forEach((group, index) => {
      console.log(`  ${index + 1}. groupId: ${group.groupId}, title: ${group.title}, forWhom: ${group.forWhom}`);
    });
    
    // 验证律师成员的权益分组ID
    const lawyerGroup = Object.values(groupedGroups).find(g => g.title === '一星会员' && g.forWhom === '律师');
    expect(lawyerGroup).toBeDefined();
    expect(lawyerMember.benefitGroup).toBe(lawyerGroup.groupId);
    console.log(`\n✅ 律师成员权益分组验证: 存储的ID=${lawyerMember.benefitGroup}, 期望的ID=${lawyerGroup.groupId}`);
    
    // 验证企业成员的权益分组ID
    const companyGroup = Object.values(groupedGroups).find(g => g.title === '免费会员' && g.forWhom === '企业');
    expect(companyGroup).toBeDefined();
    expect(companyMember.benefitGroup).toBe(companyGroup.groupId);
    console.log(`✅ 企业成员权益分组验证: 存储的ID=${companyMember.benefitGroup}, 期望的ID=${companyGroup.groupId}`);
    
    // 验证存储的不是title而是groupId
    expect(lawyerMember.benefitGroup).not.toBe('一星会员');
    expect(companyMember.benefitGroup).not.toBe('免费会员');
    console.log('\n✅ 验证通过: Member表中存储的是groupId而不是title');
  });
}); 