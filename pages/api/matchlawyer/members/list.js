import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const members = await prisma.member.findMany({
      orderBy: [
        { status: 'asc' },
        { benefitType: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // 获取所有涉及到的行业标签ID
    const allIndustryIds = Array.from(new Set(members.flatMap(m => {
      if (!m.industryIds) return [];
      try {
        return JSON.parse(m.industryIds);
      } catch {
        return [];
      }
    })));
    let allIndustries = [];
    if (allIndustryIds.length > 0) {
      allIndustries = await prisma.industry.findMany({
        where: { id: { in: allIndustryIds } }
      });
    }

    // 格式化数据
    const formattedMembers = members.map(member => {
      let industryIds = [];
      if (member.industryIds) {
        try {
          industryIds = JSON.parse(member.industryIds);
        } catch {}
      }
      return {
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
        industries: allIndustries.filter(i => industryIds.includes(i.id)).map(i => ({ id: i.id, title: i.title, description: i.description }))
      };
    });

    res.status(200).json({
      data: formattedMembers,
      total: formattedMembers.length
    });

  } catch (error) {
    console.error('获取会员列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 