import { createReadStream } from 'fs';
import { join } from 'path';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  const { path, nickName } = req.query;
  if (!path || path.length === 0) {
    return res.status(400).json({ message: 'Invalid file path' });
  }

  try {
    // 先检查是否是管理员（通过token验证）
    const token = req.cookies.token;
    const isAdmin = token && verifyToken(token);

    // 获取文件路径
    const filePath = join(process.cwd(), 'uploads', ...path);
    
    // 从路径构造文件的URL路径
    const fileUrlPath = '/files/' + path.join('/');

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

    // 如果是管理员，直接允许访问
    if (isAdmin) {
      const stream = createReadStream(filePath);
      stream.on('error', () => {
        res.status(404).json({ message: 'File not found on disk' });
      });

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

      return stream.pipe(res);
    }

    // 非管理员，检查用户权限
    let userAccessLevel = 0;
    if (nickName) {
      const user = await prisma.user.findUnique({
        where: { nickName }
      });
      if (user) {
        userAccessLevel = user.accessLevel;
      }
    }

    // 验证访问权限
    if (userAccessLevel < book.accessLevel) {
      return res.status(403).json({ 
        message: 'Insufficient access level',
        required: book.accessLevel,
        current: userAccessLevel
      });
    }

    // 权限验证通过，返回文件
    const stream = createReadStream(filePath);
    stream.on('error', () => {
      res.status(404).json({ message: 'File not found on disk' });
    });

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

    stream.pipe(res);
  } catch (error) {
    console.error('File access error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 