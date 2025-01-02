import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/db';
import formidable from 'formidable';
import path from 'path';
import { mkdir } from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      multiples: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // 处理文件上传
    const coverFile = files.cover[0];
    const pdfFile = files.pdf[0];

    // 移动文件到最终位置
    const coverFilename = path.basename(coverFile.filepath);
    const pdfFilename = path.basename(pdfFile.filepath);

    const book = await prisma.book.create({
      data: {
        title: fields.title[0],
        accessLevel: parseInt(fields.accessLevel[0]),
        coverPath: `/files/${coverFilename}`,
        pdfPath: `/files/${pdfFilename}`,
      }
    });

    res.status(201).json(book);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
} 