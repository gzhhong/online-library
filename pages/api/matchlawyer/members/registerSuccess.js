import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Member registration success handler started');

  try {
    const { 
      type, 
      name, 
      idNumber, 
      benefitType, 
      description, 
      email, 
      phone, 
      company, 
      industryIds, 
      images,
      imageTcpId
    } = req.body;

    // 数据已经在validate API中验证过，这里只做基本检查
    if (!type || !name || !idNumber || !benefitType || !email || !phone) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 创建成员
    const memberData = {
      type,
      name,
      idNumber,
      benefitType,
      description: description || null,
      email,
      phone,
      company: company || null,
      images: images && images.length > 0 ? JSON.stringify(images) : null,
      imageTcpId: imageTcpId && imageTcpId.length > 0 ? JSON.stringify(imageTcpId) : null,
      industryIds: industryIds && industryIds.length > 0 ? JSON.stringify(industryIds) : null,
      status: 0, // 待审核
      isPaid: false,
    };

    console.log('准备创建成员数据:', memberData);

    const member = await prisma.member.create({
      data: memberData
    });

    console.log('成员创建成功:', member);

    res.status(201).json({
      message: '成员注册成功，等待审核',
      data: {
        id: member.id,
        name: member.name,
        type: member.type,
        status: member.status
      }
    });

  } catch (error) {
    console.error('成员注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 