import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const activities = await prisma.activity.findMany({
      include: {
        benefitType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 格式化数据
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      images: activity.images ? JSON.parse(activity.images) : [],
      imageTcpId: activity.imageTcpId ? JSON.parse(activity.imageTcpId) : [],
      benefitTypeId: activity.benefitTypeId,
      benefitTypeTitle: activity.benefitType?.title || null,
      benefitTypeIsPaid: activity.benefitType?.isPaid || false,
      price: activity.price,
      targetGroups: activity.targetGroups ? JSON.parse(activity.targetGroups) : [],
      canUseBenefit: activity.canUseBenefit,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt
    }));

    res.status(200).json({
      data: formattedActivities,
      total: formattedActivities.length
    });

  } catch (error) {
    console.error('获取活动列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/activities'); 