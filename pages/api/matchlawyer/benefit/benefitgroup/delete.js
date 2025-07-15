import { prisma } from '@/lib/db';
import { checkBenefitGroupExists, updateGroupPrice } from '@/lib/benefitValidation';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '缺少ID参数' });
    }

    // 检查权益分组是否存在
    const existingBenefitGroup = await prisma.benefitGroup.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBenefitGroup) {
      return res.status(404).json({ error: '权益分组不存在' });
    }

    // 删除权益分组
    await prisma.benefitGroup.delete({
      where: { id: parseInt(id) }
    });

    // 更新组的price总和
    await updateGroupPrice(existingBenefitGroup.groupId);

    res.status(200).json({
      message: '权益分组删除成功'
    });

  } catch (error) {
    console.error('删除权益分组错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 