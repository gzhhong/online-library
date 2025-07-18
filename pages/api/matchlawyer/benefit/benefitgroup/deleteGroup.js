import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId } = req.query;

    if (!groupId) {
      return res.status(400).json({ error: '缺少groupId参数' });
    }

    // 检查权益组是否存在
    const existingGroup = await prisma.benefitGroup.findFirst({
      where: { groupId }
    });

    if (!existingGroup) {
      return res.status(404).json({ error: '权益组不存在' });
    }

    // 删除该组的所有记录（包括组标题和所有权益项）
    await prisma.benefitGroup.deleteMany({
      where: { groupId }
    });

    res.status(200).json({
      message: '权益组删除成功'
    });

  } catch (error) {
    console.error('删除权益组错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/benefit/group');