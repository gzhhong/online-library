import { prisma } from '@/lib/db';
import { validateRecordId } from '@/lib/benefitValidation';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // 验证ID
    const idError = validateRecordId(id);
    if (idError) {
      return res.status(400).json({ error: idError });
    }

    // 检查权益类型是否存在
    const existingBenefitType = await prisma.benefitType.findUnique({
      where: { id }
    });

    if (!existingBenefitType) {
      return res.status(404).json({ error: '权益类型不存在' });
    }

    // 检查是否有权益组正在使用此权益类型
    const benefitGroupsUsingBenefitType = await prisma.benefitGroup.findFirst({
      where: { benefitTypeId: id }
    });

    if (benefitGroupsUsingBenefitType) {
      return res.status(400).json({ 
        error: '无法删除：有权益组正在使用此权益类型，请先修改相关权益组的权益类型' 
      });
    }

    // 删除权益类型
    await prisma.benefitType.delete({
      where: { id }
    });

    res.status(200).json({
      message: '权益类型删除成功'
    });

  } catch (error) {
    console.error('删除权益类型错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/benefit/definetype');