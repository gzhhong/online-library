import { prisma } from '@/lib/db';
import { generateToken, generateTokenWithRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // 首先检查环境变量中的管理员账户
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = generateToken({ isAdmin: true });
      
      // 设置cookie
      res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=${30 * 60}`);
      
      return res.status(200).json({ success: true });
    }

    // 然后检查employee表中的用户
    const employee = await prisma.employee.findUnique({
      where: { email },
      include: {
        role: true
      }
    });

    if (!employee) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 验证密码（假设密码是加密存储的）
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 检查员工状态
    if (employee.status !== 1) {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    // 生成包含角色信息的token
    const token = generateTokenWithRole({
      userId: employee.id,
      role: employee.role.name,
      roleId: employee.role.id,
      email: employee.email
    });
    
    // 设置cookie
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; Max-Age=${30 * 60}`);
    
    return res.status(200).json({ 
      success: true,
      role: employee.role.name
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
} 