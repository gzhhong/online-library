import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/db';

export default async function handler(req, res) {
  console.log('UploadSuccess request started');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 验证token
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      console.log('Token verification failed');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, accessLevel, coverPath, pdfPath } = req.body;
    console.log('Creating book record:', {
      title,
      accessLevel,
      coverPath,
      pdfPath
    });

    // 创建书籍记录
    const book = await prisma.book.create({
      data: {
        title,
        accessLevel: parseInt(accessLevel),
        coverPath,
        pdfPath,
      }
    });

    console.log('Book created successfully:', book);
    res.status(201).json(book);
  } catch (error) {
    console.error('Create book error:', {
      error: error.message,
      stack: error.stack,
      details: error.code || error.name,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: error.message });
  }
} 