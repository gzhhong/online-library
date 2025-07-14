import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: '会员ID是必需的' });
    }

    // 检查会员是否存在
    const member = await prisma.member.findUnique({
      where: { id: parseInt(id) }
    });

    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }

    // 检查会员状态
    if (member.status === 1) {
      return res.status(400).json({ error: '该会员已经审核通过' });
    }

    // 更新会员状态为已审核
    const updatedMember = await prisma.member.update({
      where: { id: parseInt(id) },
      data: { status: 1 }
    });

    // 解析行业标签ID
    let industryIds = [];
    if (updatedMember.industryIds) {
      try {
        industryIds = JSON.parse(updatedMember.industryIds);
      } catch {}
    }
    let industries = [];
    if (industryIds.length > 0) {
      industries = await prisma.industry.findMany({
        where: { id: { in: industryIds } }
      });
    }

    // 格式化返回数据
    const formattedMember = {
      id: updatedMember.id,
      type: updatedMember.type,
      name: updatedMember.name,
      idNumber: updatedMember.idNumber,
      benefitType: updatedMember.benefitType,
      description: updatedMember.description,
      email: updatedMember.email,
      phone: updatedMember.phone,
      images: updatedMember.images ? JSON.parse(updatedMember.images) : [],
      status: updatedMember.status,
      isPaid: updatedMember.isPaid,
      createdAt: updatedMember.createdAt,
      updatedAt: updatedMember.updatedAt,
      industries: industries.map(i => ({ id: i.id, title: i.title, description: i.description }))
    };

    res.status(200).json({
      message: '会员审核通过',
      data: formattedMember
    });

  } catch (error) {
    console.error('审核会员错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 