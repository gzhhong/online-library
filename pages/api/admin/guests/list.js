import { prisma } from '@/lib/db';
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

    const guests = await prisma.accessLog.findMany({
      orderBy: {
        lastVisit: 'desc'
      }
    });
    
    res.status(200).json(guests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 