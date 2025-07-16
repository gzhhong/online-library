import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const employees = await prisma.employee.findMany({
      include: {
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 格式化数据，不返回密码
    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      status: employee.status,
      roleId: employee.roleId,
      roleName: employee.role.name,
      roleDescription: employee.role.description,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    }));

    res.status(200).json({
      data: formattedEmployees,
      total: formattedEmployees.length
    });

  } catch (error) {
    console.error('获取员工列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 