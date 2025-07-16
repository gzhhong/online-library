import { prisma } from '@/lib/db';

/**
 * 从数据库获取所有菜单设置
 * @returns {Promise<Array>} 菜单设置数组
 */
export async function getAllMenuSettings() {
  try {
    const menuSettings = await prisma.menuSetting.findMany({
      orderBy: [
        { level: 'asc' },
        { index: 'asc' }
      ]
    });

    return menuSettings.map(item => ({
      ...item,
      roleIds: item.roleIds ? JSON.parse(item.roleIds) : []
    }));
  } catch (error) {
    console.error('获取菜单设置失败:', error);
    throw error;
  }
}

/**
 * 根据角色ID获取可访问的菜单设置
 * @param {number} roleId 角色ID
 * @returns {Promise<Array>} 可访问的菜单设置数组
 */
export async function getMenuSettingsByRole(roleId) {
  try {
    const menuSettings = await prisma.menuSetting.findMany({
      orderBy: [
        { level: 'asc' },
        { index: 'asc' }
      ]
    });

    // 过滤出该角色可访问的菜单
    return menuSettings
      .map(item => ({
        ...item,
        roleIds: item.roleIds ? JSON.parse(item.roleIds) : []
      }))
      .filter(item => {
        // 如果roleIds为空数组，表示所有角色都可访问
        if (item.roleIds.length === 0) return true;
        return item.roleIds.includes(roleId);
      });
  } catch (error) {
    console.error('根据角色获取菜单设置失败:', error);
    throw error;
  }
}

/**
 * 将扁平菜单数据构建为树形结构
 * @param {Array} flatMenuSettings 扁平菜单设置数组
 * @returns {Array} 树形菜单结构
 */
export function buildMenuTree(flatMenuSettings) {
  const menuMap = new Map();
  const rootMenus = [];

  // 创建菜单映射
  flatMenuSettings.forEach(item => {
    menuMap.set(item.id, {
      ...item,
      children: []
    });
  });

  // 构建树形结构
  flatMenuSettings.forEach(item => {
    const menuItem = menuMap.get(item.id);
    if (item.parentId) {
      const parent = menuMap.get(item.parentId);
      if (parent) {
        parent.children.push(menuItem);
      }
    } else {
      rootMenus.push(menuItem);
    }
  });

  return rootMenus;
}

/**
 * 将菜单设置转换为React组件可用的菜单项格式
 * @param {Array} menuTree 菜单树
 * @param {Function} iconMapper 图标映射函数
 * @returns {Array} React菜单项数组
 */
export function convertToReactMenuItems(menuTree, iconMapper = null) {
  return menuTree.map(item => {
    const menuItem = {
      text: item.title,
      path: item.path,
      icon: iconMapper ? iconMapper(item.icon) : null
    };

    if (item.children && item.children.length > 0) {
      menuItem.subItems = convertToReactMenuItems(item.children, iconMapper);
    }

    return menuItem;
  });
}

/**
 * 根据角色ID获取完整的菜单结构
 * @param {number} roleId 角色ID
 * @param {Function} iconMapper 图标映射函数
 * @returns {Promise<Array>} React菜单项数组
 */
export async function getMenuForRole(roleId, iconMapper = null) {
  try {
    const menuSettings = await getMenuSettingsByRole(roleId);
    const menuTree = buildMenuTree(menuSettings);
    return convertToReactMenuItems(menuTree, iconMapper);
  } catch (error) {
    console.error('获取角色菜单失败:', error);
    throw error;
  }
}

/**
 * 验证菜单路径的唯一性
 * @param {string} path 菜单路径
 * @param {string} excludeId 排除的菜单ID（用于更新时）
 * @returns {Promise<boolean>} 路径是否唯一
 */
export async function isMenuPathUnique(path, excludeId = null) {
  try {
    const whereClause = { path };
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingMenu = await prisma.menuSetting.findFirst({
      where: whereClause
    });

    return !existingMenu;
  } catch (error) {
    console.error('验证菜单路径唯一性失败:', error);
    throw error;
  }
}

/**
 * 获取菜单的完整路径（包含所有父级菜单）
 * @param {string} menuId 菜单ID
 * @returns {Promise<Array>} 完整路径数组
 */
export async function getMenuFullPath(menuId) {
  try {
    const path = [];
    let currentMenu = await prisma.menuSetting.findUnique({
      where: { id: menuId }
    });

    while (currentMenu) {
      path.unshift(currentMenu);
      if (currentMenu.parentId) {
        currentMenu = await prisma.menuSetting.findUnique({
          where: { id: currentMenu.parentId }
        });
      } else {
        break;
      }
    }

    return path;
  } catch (error) {
    console.error('获取菜单完整路径失败:', error);
    throw error;
  }
}

/**
 * 获取菜单的所有子菜单ID
 * @param {string} menuId 菜单ID
 * @returns {Promise<Array>} 子菜单ID数组
 */
export async function getMenuChildrenIds(menuId) {
  try {
    const childrenIds = [];
    
    const getChildren = async (parentId) => {
      const children = await prisma.menuSetting.findMany({
        where: { parentId }
      });

      for (const child of children) {
        childrenIds.push(child.id);
        await getChildren(child.id);
      }
    };

    await getChildren(menuId);
    return childrenIds;
  } catch (error) {
    console.error('获取菜单子菜单ID失败:', error);
    throw error;
  }
}

/**
 * 检查菜单是否有子菜单
 * @param {string} menuId 菜单ID
 * @returns {Promise<boolean>} 是否有子菜单
 */
export async function hasMenuChildren(menuId) {
  try {
    const children = await prisma.menuSetting.findFirst({
      where: { parentId: menuId }
    });
    return !!children;
  } catch (error) {
    console.error('检查菜单子菜单失败:', error);
    throw error;
  }
}

/**
 * 生成唯一的菜单ID
 * @returns {string} 12位随机字符串
 */
export function generateMenuId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 验证菜单设置数据的有效性
 * @param {Object} menuData 菜单数据
 * @returns {Object} 验证结果 { isValid: boolean, errors: Array }
 */
export function validateMenuData(menuData) {
  const errors = [];

  if (!menuData.title || !menuData.title.trim()) {
    errors.push('菜单标题不能为空');
  }

  if (!menuData.path || !menuData.path.trim()) {
    errors.push('菜单路径不能为空');
  }

  if (menuData.title && menuData.title.length > 20) {
    errors.push('菜单标题不能超过20个字符');
  }

  if (menuData.path && menuData.path.length > 200) {
    errors.push('菜单路径不能超过200个字符');
  }

  if (menuData.icon && menuData.icon.length > 100) {
    errors.push('图标名称不能超过100个字符');
  }

  if (typeof menuData.index !== 'number' || menuData.index < 0) {
    errors.push('菜单顺序必须是非负整数');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 