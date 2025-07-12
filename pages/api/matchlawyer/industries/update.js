import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, title, description, parentId } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Industry ID is required' });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    // 检查标签是否存在
    const existingIndustry = await prisma.industry.findUnique({
      where: { id }
    });

    if (!existingIndustry) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    let level = existingIndustry.level;
    let newParentId = existingIndustry.parentId;

    // 如果父节点发生变化，需要重新计算层级
    if (parentId !== existingIndustry.parentId) {
      if (parentId && parentId !== 'null') {
        const parent = await prisma.industry.findUnique({
          where: { id: parentId }
        });

        if (!parent) {
          return res.status(404).json({ error: 'Parent industry not found' });
        }

        // 检查是否形成循环引用
        if (parentId === id) {
          return res.status(400).json({ error: 'Cannot set self as parent' });
        }

        // 检查是否将父节点设置为自己的子节点
        const isChild = await checkIsChild(id, parentId);
        if (isChild) {
          return res.status(400).json({ error: 'Cannot set child as parent' });
        }

        level = parent.level + 1;
        newParentId = parentId;
      } else {
        level = 0;
        newParentId = null;
      }
    }

    // 更新标签
    const updatedIndustry = await prisma.industry.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        level,
        parentId: newParentId
      },
      include: {
        parent: true,
        children: true
      }
    });

    // 如果层级发生变化，需要更新所有子节点的层级
    if (level !== existingIndustry.level) {
      await updateChildrenLevels(id, level);
    }

    res.status(200).json({
      success: true,
      data: updatedIndustry
    });
  } catch (error) {
    console.error('Error updating industry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 检查是否形成循环引用
async function checkIsChild(parentId, childId) {
  const children = await prisma.industry.findMany({
    where: { parentId }
  });

  for (const child of children) {
    if (child.id === childId) {
      return true;
    }
    const isGrandChild = await checkIsChild(child.id, childId);
    if (isGrandChild) {
      return true;
    }
  }

  return false;
}

// 递归更新子节点层级
async function updateChildrenLevels(parentId, parentLevel) {
  const children = await prisma.industry.findMany({
    where: { parentId }
  });

  for (const child of children) {
    const newLevel = parentLevel + 1;
    await prisma.industry.update({
      where: { id: child.id },
      data: { level: newLevel }
    });
    await updateChildrenLevels(child.id, newLevel);
  }
} 