import { verifyToken } from '@/lib/auth';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 验证token
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    // 发送请求到微信接口获取上传链接
    const response = await axios({
      method: 'POST',
      url: 'http://api.weixin.qq.com/tcb/uploadfile',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        env: process.env.TENCENTCLOUD_RUNENV,
        path: path
      }
    });

    // 返回微信接口的响应
    res.status(200).json(response.data);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: error.message,
      details: error.response?.data || error
    });
  }
} 