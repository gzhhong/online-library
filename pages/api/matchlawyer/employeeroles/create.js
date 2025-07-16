import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, description } = req.body;

    // 验证必填字段
    if (!name || !description) {
      return res.status(400).json({ error: '角色名称和描述都是必填字段' });
    }

    // 检查角色名称是否已存在
    const existingRole = await prisma.employeeRoles.findUnique({
      where: { name }
    });

    if (existingRole) {
      return res.status(400).json({ error: '角色名称已存在' });
    }

    // 创建角色
    const employeeRole = await prisma.employeeRoles.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      message: '角色创建成功',
      data: employeeRole
    });

  } catch (error) {
    console.error('创建员工角色错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 