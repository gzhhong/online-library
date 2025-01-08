import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import axios from 'axios';

export default async function handler(req, res) {
  const { path, nickName } = req.query;
  console.log('File access request:', { path, nickName });

  if (!path || path.length === 0) {
    return res.status(400).json({ message: 'Invalid file path' });
  }

  try {
    // 验证管理员权限
    const token = req.cookies.token;
    const isAdmin = token && verifyToken(token);
    console.log('Admin check:', { isAdmin });

    // 构建文件URL路径
    const fileUrlPath = path.join('/');
    console.log('Constructed file path:', fileUrlPath);

    // 查找对应的期刊记录
    const book = await prisma.book.findFirst({
      where: {
        OR: [
          { coverPath: fileUrlPath },
          { pdfPath: fileUrlPath }
        ]
      }
    });

    if (!book) {
      console.log('Book not found for path:', fileUrlPath);
      return res.status(404).json({ message: 'File not found in database' });
    }

    // 如果不是管理员，则检查用户权限
    if (!isAdmin && nickName) {
      console.log('Checking user access:', nickName);
      const user = await prisma.user.findUnique({
        where: { nickName }
      });

      if (user) {
        console.log('User found:', { nickName, accessLevel: user.accessLevel });
        if (book && book.accessLevel > user.accessLevel) {
          console.log('Access denied:', { 
            bookLevel: book.accessLevel, 
            userLevel: user.accessLevel 
          });
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    // 构造文件ID
    const cloudPath = fileUrlPath;
    const fileId = `cloud://${process.env.COS_BUCKET}.${cloudPath}`;
    console.log('Requesting file download:', { 
      fileId,
      env: process.env.WEIXIN_ENV_ID 
    });

    // 调用微信云存储接口获取下载链接
    const response = await axios.post(
      'https://api.weixin.qq.com/tcb/batchdownloadfile',
      {
        env: process.env.WEIXIN_ENV_ID,
        file_list: [{
          fileid: fileId,
          max_age: 3600  // 链接有效期1小时
        }]
      },
      {
        headers: {
          'content-type': 'application/json'
        }
      }
    );

    console.log('Weixin API response:', {
      errcode: response.data.errcode,
      errmsg: response.data.errmsg,
      fileStatus: response.data.file_list?.[0]?.status
    });

    if (response.data.errcode !== 0) {
      throw new Error(`Failed to get download URL: ${response.data.errmsg}`);
    }

    const fileInfo = response.data.file_list[0];
    if (fileInfo.status !== 0) {
      throw new Error(`Failed to get download URL for file: ${fileInfo.errmsg}`);
    }

    console.log('Redirecting to download URL:', {
      url: fileInfo.download_url.substring(0, 50) + '...' // 只显示URL的前50个字符
    });

    // 重定向到临时链接
    res.redirect(fileInfo.download_url);

  } catch (error) {
    console.error('File access error:', {
      error: error.message,
      stack: error.stack,
      path: req.query.path,
      url: req.url
    });
    res.status(500).json({ message: 'Internal server error' });
  }
} 