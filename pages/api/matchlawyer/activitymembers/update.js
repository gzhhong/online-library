import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, isPaid } = req.body;

    if (id === undefined || isPaid === undefined) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 检查活动成员是否存在
    const existingActivityMember = await prisma.activityMember.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingActivityMember) {
      return res.status(404).json({ error: '活动成员不存在' });
    }

    // 更新活动成员
    const activityMember = await prisma.activityMember.update({
      where: { id: parseInt(id) },
      data: {
        isPaid: isPaid
      }
    });

    res.status(200).json({
      message: '活动成员信息更新成功',
      data: activityMember
    });

  } catch (error) {
    console.error('更新活动成员错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/activitymembers'); 