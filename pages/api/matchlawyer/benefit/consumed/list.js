import { withAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取所有权益使用记录
    const benefitConsumed = await prisma.benefitConsumed.findMany({
      include: {
        member: true,
        benefitTypeRef: true
      },
      orderBy: [
        { memberId: 'asc' },
        { benefitTypeId: 'asc' }
      ]
    });

    // 获取所有权益组信息，用于计算剩余次数
    const benefitGroups = await prisma.benefitGroup.findMany({
      include: {
        benefitType: true
      }
    });

    // 按用户分组处理数据
    const userConsumptionMap = new Map();

    benefitConsumed.forEach(record => {
      const memberId = record.memberId;
      
      if (!userConsumptionMap.has(memberId)) {
        userConsumptionMap.set(memberId, {
          memberId: record.memberId,
          memberName: record.memberName,
          memberType: record.memberType,
          benefitType: record.benefitType,
          benefits: []
        });
      }

      const userData = userConsumptionMap.get(memberId);
      
      // 计算剩余次数
      const benefitGroup = benefitGroups.find(bg => 
        bg.benefitTypeId === record.benefitTypeId
      );
      
      const totalAllowed = benefitGroup ? benefitGroup.times : 0;
      const remainingCount = Math.max(0, totalAllowed - record.usedCount);

      userData.benefits.push({
        benefitTypeId: record.benefitTypeId,
        benefitTitle: record.benefitTitle,
        benefitIsPaid: record.benefitIsPaid,
        usedCount: record.usedCount,
        remainingCount: remainingCount,
        totalAllowed: totalAllowed
      });
    });

    // 转换为数组格式
    const result = Array.from(userConsumptionMap.values());

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取权益使用情况错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

export default withAuth(handler, '/api/matchlawyer/benefit/consumption'); 