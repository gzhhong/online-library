import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Member update success handler started');

  try {
    const { 
      id,
      benefitType, 
      description, 
      email, 
      phone, 
      company, 
      industryIds, 
      images,
      isPaid 
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: '会员ID是必需的' });
    }

    // 检查会员是否存在
    const existingMember = await prisma.member.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMember) {
      return res.status(404).json({ error: '会员不存在' });
    }

    // 基本验证（详细验证应该在调用前完成）
    if (benefitType && !['免费', '1级会员', '2级会员', '3级会员'].includes(benefitType)) {
      return res.status(400).json({ error: '权益类型无效' });
    }

    // 准备更新数据
    const updateData = {};
    
    if (benefitType !== undefined) {
      updateData.benefitType = benefitType;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    if (email) {
      updateData.email = email;
    }
    
    if (phone) {
      updateData.phone = phone;
    }
    
    if (company !== undefined) {
      updateData.company = company;
    }
    
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
    }
    
    if (images !== undefined) {
      updateData.images = images && images.length > 0 ? JSON.stringify(images) : null;
    }

    if (industryIds !== undefined) {
      updateData.industryIds = industryIds && industryIds.length > 0 ? JSON.stringify(industryIds) : null;
    }

    console.log('准备更新会员数据:', updateData);

    // 更新会员信息
    const updatedMember = await prisma.member.update({
      where: { id: parseInt(id) },
      data: updateData
    });

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
      company: updatedMember.company,
      images: updatedMember.images ? JSON.parse(updatedMember.images) : [],
      status: updatedMember.status,
      isPaid: updatedMember.isPaid,
      createdAt: updatedMember.createdAt,
      updatedAt: updatedMember.updatedAt,
      industryIds: updatedMember.industryIds ? JSON.parse(updatedMember.industryIds) : []
    };

    console.log('会员更新成功:', formattedMember);

    res.status(200).json({
      message: '会员信息更新成功',
      data: formattedMember
    });

  } catch (error) {
    console.error('更新会员信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 