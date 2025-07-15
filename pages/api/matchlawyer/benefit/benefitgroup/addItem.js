import { prisma } from '@/lib/db';
import { 
  validateBenefitItemAdd, 
  checkBenefitTypeExists, 
  checkBenefitTypeInGroupExists 
} from '@/lib/benefitValidation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, title, benefitTypeId, times, description, price, notShow } = req.body;

    // 验证数据
    const validationErrors = validateBenefitItemAdd({ groupId, title, benefitTypeId, times, price });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    // 检查权益类型是否存在
    const benefitTypeError = await checkBenefitTypeExists(benefitTypeId);
    if (benefitTypeError) {
      return res.status(400).json({ error: benefitTypeError });
    }

    // 检查是否已存在相同的权益类型
    const existingItemError = await checkBenefitTypeInGroupExists(groupId, benefitTypeId);
    if (existingItemError) {
      return res.status(400).json({ error: existingItemError });
    }

    // 创建新的权益项
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
      message: '权益项添加成功',
      data: benefitGroup
    });

  } catch (error) {
    console.error('添加权益项错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 