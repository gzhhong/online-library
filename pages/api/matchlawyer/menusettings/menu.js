import { getMenuForRole } from '@/lib/menuUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roleId } = req.query;

    if (!roleId) {
      return res.status(400).json({ error: '角色ID参数是必需的' });
    }

    // 图标映射函数
    const iconMapper = (iconName) => {
      // 这里可以根据需要扩展更多图标映射
      const iconMap = {
        'AccountTree': 'AccountTree',
        'Settings': 'Settings',
        'People': 'People',
        'CardGiftcard': 'CardGiftcard',
        'Logout': 'Logout'
      };
      return iconMap[iconName] || null;
    };

    // 使用menuUtils获取菜单数据
    const menuItems = await getMenuForRole(parseInt(roleId), iconMapper);

    res.status(200).json({
      success: true,
      data: menuItems
    });

  } catch (error) {
    console.error('获取菜单数据错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 