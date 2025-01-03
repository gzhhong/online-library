import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getFileFromCOS, streamFileToResponse } from '@/lib/cos';

export default async function handler(req, res) {
  const { path, nickName } = req.query;
  if (!path || path.length === 0) {
    return res.status(400).json({ message: 'Invalid file path' });
  }

  try {
    // 验证权限
    const token = req.cookies.token;
    const isAdmin = token && verifyToken(token);

    // 构造文件路径
    const fileUrlPath = '/' + path.join('/');

    // 查找对应的图书记录
    const book = await prisma.book.findFirst({
      where: {
        OR: [
          { coverPath: fileUrlPath },
          { pdfPath: fileUrlPath }
        ]
      }
    });

    if (!book) {
      return res.status(404).json({ message: 'File not found in database' });
    }

    // 权限检查
    if (!isAdmin) {
      let userAccessLevel = 0;
      if (nickName) {
        const user = await prisma.user.findUnique({
          where: { nickName }
        });
        if (user) {
          userAccessLevel = user.accessLevel;
        }
      }

      if (userAccessLevel < book.accessLevel) {
        return res.status(403).json({ 
          message: 'Insufficient access level',
          required: book.accessLevel,
          current: userAccessLevel
        });
      }
    }

    // 构造 COS 中的文件路径
    const cloudPath = fileUrlPath;

    // 设置Content-Type
    const ext = path[path.length - 1].split('.').pop().toLowerCase();
    const contentTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }

    // 获取并返回文件
    await streamFileToResponse(cloudPath, res);

  } catch (error) {
    console.error('File access error:', {
      error,
      path: req.query.path,
      url: req.url
    });
    res.status(500).json({ message: 'Internal server error' });
  }
} 