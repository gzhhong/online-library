import { verifyToken } from '@/lib/auth';
import axios from 'axios';

export default async function handler(req, res) {
  const { file_id } = req.query;
  const fileIdDecoded = decodeURIComponent(file_id);
  console.log('MatchLawyer file access request:', { fileIdDecoded });

  if (!file_id) {
    return res.status(400).json({ message: 'file_id is required' });
  }

  try {
    // 验证管理员权限
    const token = req.cookies.token;
    console.log('Token from cookies:', { token });

    const isAdmin = token && verifyToken(token);
    console.log('Admin check:', { 
      hasToken: !!token,
      verifyResult: token ? verifyToken(token) : null,
      isAdmin 
    });

    // 如果不是管理员，则拒绝访问
    if (!isAdmin) {
      console.log('Access denied: Admin only');
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Requesting file download:', { 
      fileIdDecoded,
      env: process.env.CLOUD_ENV_ID 
    });

    // 调用微信云存储接口获取下载链接
    const response = await axios.post(
      'http://api.weixin.qq.com/tcb/batchdownloadfile',
      {
        env: process.env.CLOUD_ENV_ID,
        file_list: [{
          fileid: fileIdDecoded,
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

    // 检查URL是否需要编码
    let redirectUrl = encodeURI(fileInfo.download_url);

    console.log('Redirecting to download URL:', {
      originalUrl: fileInfo.download_url,
      encodedUrl: redirectUrl
    });

    // 重定向到临时链接
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('MatchLawyer file access error:', {
      error: error.message,
      stack: error.stack,
      file_id: req.query.file_id,
      url: req.url
    });
    res.status(500).json({ message: 'Internal server error' });
  }
} 