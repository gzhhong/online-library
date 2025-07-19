import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { activityId } = req.query;

    if (!activityId) {
      return res.status(400).json({ error: '缺少activityId参数' });
    }

    const activityMembers = await prisma.activityMember.findMany({
      where: {
        activityId: parseInt(activityId)
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      data: activityMembers,
      total: activityMembers.length
    });

  } catch (error) {
    console.error('获取活动成员列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/activitymembers'); 