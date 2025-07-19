import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '缺少ID参数' });
    }

    // 检查活动是否存在
    const existingActivity = await prisma.activity.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    // 删除活动
    await prisma.activity.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      message: '活动删除成功'
    });

  } catch (error) {
    console.error('删除活动错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/activities'); 