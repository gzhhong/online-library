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

export function withAuth(handler) {
    return async (req, res) => {
      const token = req.cookies.token;
  
      if (!token) {
        return res.status(401).json({ error: '缺少 token' });
      }
  
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = {
            isValid: decoded && (decoded.isAdmin === true || decoded.role),
            email: decoded?.email,
            roleId: decoded?.roleId,
            userId: decoded?.userId,
            isSuperAdmin: decoded?.isAdmin
          }; // 将解析后的信息注入 req
        return handler(req, res);
      } catch (error) {
        return res.status(401).json({ error: '无效 token' });
      }
    };
}