import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, password } = req.body;

    // 验证必填字段
    if (!phone || !password) {
      return res.status(400).json({ 
        error: '手机号和密码不能为空',
        details: [
          !phone ? '手机号不能为空' : null,
          !password ? '密码不能为空' : null
        ].filter(Boolean)
      });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        error: '手机号格式不正确',
        details: ['请输入11位有效的手机号码']
      });
    }

    // 根据手机号查询用户
    const member = await prisma.member.findFirst({
      where: {
        phone: phone,
        isStopped: false // 确保用户未被停用
      }
    });

    // 用户不存在
    if (!member) {
      return res.status(401).json({ 
        error: '登录失败',
        details: ['手机号或密码错误']
      });
    }

    // 验证用户状态
    if (member.status === 0) {
      return res.status(401).json({ 
        error: '登录失败',
        details: ['账户尚未通过审核，请联系管理员']
      });
    }

    // 验证密码（密码是加密存储的）
    const isPasswordValid = await bcrypt.compare(password, member.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: '登录失败',
        details: ['手机号或密码错误']
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        memberId: member.id,
        phone: member.phone,
        name: member.name,
        type: member.type,
        benefitGroup: member.benefitGroup
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' } // token有效期7天
    );

    // 更新最后更新时间
    await prisma.member.update({
      where: { id: member.id },
      data: { 
        updatedAt: new Date()
      }
    });

    // 返回成功响应
    res.status(200).json({
      message: '登录成功',
      data: {
        token: token,
        member: {
          id: member.id,
          name: member.name,
          type: member.type,
          phone: member.phone,
          email: member.email,
          benefitGroup: member.benefitGroup,
          isPaid: member.isPaid,
          status: member.status
        }
      }
    });

  } catch (error) {
    console.error('客户登录错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      details: ['登录过程中发生错误，请稍后重试']
    });
  }
}
