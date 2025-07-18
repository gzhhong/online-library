import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const benefitTypes = await prisma.benefitType.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      data: benefitTypes,
      total: benefitTypes.length
    });

  } catch (error) {
    console.error('获取权益类型列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/benefit/definetype');