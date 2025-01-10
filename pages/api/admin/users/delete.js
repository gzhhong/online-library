import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: '用户删除成功' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
} 