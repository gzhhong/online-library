import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '缺少菜单ID参数' });
    }

    // 检查菜单设置是否存在
    const existingMenuSetting = await prisma.menuSetting.findUnique({
      where: { id },
      include: {
        children: true
      }
    });

    if (!existingMenuSetting) {
      return res.status(404).json({ error: '菜单设置不存在' });
    }

    // 删除菜单设置及其所有子菜单设置
    await deleteMenuSettingAndChildren(id);

    res.status(200).json({
      success: true,
      message: '菜单设置及其所有子菜单删除成功'
    });

  } catch (error) {
    console.error('删除菜单设置错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

// 递归删除菜单设置及其所有子菜单设置
async function deleteMenuSettingAndChildren(menuSettingId) {
  // 先获取所有子菜单设置
  const children = await prisma.menuSetting.findMany({
    where: { parentId: menuSettingId }
  });

  // 递归删除所有子菜单设置
  for (const child of children) {
    await deleteMenuSettingAndChildren(child.id);
  }

  // 删除当前菜单设置
  await prisma.menuSetting.delete({
    where: { id: menuSettingId }
  });
} 