import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cosConfig, initCOS } from '@/lib/cos';

// 从COS获取文件
async function getFileFromCOS(cos, cloudPath) {
  return new Promise((resolve, reject) => {
    cos.getObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudPath,
      Output: process.stdout
    }, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export default async function handler(req, res) {
  const { path, nickName } = req.query;
  if (!path || path.length === 0) {
    return res.status(400).json({ message: 'Invalid file path' });
  }

  try {
    // 先检查是否是管理员（通过token验证）
    const token = req.cookies.token;
    const isAdmin = token && verifyToken(token);

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

    // 如果不是管理员，才检查用户权限
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

      // 验证访问权限
      if (userAccessLevel < book.accessLevel) {
        return res.status(403).json({ 
          message: 'Insufficient access level',
          required: book.accessLevel,
          current: userAccessLevel
        });
      }
    }

    // 到这里，要么是管理员，要么是有权限的用户，都可以访问文件
    const cos = await initCOS();

    // 构造COS中的文件路径（移除/files前缀）
    const cloudPath = fileUrlPath.replace('/files', '');

    // 设置适当的Content-Type
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

    // 从COS获取文件并返回
    const result = await getFileFromCOS(cos, cloudPath);
    result.Body.pipe(res);

  } catch (error) {
    console.error('File access error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 