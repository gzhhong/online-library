import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, name, email, phone, password, roleId, status } = req.body;

    // 验证必填字段
    if (!id || !name || !email || !phone || !roleId) {
      return res.status(400).json({ error: 'ID、姓名、邮箱、手机号和角色都是必填的' });
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

    // 检查员工是否存在
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: '员工不存在' });
    }

    // 检查邮箱是否被其他员工使用
    const conflictingEmail = await prisma.employee.findFirst({
      where: {
        email,
        id: { not: parseInt(id) }
      }
    });

    if (conflictingEmail) {
      return res.status(400).json({ error: '邮箱已被其他员工使用' });
    }

    // 检查手机号是否被其他员工使用
    const conflictingPhone = await prisma.employee.findFirst({
      where: {
        phone,
        id: { not: parseInt(id) }
      }
    });

    if (conflictingPhone) {
      return res.status(400).json({ error: '手机号已被其他员工使用' });
    }

    // 检查角色是否存在
    const existingRole = await prisma.employeeRoles.findUnique({
      where: { id: parseInt(roleId) }
    });

    if (!existingRole) {
      return res.status(400).json({ error: '选择的角色不存在' });
    }

    // 准备更新数据
    const updateData = {
      name,
      email,
      phone,
      roleId: parseInt(roleId),
      status: status !== undefined ? parseInt(status) : existingEmployee.status
    };

    // 如果提供了新密码，则加密并更新
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // 更新员工
    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        role: true
      }
    });

    // 返回数据时不包含密码
    const { password: _, ...employeeWithoutPassword } = updatedEmployee;

    res.status(200).json({
      message: '员工信息更新成功',
      data: employeeWithoutPassword
    });

  } catch (error) {
    console.error('更新员工错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 