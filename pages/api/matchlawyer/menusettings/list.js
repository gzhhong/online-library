import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const menuSettings = await prisma.menuSetting.findMany({
      orderBy: [
        { parentId: 'asc' },
        { index: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // 格式化数据，解析roleIds
    const formattedMenuSettings = menuSettings.map(item => ({
      ...item,
      roleIds: item.roleIds ? JSON.parse(item.roleIds) : []
    }));

    res.status(200).json({
      data: formattedMenuSettings,
      total: formattedMenuSettings.length
    });

  } catch (error) {
    console.error('获取菜单设置列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 