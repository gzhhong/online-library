import { getMenuForRole, getAllMenuSettings, buildMenuTree } from '@/lib/menuUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从cookie中获取token
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    // 验证token并获取用户信息
    const { verifyTokenWithRole } = await import('@/lib/auth');
    const tokenInfo = verifyTokenWithRole(token);
    
    if (!tokenInfo.isValid) {
      return res.status(401).json({ error: 'token无效' });
    }

    let menuData;

    if (tokenInfo.isSuperAdmin) {
      // 如果是超级管理员，返回全部菜单
      const allMenuSettings = await getAllMenuSettings();
      menuData = buildMenuTree(allMenuSettings);
      
      // 如果菜单为空，超级管理员可以看到默认菜单
      if (!menuData || menuData.length === 0) {
        const { getDefaultMenuData } = await import('@/lib/defaultMenuData');
        const defaultData = getDefaultMenuData();
        menuData = buildMenuTree(defaultData.allMenus);
      }
    } else {
      // 否则根据roleId过滤菜单
      const filteredMenuSettings = await getMenuForRole(tokenInfo.roleId);
      menuData = buildMenuTree(filteredMenuSettings);
      
      // 非超级管理员，如果菜单为空，返回空数组
      if (!menuData || menuData.length === 0) {
        menuData = [];
      }
    }

    res.status(200).json({
      success: true,
      data: menuData
    });

  } catch (error) {
    console.error('获取菜单数据错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 