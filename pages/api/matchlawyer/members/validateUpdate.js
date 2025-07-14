import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Member update validation handler started');

  try {
    const { 
      id,
      benefitType, 
      description, 
      email, 
      phone 
    } = req.body;

    const errors = [];

    if (!id) {
      errors.push('会员ID是必需的');
    }

    // 检查会员是否存在
    if (id) {
      const existingMember = await prisma.member.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingMember) {
        errors.push('会员不存在');
      }
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