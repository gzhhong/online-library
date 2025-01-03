import { verifyToken } from '@/lib/auth';
import formidable from 'formidable';
import prisma from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { uploadToCOS } from '@/lib/cos';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

export default async function handler(req, res) {
  console.log('Upload request started');
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 验证token
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 解析表单数据
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'uploads'),
      keepExtensions: true,
      multiples: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFieldsSize: 50 * 1024 * 1024, // 50MB
      filter: function ({ name, originalFilename, mimetype }) {
        // 验证文件类型
        if (name === 'cover') {
          return mimetype && mimetype.includes('image/');
        }
        if (name === 'pdf') {
          return mimetype === 'application/pdf';
        }
        return false;
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            reject(new Error('文件大小超过50MB限制'));
          } else {
            reject(err);
          }
        }
        resolve([fields, files]);
      });
    });

    // 处理文件上传
    const coverFile = files.cover[0];
    const pdfFile = files.pdf[0];

    // 生成云端路径
    const coverCloudPath = `/covers/${Date.now()}-${path.basename(coverFile.filepath)}`;
    const pdfCloudPath = `/pdfs/${Date.now()}-${path.basename(pdfFile.filepath)}`;

    // 上传文件到COS
    await uploadToCOS(coverFile.filepath, coverCloudPath);
    await uploadToCOS(pdfFile.filepath, pdfCloudPath);

    // 创建书籍记录
    const book = await prisma.book.create({
      data: {
        title: fields.title[0],
        accessLevel: parseInt(fields.accessLevel[0]),
        coverPath: coverCloudPath,
        pdfPath: pdfCloudPath,
      }
    });

    // 清理临时文件
    fs.unlinkSync(coverFile.filepath);
    fs.unlinkSync(pdfFile.filepath);

    res.status(201).json(book);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
} 