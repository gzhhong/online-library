import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, title, notShow, forWhom } = req.body;

    // 验证必填字段
    console.log(req.body);
    if (!groupId || !title || !forWhom) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 验证forWhom字段
    if (!['企业', '律师'].includes(forWhom)) {
      return res.status(400).json({ error: 'forWhom字段必须是"企业"或"律师"' });
    }

    // 更新该组下的所有权益项
    const updatedItems = await prisma.benefitGroup.updateMany({
      where: {
        groupId: groupId
      },
      data: {
        title: title,
        notShow: notShow,
        forWhom: forWhom
      }
    });

    if (updatedItems.count === 0) {
      return res.status(404).json({ error: '权益组不存在' });
    }

    // 返回更新后的组信息
    const updatedGroup = await prisma.benefitGroup.findFirst({
      where: {
        groupId: groupId
      },
      include: {
        benefitType: true
      }
    });

    res.status(200).json({
      message: '权益组更新成功',
      data: updatedGroup
    });

  } catch (error) {
    console.error('更新权益组失败:', error);
    res.status(500).json({ error: '更新权益组失败' });
  } finally {
    await prisma.$disconnect();
  }
} 