import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      id,
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      images,
      imageTcpId,
      benefitTypeId,
      price,
      targetGroups,
      canUseBenefit,
      minParticipants,
      maxParticipants
    } = req.body;

    // 基本验证
    if (!id || !title || !startTime || !endTime || !location) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 检查活动是否存在
    const existingActivity = await prisma.activity.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: '活动不存在' });
    }

    // 验证时间
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ error: '结束时间必须晚于开始时间' });
    }

    // 更新活动
    const activityData = {
      title,
      description: description || null,
      startTime: start,
      endTime: end,
      location,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
      imageTcpId: imageTcpId && imageTcpId.length > 0 ? JSON.stringify(imageTcpId) : null,
      benefitTypeId: benefitTypeId || null,
      price: price || 0,
      targetGroups: targetGroups && targetGroups.length > 0 ? JSON.stringify(targetGroups) : JSON.stringify([0]),
      canUseBenefit: canUseBenefit || false,
      minParticipants: minParticipants || 1,
      maxParticipants: maxParticipants || 100,
    };

    const activity = await prisma.activity.update({
      where: { id: parseInt(id) },
      data: activityData
    });

    res.status(200).json({
      message: '活动更新成功',
      data: {
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime,
        endTime: activity.endTime
      }
    });

  } catch (error) {
    console.error('更新活动错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/activities'); 