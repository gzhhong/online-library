import { prisma } from '@/lib/db';

// 生成12位随机ID
function generateMenuId() {
  return Math.random().toString(36).substr(2, 12).toUpperCase();
}

import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, path, index, icon, parentId, roleIds } = req.body;

    // 验证必填字段
    if (!title || !path) {
      return res.status(400).json({ error: '标题和路径是必填字段' });
    }

    // 生成唯一ID
    let menuId;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      menuId = generateMenuId();
      const existing = await prisma.menuSetting.findUnique({
        where: { id: menuId }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: '无法生成唯一ID，请重试' });
    }

    // 计算level
    let level = 0;
    if (parentId) {
      const parentExists = await prisma.menuSetting.findUnique({
        where: { id: parentId }
      });
      if (!parentExists) {
        return res.status(400).json({ error: '父节点不存在' });
      }
      level = parentExists.level + 1;
    }

    // 创建菜单设置
    const menuSetting = await prisma.menuSetting.create({
      data: {
        id: menuId,
        title,
        path,
        level,
        index: index || 0,
        icon: icon || null,
        parentId: parentId || null,
        roleIds: roleIds && roleIds.length > 0 ? JSON.stringify(roleIds) : JSON.stringify([])
      }
    });

    // 格式化返回数据
    const formattedMenuSetting = {
      ...menuSetting,
      roleIds: menuSetting.roleIds ? JSON.parse(menuSetting.roleIds) : []
    };

    res.status(201).json({
      message: '菜单设置创建成功',
      data: formattedMenuSetting
    });

  } catch (error) {
    console.error('创建菜单设置错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/settings/menusetting');