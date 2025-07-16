import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '缺少角色ID参数' });
    }

    // 检查角色是否存在
    const existingRole = await prisma.employeeRoles.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return res.status(404).json({ error: '角色不存在' });
    }

    // 检查是否有员工正在使用这个角色（最多查找10个）
    const employeesUsingRole = await prisma.employee.findMany({
      where: { roleId: parseInt(id) },
      take: 10
    });

    if (employeesUsingRole.length > 0) {
      const employeeNames = employeesUsingRole.map(emp => emp.name).join('、');
      return res.status(400).json({ 
        error: `无法删除角色"${existingRole.name}"，该角色正在被以下员工使用：${employeeNames}` 
      });
    }

    // 删除角色
    await prisma.employeeRoles.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      message: '角色删除成功'
    });

  } catch (error) {
    console.error('删除员工角色错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 