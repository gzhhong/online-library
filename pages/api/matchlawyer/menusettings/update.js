import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, title, path, index, icon, parentId, roleIds } = req.body;

    // 验证必填字段
    if (!id || !title || !path) {
      return res.status(400).json({ error: 'ID、标题和路径是必填字段' });
    }

    // 检查菜单设置是否存在
    const existingMenuSetting = await prisma.menuSetting.findUnique({
      where: { id }
    });

    if (!existingMenuSetting) {
      return res.status(404).json({ error: '菜单设置不存在' });
    }

    // 计算level
    let level = existingMenuSetting.level;
    if (parentId !== undefined && parentId !== existingMenuSetting.parentId) {
      if (parentId) {
        const parentExists = await prisma.menuSetting.findUnique({
          where: { id: parentId }
        });
        if (!parentExists) {
          return res.status(400).json({ error: '父节点不存在' });
        }
        level = parentExists.level + 1;
      } else {
        level = 0; // 根节点
      }
    }

    // 更新菜单设置
    const updatedMenuSetting = await prisma.menuSetting.update({
      where: { id },
      data: {
        title,
        path,
        level,
        index: index !== undefined ? index : existingMenuSetting.index,
        icon: icon !== undefined ? icon : existingMenuSetting.icon,
        parentId: parentId !== undefined ? parentId : existingMenuSetting.parentId,
        roleIds: roleIds && roleIds.length > 0 ? JSON.stringify(roleIds) : JSON.stringify([])
      }
    });

    // 格式化返回数据
    const formattedMenuSetting = {
      ...updatedMenuSetting,
      roleIds: updatedMenuSetting.roleIds ? JSON.parse(updatedMenuSetting.roleIds) : []
    };

    res.status(200).json({
      message: '菜单设置更新成功',
      data: formattedMenuSetting
    });

  } catch (error) {
    console.error('更新菜单设置错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/settings/menusetting');