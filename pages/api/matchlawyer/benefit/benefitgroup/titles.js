import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取所有权益分组的标题和适用对象，按groupId分组，只返回不隐藏的组
    const benefitGroups = await prisma.benefitGroup.findMany({
      where: {
        notShow: false // 只获取不隐藏的组
      },
      select: {
        groupId: true,
        title: true,
        forWhom: true
      },
      orderBy: [
        { groupId: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // 按groupId分组，去重标题和适用对象
    const groupedTitles = {};
    benefitGroups.forEach(group => {
      if (!groupedTitles[group.groupId]) {
        groupedTitles[group.groupId] = {
          groupId: group.groupId,
          title: group.title,
          forWhom: group.forWhom
        };
      }
    });

    // 转换为数组格式
    const titles = Object.values(groupedTitles);

    res.status(200).json({
      data: titles,
      total: titles.length
    });

  } catch (error) {
    console.error('获取权益组标题列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 