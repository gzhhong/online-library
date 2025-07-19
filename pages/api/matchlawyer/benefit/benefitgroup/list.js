import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取所有权益分组，按groupId分组
    const benefitGroups = await prisma.benefitGroup.findMany({
      include: {
        benefitType: true
      },
      orderBy: [
        { groupId: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // 按groupId分组
    const groupedData = {};
    benefitGroups.forEach(group => {
      if (!groupedData[group.groupId]) {
        // 计算该组所有权益项的price总和
        const groupItems = benefitGroups.filter(g => g.groupId === group.groupId);
        
        const totalPrice = groupItems.reduce((sum, item) => {
          return sum + parseFloat(item.price || 0);
        }, 0);
        
        groupedData[group.groupId] = {
          groupId: group.groupId,
          title: group.title,
          notShow: group.notShow,
          forWhom: group.forWhom,
          price: totalPrice, // 使用计算出的总价格
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
          items: []
        };
      }
      groupedData[group.groupId].items.push({
        id: group.id,
        benefitTypeId: group.benefitTypeId,
        benefitTypeTitle: group.benefitType.title,
        benefitTypeIsPaid: group.benefitType.isPaid,
        times: group.times,
        description: group.description,
        price: group.price,
        notShow: group.notShow
      });
    });

    const result = Object.values(groupedData);

    res.status(200).json({
      data: result,
      total: result.length
    });

  } catch (error) {
    console.error('获取权益分组列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/benefit/group');