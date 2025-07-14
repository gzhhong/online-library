import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Member validation handler started');

  try {
    const { 
      type, 
      name, 
      idNumber, 
      benefitType, 
      description, 
      email, 
      phone, 
      company, 
      industryIds 
    } = req.body;

    const errors = [];

    // 验证必填字段
    if (!type) errors.push('会员类型是必填字段');
    if (!name) errors.push('名称是必填字段');
    if (!idNumber) errors.push('ID是必填字段');
    if (!benefitType) errors.push('权益类型是必填字段');
    if (!email) errors.push('邮箱是必填字段');
    if (!phone) errors.push('手机号是必填字段');

    // 验证会员类型
    if (type && !['企业', '律师'].includes(type)) {
      errors.push('会员类型必须是"企业"或"律师"');
    }

    // 验证权益类型
    if (benefitType && !['免费', '1级会员', '2级会员', '3级会员'].includes(benefitType)) {
      errors.push('权益类型无效');
    }

    // 验证邮箱格式
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('邮箱格式无效');
      }
    }

    // 验证手机号格式
    if (phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('手机号格式无效，请输入11位数字');
      }
    }

    // 验证文字信息长度
    if (description && description.length > 2000) {
      errors.push('会员文字信息不能超过2000个字符');
    }

    // 验证律师必须选择行业标签
    if (type === '律师') {
      if (!industryIds || !Array.isArray(industryIds) || industryIds.length === 0) {
        errors.push('律师必须选择行业标签');
      }
    }

    // 检查ID是否已存在（仅在新注册时检查）
    if (idNumber) {
      const existingMember = await prisma.member.findUnique({
        where: { idNumber }
      });

      if (existingMember) {
        errors.push('该ID已存在');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: '验证失败',
        details: errors 
      });
    }

    // 验证通过
    res.status(200).json({ 
      message: '验证通过',
      valid: true 
    });

  } catch (error) {
    console.error('验证错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 