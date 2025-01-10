import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFromCOS } from '@/lib/cos';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 验证token
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'Book ID is required' });
    }

    // 获取书籍信息
    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) }
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // 从COS删除文件
    const coverPath = book.coverPath;
    const pdfPath = book.pdfPath;
    
    await deleteFromCOS(coverPath);
    await deleteFromCOS(pdfPath);

    // 从数据库删除记录
    await prisma.book.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message });
  }
} 