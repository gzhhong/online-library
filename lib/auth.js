import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded && decoded.isAdmin === true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// 新的验证方法，返回token中的角色信息
export function verifyTokenWithRole(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      isValid: decoded && (decoded.isAdmin === true || decoded.role),
      role: decoded?.role,
      roleId: decoded?.roleId,
      userId: decoded?.userId,
      isSuperAdmin: decoded?.isAdmin
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      isValid: false,
      role: null,
      roleId: null,
      userId: null,
      isAdmin: false
    };
  }
}

export function generateToken(payload) {
  const tokenPayload = {
    ...payload,
    isAdmin: true
  };
  return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30m' });
}

// 新的生成token方法，支持角色信息
export function generateTokenWithRole(payload) {
  const tokenPayload = {
    ...payload,
    isAdmin: false // 员工不是管理员
  };
  return jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30m' });
}

export function getTokenFromCookies() {
  const cookieStore = cookies();
  return cookieStore.get('token');
} 

// 全局缓存
let menuSettingsCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

// 获取菜单设置（带缓存）
async function getMenuSettingsWithCache() {
  const now = Date.now();
  
  // 如果缓存过期或不存在，重新获取
  if (!menuSettingsCache || (now - lastCacheTime) > CACHE_DURATION) {
    try {
      // 动态导入 prisma
      const { prisma } = await import('@/lib/db');
      
      const menuSettings = await prisma.menuSetting.findMany({
        orderBy: [
          { level: 'asc' },
          { index: 'asc' }
        ]
      });

      menuSettingsCache = menuSettings.map(item => ({
        ...item,
        roleIds: item.roleIds ? JSON.parse(item.roleIds) : []
      }));
      lastCacheTime = now;
      console.log('菜单设置缓存已更新');
    } catch (error) {
      console.error('获取菜单设置失败:', error);
      // 如果获取失败但有缓存，继续使用缓存
      if (!menuSettingsCache) {
        throw error;
      }
    }
  }
  
  return menuSettingsCache;
}

// 检查URL权限
async function checkUrlPermission(url, roleId) {
  try {
    const menuSettings = await getMenuSettingsWithCache();
    
    // 查找匹配的菜单项
    const menuItem = menuSettings.find(item => item.path === url);
    
    if (!menuItem) {
      // 如果找不到菜单项，默认拒绝访问
      return false;
    }
    
    // 如果roleIds为空，只有超级管理员可以访问
    if (menuItem.roleIds.length === 0) {
      return false;
    }
    
    // 检查用户角色是否在允许的角色列表中
    return menuItem.roleIds.includes(roleId);
  } catch (error) {
    console.error('检查URL权限失败:', error);
    return false;
  }
}

export function withAuth(handler, url) {
    return async (req, res) => {
      const token = req.cookies.token;
  
      if (!token) {
        return res.status(401).json({ error: '缺少 token' });
      }
  
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userData = {
            isValid: decoded && (decoded.isAdmin === true || decoded.role),
            email: decoded?.email,
            roleId: decoded?.roleId,
            userId: decoded?.userId,
            isSuperAdmin: decoded?.isAdmin
          };
        
        // 将解析后的信息注入 req
        req.userData = userData;

        // 如果是超级管理员，直接通过
        if (userData.isSuperAdmin) {
          return handler(req, res);
        }

        // 如果提供了URL参数，检查权限
        if (url) {
          const hasPermission = await checkUrlPermission(url, userData.roleId);
          if (!hasPermission) {
            return res.status(401).json({ 
              error: '权限不足',
              message: '您没有权限访问此资源',
              url,
              userRoleId: userData.roleId
            });
          }
        }

        return handler(req, res);
      } catch (error) {
        return res.status(401).json({ error: '无效 token' });
      }
    };
}

// 手动刷新缓存（用于管理界面）
export async function refreshMenuSettingsCache() {
  menuSettingsCache = null;
  lastCacheTime = 0;
  await getMenuSettingsWithCache();
}