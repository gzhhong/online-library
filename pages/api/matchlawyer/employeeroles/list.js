import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const employeeRoles = await prisma.employeeRoles.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      data: employeeRoles,
      total: employeeRoles.length
    });

  } catch (error) {
    console.error('获取员工角色列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/settings/employeeroles');