import { prisma } from '@/lib/db';
import { validateBenefitTypeUpdate } from '@/lib/benefitValidation';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, title, isPaid } = req.body;

    // 验证数据
    const validationErrors = validateBenefitTypeUpdate({ id, title });
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0] });
    }

    // 检查权益类型是否存在
    const existingBenefitType = await prisma.benefitType.findUnique({
      where: { id }
    });

    if (!existingBenefitType) {
      return res.status(404).json({ error: '权益类型不存在' });
    }

    // 更新权益类型
    const updatedBenefitType = await prisma.benefitType.update({
      where: { id },
      data: {
        title,
        isPaid: isPaid !== undefined ? isPaid : existingBenefitType.isPaid
      }
    });

    res.status(200).json({
      message: '权益类型更新成功',
      data: updatedBenefitType
    });

  } catch (error) {
    console.error('更新权益类型错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/benefit/definetype');