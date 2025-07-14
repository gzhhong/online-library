import { prisma } from '@/lib/db';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '会员ID是必需的' });
    }

    // 检查会员是否存在
    const member = await prisma.member.findUnique({
      where: { id: parseInt(id) }
    });

    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }

    // 删除腾讯云上的图片文件
    if (member.images) {
      try {
        const imagePaths = JSON.parse(member.images);
        for (const imagePath of imagePaths) {
          // 从路径中提取文件名
          const fileName = imagePath.split('/').pop();
          const cloudPath = `members/${fileName}`;
          
          // 调用腾讯云删除接口
          const deleteRes = await axios({
            method: 'POST',
            url: 'http://api.weixin.qq.com/tcb/batchdeletefile',
            headers: {
              'Content-Type': 'application/json'
            },
            data: {
              env: process.env.CLOUD_ENV_ID,
              fileid_list: [cloudPath]
            }
          });

          if (deleteRes.data.errcode !== 0) {
            console.error('删除云文件失败:', deleteRes.data);
          }
        }
      } catch (error) {
        console.error('删除图片文件错误:', error);
      }
    }

    // 删除会员
    await prisma.member.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      message: '会员删除成功'
    });

  } catch (error) {
    console.error('删除会员错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 