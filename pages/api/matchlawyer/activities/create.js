import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      images,
      imageTcpId,
      isPaid,
      price,
      targetGroups,
      canUseBenefit,
      minParticipants,
      maxParticipants
    } = req.body;

    // 基本验证
    if (!title || !startTime || !endTime || !location) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 验证时间
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ error: '结束时间必须晚于开始时间' });
    }

    // 创建活动
    const activityData = {
      title,
      description: description || null,
      startTime: start,
      endTime: end,
      location,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
      imageTcpId: imageTcpId && imageTcpId.length > 0 ? JSON.stringify(imageTcpId) : null,
      isPaid: isPaid || false,
      price: price || 0,
      targetGroups: targetGroups && targetGroups.length > 0 ? JSON.stringify(targetGroups) : JSON.stringify([0]),
      canUseBenefit: canUseBenefit || false,
      minParticipants: minParticipants || 1,
      maxParticipants: maxParticipants || 100,
    };

    const activity = await prisma.activity.create({
      data: activityData
    });

    res.status(201).json({
      message: '活动创建成功',
      data: {
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime,
        endTime: activity.endTime
      }
    });

  } catch (error) {
    console.error('创建活动错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/activities'); 