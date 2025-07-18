import { prisma } from '@/lib/db';

import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: '成员ID是必需的' });
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id: parseInt(id) }
    });

    if (!member) {
      return res.status(404).json({ error: '成员不存在' });
    }

    // 获取行业标签信息
    let industryIds = [];
    if (member.industryIds) {
      try {
        industryIds = JSON.parse(member.industryIds);
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
      id: member.id,
      type: member.type,
      name: member.name,
      idNumber: member.idNumber,
      benefitType: member.benefitType,
      description: member.description,
      email: member.email,
      phone: member.phone,
      images: member.images ? JSON.parse(member.images) : [],
      imageTcpId: member.imageTcpId ? JSON.parse(member.imageTcpId) : [],
      status: member.status,
      isPaid: member.isPaid,
      company: member.company,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      industries: industries.length > 0 ? industries.map(i => ({ id: i.id, title: i.title, description: i.description })) : []
    };

    res.status(200).json({
      data: formattedMember
    });

  } catch (error) {
    console.error('获取成员详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/members');