import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getDefaultMenuData } from '@/lib/defaultMenuData';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证token和权限
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 检查是否已有菜单设置
    const existingMenus = await prisma.menuSetting.findMany();
    if (existingMenus.length > 0) {
      return res.status(400).json({ error: '菜单设置已存在，无需初始化' });
    }

    // 使用共享菜单数据
    const { rootMenus, subMenus } = getDefaultMenuData();
    const allMenus = [...rootMenus, ...subMenus];

    // 插入所有菜单
    await prisma.menuSetting.createMany({
      data: allMenus
    });

    res.status(200).json({
      success: true,
      message: '菜单设置初始化成功',
      data: {
        rootMenus: rootMenus.length,
        subMenus: subMenus.length
      }
    });

  } catch (error) {
    console.error('初始化菜单设置错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 