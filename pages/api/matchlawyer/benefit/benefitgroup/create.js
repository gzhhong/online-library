import { prisma } from '@/lib/db';
import { generateId, validateBenefitGroupCreateSimple, checkBenefitTypeExists } from '@/lib/benefitValidation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      groupTitle, 
      groupNotShow, 
      benefitTypeId, 
      times, 
      description, 
      price, 
      notShow,
      existingGroupId 
    } = req.body;

    // 验证组标题
    const groupValidationErrors = validateBenefitGroupCreateSimple({ title: groupTitle });
    if (groupValidationErrors.length > 0) {
      return res.status(400).json({ error: groupValidationErrors[0] });
    }

    // 验证权益项信息
    if (!benefitTypeId) {
      return res.status(400).json({ error: '权益类型是必填字段' });
    }

    // 检查权益类型是否存在
    const benefitTypeError = await checkBenefitTypeExists(benefitTypeId);
    if (benefitTypeError) {
      return res.status(400).json({ error: benefitTypeError });
    }

    // 确定groupId：如果提供了existingGroupId就使用它，否则生成新的
    let groupId = existingGroupId;
    
    if (!groupId) {
      // 生成唯一groupId
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
    }

    // 创建权益分组（包含组信息和权益项）
    const benefitGroup = await prisma.benefitGroup.create({
      data: {
        groupId,
        title: groupTitle,
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