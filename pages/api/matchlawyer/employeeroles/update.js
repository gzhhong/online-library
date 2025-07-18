import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, name, description } = req.body;

    // 验证必填字段
    if (!id || !name || !description) {
      return res.status(400).json({ error: '角色ID、名称和描述都是必填字段' });
    }

    // 检查角色是否存在
    const existingRole = await prisma.employeeRoles.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRole) {
      return res.status(404).json({ error: '角色不存在' });
    }

    // 检查新名称是否与其他角色冲突
    const conflictingRole = await prisma.employeeRoles.findFirst({
      where: {
        name,
        id: { not: parseInt(id) }
      }
    });

    if (conflictingRole) {
      return res.status(400).json({ error: '角色名称已存在' });
    }

    // 检查是否有员工正在使用这个角色
    const employeesUsingRole = await prisma.employee.findMany({
      where: { roleId: parseInt(id) },
      take: 10
    });

    if (employeesUsingRole.length > 0) {
      const employeeNames = employeesUsingRole.map(emp => emp.name).join('、');
      return res.status(400).json({ 
        error: `无法更新角色"${existingRole.name}"，该角色正在被以下员工使用：${employeeNames}` 
      });
    }

    // 更新角色
    const updatedRole = await prisma.employeeRoles.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description
      }
    });

    res.status(200).json({
      message: '角色更新成功',
      data: updatedRole
    });

  } catch (error) {
    console.error('更新员工角色错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/settings/employeeroles');