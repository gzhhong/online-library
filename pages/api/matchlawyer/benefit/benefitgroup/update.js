import { prisma } from '@/lib/db';
import { 
  validateBenefitGroupUpdate, 
  checkBenefitGroupExists,
  updateGroupPrice
} from '@/lib/benefitValidation';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, title, benefitTypeId, times, description, price, notShow, forWhom } = req.body;

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

    // 更新权益分组
    const updatedBenefitGroup = await prisma.benefitGroup.update({
      where: { id: parseInt(id) },
      data: {
        title,
        benefitTypeId,
        times: times || existingBenefitGroup.times,
        description: description !== undefined ? description : existingBenefitGroup.description,
        price: price !== undefined ? price : existingBenefitGroup.price,
        notShow: notShow !== undefined ? notShow : existingBenefitGroup.notShow,
        forWhom: forWhom !== undefined ? forWhom : existingBenefitGroup.forWhom
      },
      include: {
        benefitType: true
      }
    });

    // 更新组的price总和
    await updateGroupPrice(existingBenefitGroup.groupId);

    res.status(200).json({
      message: '权益分组更新成功',
      data: updatedBenefitGroup
    });

  } catch (error) {
    console.error('更新权益分组错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/benefit/group');