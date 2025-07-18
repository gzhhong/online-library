import { prisma } from '@/lib/db';
import { deleteFromCOS } from '@/lib/cos';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '成员ID是必需的' });
    }

    // 检查成员是否存在
    const member = await prisma.member.findUnique({
      where: { id: parseInt(id) }
    });

    if (!member) {
      return res.status(404).json({ error: '成员不存在' });
    }

    // 删除腾讯云上的图片文件
    if (member.images) {
      try {
        const imagePaths = JSON.parse(member.images);
        for (const imagePath of imagePaths) {
          // 从路径中提取文件名
          const fileName = imagePath.split('/').pop();
          const cloudPath = `/members/${fileName}`;
          
          // 使用统一的删除方法
          await deleteFromCOS(cloudPath);
          console.log('成功删除云文件:', cloudPath);
        }
      } catch (error) {
        console.error('删除图片文件错误:', error);
        // 继续执行，不因为删除文件失败而阻止数据库记录的删除
      }
    }

    // 删除成员
    await prisma.member.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      message: '成员删除成功'
    });

  } catch (error) {
    console.error('删除成员错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/members');