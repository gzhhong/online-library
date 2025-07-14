import axios from 'axios';

export default async function handler(req, res) {
  console.log('Member image upload handler started');
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    console.log('Requesting upload URL for path:', path);
    // 发送请求到微信接口获取上传链接
    const response = await axios({
      method: 'POST',
      url: 'http://api.weixin.qq.com/tcb/uploadfile',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        env: process.env.CLOUD_ENV_ID,
        path: path
      }
    });

    console.log('Cloud response:', response.data);

    // 检查响应中的错误码
    if (response.data.errcode !== 0) {
      console.error('Cloud API error:', {
        path,
        error: response.data
      });
      return res.status(500).json({ 
        message: 'Failed to get upload URL',
        details: response.data
      });
    }

    // 返回微信接口的响应
    console.log('Successfully got upload URL');
    res.status(200).json(response.data);
    
  } catch (error) {
    console.error('Upload error:', {
      error: error.message,
      details: error.response?.data || error,
      stack: error.stack
    });
    res.status(500).json({ 
      message: error.message,
      details: error.response?.data || error
    });
  }
} 