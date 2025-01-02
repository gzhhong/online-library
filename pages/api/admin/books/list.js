import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 