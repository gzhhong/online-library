import { prisma } from '@/lib/db';
import { generateId, validateBenefitTypeCreate } from '@/lib/benefitValidation';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, isPaid } = req.body;

    // 验证数据
    const validationErrors = validateBenefitTypeCreate({ title });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    // 生成唯一ID
    let id;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      id = generateId();
      const existing = await prisma.benefitType.findUnique({
        where: { id }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: '无法生成唯一ID，请重试' });
    }

    // 创建权益类型
    const benefitType = await prisma.benefitType.create({
      data: {
        id,
        title,
        isPaid: isPaid || false
      }
    });

    res.status(201).json({
      message: '权益类型创建成功',
      data: benefitType
    });

  } catch (error) {
    console.error('创建权益类型错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/benefit/definetype');