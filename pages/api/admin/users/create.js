import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { nickName, accessLevel } = req.body;

    const user = await prisma.user.upsert({
      where: { nickName },
      update: { 
        accessLevel,
        lastVisit: new Date()
      },
      create: {
        nickName,
        accessLevel,
        lastVisit: new Date()
      }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 