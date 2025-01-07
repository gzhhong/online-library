import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, unlist } = req.body;
    
    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: { unlist }
    });

    res.status(200).json(book);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ message: error.message });
  }
} 