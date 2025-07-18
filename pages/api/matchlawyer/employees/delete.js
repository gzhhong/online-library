import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '缺少员工ID参数' });
    }

    // 检查员工是否存在
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: '员工不存在' });
    }

    // 删除员工
    await prisma.employee.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      message: '员工删除成功'
    });

  } catch (error) {
    console.error('删除员工错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/settings/employee');