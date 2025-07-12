import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Industry ID is required' });
    }

    // 检查标签是否存在
    const existingIndustry = await prisma.industry.findUnique({
      where: { id },
      include: {
        children: true
      }
    });

    if (!existingIndustry) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    // 如果是0级标签（根节点），不允许删除
    if (existingIndustry.level === 0) {
      return res.status(400).json({ error: 'Cannot delete root industry' });
    }

    // 删除标签及其所有子标签
    await deleteIndustryAndChildren(id);

    res.status(200).json({
      success: true,
      message: 'Industry and all its children deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting industry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 递归删除标签及其所有子标签
async function deleteIndustryAndChildren(industryId) {
  // 先获取所有子标签
  const children = await prisma.industry.findMany({
    where: { parentId: industryId }
  });

  // 递归删除所有子标签
  for (const child of children) {
    await deleteIndustryAndChildren(child.id);
  }

  // 删除当前标签
  await prisma.industry.delete({
    where: { id: industryId }
  });
} 