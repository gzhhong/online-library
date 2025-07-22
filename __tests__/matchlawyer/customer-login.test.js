const { test, expect } = require('@playwright/test');
const { prisma, clearTestData } = require('../setup/testSetup');
const { buildUrl, waitForPageLoad } = require('../utils/testHelpers');
const { addBenefitGroups } = require('../utils/dbInit');
const bcrypt = require('bcryptjs');

test.describe('MatchLawyer 客户登录', () => {
  
  test.beforeAll(async () => {
    console.log('🚀 开始初始化客户登录测试数据...');
    
    // 清空测试数据
    await clearTestData();

    // 初始化权益分组数据
    const benefitGroups = await addBenefitGroups();
    
    console.log('✅ 客户登录测试数据初始化完成');
  });

  test('1. 验证客户登录接口 - 成功登录', async ({ request }) => {
    // 先创建一个测试会员
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testMember = await prisma.member.create({
      data: {
        type: '律师',
        name: '测试律师',
        idNumber: '123456789',
        benefitGroup: '一星会员',
        email: 'test@example.com',
        phone: '13900000001',
        password: hashedPassword,
        status: 1, // 已审核
        isStopped: false
      }
    });

    // 调用登录接口
    const response = await request.post(buildUrl('/api/matchlawyer/customer/login'), {
      data: {
        phone: '13900000001',
        password: 'test123'
      }
    });

    // 验证响应状态
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    
    // 验证响应结构
    expect(result.message).toBe('登录成功');
    expect(result.data).toHaveProperty('token');
    expect(result.data).toHaveProperty('member');
    
    // 验证会员信息
    expect(result.data.member.id).toBe(testMember.id);
    expect(result.data.member.name).toBe('测试律师');
    expect(result.data.member.phone).toBe('13900000001');
    expect(result.data.member.type).toBe('律师');
    expect(result.data.member.status).toBe(1);
  });

  test('2. 验证客户登录接口 - 手机号不存在', async ({ request }) => {
    const response = await request.post(buildUrl('/api/matchlawyer/customer/login'), {
      data: {
        phone: '13900000099',
        password: 'test123'
      }
    });

    expect(response.status()).toBe(401);
    
    const result = await response.json();
    expect(result.error).toBe('登录失败');
    expect(result.details).toContain('手机号或密码错误');
  });

  test('3. 验证客户登录接口 - 密码错误', async ({ request }) => {
    // 先创建一个测试会员
    const hashedPassword = await bcrypt.hash('correct123', 10);
    await prisma.member.create({
      data: {
        type: '企业',
        name: '测试企业',
        idNumber: '987654321',
        benefitGroup: '免费会员',
        email: 'company@example.com',
        phone: '13900000002',
        password: hashedPassword,
        status: 1,
        isStopped: false
      }
    });

    const response = await request.post(buildUrl('/api/matchlawyer/customer/login'), {
      data: {
        phone: '13900000002',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    
    const result = await response.json();
    expect(result.error).toBe('登录失败');
    expect(result.details).toContain('手机号或密码错误');
  });

  test('4. 验证客户登录接口 - 账户未审核', async ({ request }) => {
    // 创建一个未审核的会员
    const hashedPassword = await bcrypt.hash('test123', 10);
    await prisma.member.create({
      data: {
        type: '律师',
        name: '未审核律师',
        idNumber: '111111111',
        benefitGroup: '一星会员',
        email: 'pending@example.com',
        phone: '13900000003',
        password: hashedPassword,
        status: 0, // 未审核
        isStopped: false
      }
    });

    const response = await request.post(buildUrl('/api/matchlawyer/customer/login'), {
      data: {
        phone: '13900000003',
        password: 'test123'
      }
    });

    expect(response.status()).toBe(401);
    
    const result = await response.json();
    expect(result.error).toBe('登录失败');
    expect(result.details).toContain('账户尚未通过审核，请联系管理员');
  });

  test('5. 验证客户登录接口 - 账户已停用', async ({ request }) => {
    // 创建一个已停用的会员
    const hashedPassword = await bcrypt.hash('test123', 10);
    await prisma.member.create({
      data: {
        type: '企业',
        name: '停用企业',
        idNumber: '222222222',
        benefitGroup: '免费会员',
        email: 'stopped@example.com',
        phone: '13900000004',
        password: hashedPassword,
        status: 1,
        isStopped: true // 已停用
      }
    });

    const response = await request.post(buildUrl('/api/matchlawyer/customer/login'), {
      data: {
        phone: '13900000004',
        password: 'test123'
      }
    });

    expect(response.status()).toBe(401);
    
    const result = await response.json();
    expect(result.error).toBe('登录失败');
    expect(result.details).toContain('手机号或密码错误');
  });

  test('6. 验证客户登录接口 - 手机号格式错误', async ({ request }) => {
    const response = await request.post(buildUrl('/api/matchlawyer/customer/login'), {
      data: {
        phone: '1234567890', // 格式错误
        password: 'test123'
      }
    });

    expect(response.status()).toBe(400);
    
    const result = await response.json();
    expect(result.error).toBe('手机号格式不正确');
    expect(result.details).toContain('请输入11位有效的手机号码');
  });

  test('7. 验证客户登录接口 - 缺少必填字段', async ({ request }) => {
    const response = await request.post(buildUrl('/api/matchlawyer/customer/login'), {
      data: {
        phone: '', // 空手机号
        password: 'test123'
      }
    });

    expect(response.status()).toBe(400);
    
    const result = await response.json();
    expect(result.error).toBe('手机号和密码不能为空');
    expect(result.details).toContain('手机号不能为空');
  });

  test('8. 验证客户登录接口 - 错误请求方法', async ({ request }) => {
    const response = await request.get(buildUrl('/api/matchlawyer/customer/login'));

    expect(response.status()).toBe(405);
    
    const result = await response.json();
    expect(result.error).toBe('Method not allowed');
  });
}); 