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

    const { 
      title, 
      accessLevel, 
      coverPath, 
      pdfPath,
      coverFileId,
      pdfFileId,
      year,
      issue,
      description 
    } = req.body;

    // 确保路径以'/'开头，以符合文件服务的要求
    const normalizedCoverPath = coverPath.startsWith('/') ? coverPath : `/${coverPath}`;
    const normalizedPdfPath = pdfPath.startsWith('/') ? pdfPath : `/${pdfPath}`;

    console.log('Normalized paths:', {
      originalCoverPath: coverPath,
      originalPdfPath: pdfPath,
      normalizedCoverPath,
      normalizedPdfPath
    });

    // 创建书籍记录
    const book = await prisma.book.create({
      data: {
        title,
        accessLevel: parseInt(accessLevel),
        coverPath: normalizedCoverPath,  // 存入数据库的路径需要以'/'开头
        pdfPath: normalizedPdfPath,      // 存入数据库的路径需要以'/'开头
        coverFileId,                 // 保存文件ID
        pdfFileId,                   // 保存文件ID
        year: year ? parseInt(year) : null,
        issue: issue ? parseInt(issue) : null,
        description: description || null
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