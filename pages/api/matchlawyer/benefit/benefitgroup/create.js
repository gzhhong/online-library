import { prisma } from '@/lib/db';
import { 
  generateId, 
  validateBenefitGroupCreate, 
  checkBenefitTypeExists 
} from '@/lib/benefitValidation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, benefitTypeId, times, description, price, notShow } = req.body;

    // 验证数据
    const validationErrors = validateBenefitGroupCreate({ title, benefitTypeId, times, price });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    // 检查权益类型是否存在
    const benefitTypeError = await checkBenefitTypeExists(benefitTypeId);
    if (benefitTypeError) {
      return res.status(400).json({ error: benefitTypeError });
    }

    // 生成唯一groupId
    let groupId;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      groupId = generateId();
      const existing = await prisma.benefitGroup.findFirst({
        where: { groupId }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: '无法生成唯一ID，请重试' });
    }

    // 创建权益分组
    const benefitGroup = await prisma.benefitGroup.create({
      data: {
        groupId,
        title,
        benefitTypeId,
        times: times || 1,
        description: description || null,
        price: price || 0,
        notShow: notShow || false
      },
      include: {
        benefitType: true
      }
    });

    res.status(201).json({
      message: '权益分组创建成功',
      data: benefitGroup
    });

  } catch (error) {
    console.error('创建权益分组错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 