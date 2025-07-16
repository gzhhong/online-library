import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, password, roleId, status } = req.body;

    // 验证必填字段
    if (!name || !email || !phone || !roleId || !password) {
      return res.status(400).json({ error: '姓名、邮箱、手机号、密码和角色都是必填的' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式无效' });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '手机号格式无效' });
    }

    // 检查邮箱是否已存在
    const existingEmail = await prisma.employee.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(400).json({ error: '邮箱已被使用' });
    }

    // 检查手机号是否已存在
    const existingPhone = await prisma.employee.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      return res.status(400).json({ error: '手机号已被使用' });
    }

    // 检查角色是否存在
    const existingRole = await prisma.employeeRoles.findUnique({
      where: { id: parseInt(roleId) }
    });

    if (!existingRole) {
      return res.status(400).json({ error: '选择的角色不存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建员工
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        roleId: parseInt(roleId),
        status: status !== undefined ? parseInt(status) : 1
      },
      include: {
        role: true
      }
    });

    // 返回数据时不包含密码
    const { password: _, ...employeeWithoutPassword } = employee;

    res.status(201).json({
      message: '员工创建成功',
      data: employeeWithoutPassword
    });

  } catch (error) {
    console.error('创建员工错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 