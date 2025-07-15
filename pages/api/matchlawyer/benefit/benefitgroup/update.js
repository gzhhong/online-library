import { prisma } from '@/lib/db';
import { 
  validateBenefitGroupUpdate, 
  checkBenefitGroupExists, 
  checkBenefitTypeExists 
} from '@/lib/benefitValidation';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, title, benefitTypeId, times, description, price, notShow } = req.body;

    // 验证数据
    const validationErrors = validateBenefitGroupUpdate({ id, title, benefitTypeId, times, price });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    // 检查权益分组是否存在
    const existingBenefitGroup = await prisma.benefitGroup.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBenefitGroup) {
      return res.status(404).json({ error: '权益分组不存在' });
    }

    // 检查权益类型是否存在
    const benefitTypeError = await checkBenefitTypeExists(benefitTypeId);
    if (benefitTypeError) {
      return res.status(400).json({ error: benefitTypeError });
    }

    // 更新权益分组
    const updatedBenefitGroup = await prisma.benefitGroup.update({
      where: { id: parseInt(id) },
      data: {
        title,
        benefitTypeId,
        times: times || 1,
        description: description || null,
        price: price || 0,
        notShow: notShow !== undefined ? notShow : existingBenefitGroup.notShow
      },
      include: {
        benefitType: true
      }
    });

    // 如果更新的是标题，需要同步更新同组其他记录的标题
    if (title !== existingBenefitGroup.title) {
      await prisma.benefitGroup.updateMany({
        where: { 
          groupId: existingBenefitGroup.groupId,
          id: { not: parseInt(id) }
        },
        data: { title }
      });
    }

    res.status(200).json({
      message: '权益分组更新成功',
      data: updatedBenefitGroup
    });

  } catch (error) {
    console.error('更新权益分组错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 