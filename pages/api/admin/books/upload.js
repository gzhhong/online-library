import { verifyToken } from '@/lib/auth';
import formidable from 'formidable';
import prisma from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { cosConfig, initCOS } from '@/lib/cos';

export const config = {
  api: {
    bodyParser: false,
  },
};

// 上传文件到COS
async function uploadToCOS(cos, localPath, cloudPath) {
  // 获取文件元数据
  const metaRes = await new Promise((resolve, reject) => {
    request({
      url: 'http://api.weixin.qq.com/_/cos/metaid/encode',
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        openid: '', // 管理端上传使用空字符串
        bucket: cosConfig.Bucket,
        paths: [cloudPath]
      })
    }, function(err, response) {
      if (err) reject(err);
      resolve(JSON.parse(response.body));
    });
  });

  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudPath,
      StorageClass: 'STANDARD',
      Body: fs.createReadStream(localPath),
      ContentLength: fs.statSync(localPath).size,
      Headers: {
        'x-cos-meta-fileid': metaRes.respdata.x_cos_meta_field_strs[0]
      }
    }, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 验证token
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 初始化COS
    const cos = await initCOS();

    // 解析表单数据
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'uploads'),
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

    // 生成云端路径
    const coverCloudPath = `/covers/${Date.now()}-${path.basename(coverFile.filepath)}`;
    const pdfCloudPath = `/pdfs/${Date.now()}-${path.basename(pdfFile.filepath)}`;

    // 上传文件到COS
    await uploadToCOS(cos, coverFile.filepath, coverCloudPath);
    await uploadToCOS(cos, pdfFile.filepath, pdfCloudPath);

    // 创建书籍记录
    const book = await prisma.book.create({
      data: {
        title: fields.title[0],
        accessLevel: parseInt(fields.accessLevel[0]),
        coverPath: `/files${coverCloudPath}`,
        pdfPath: `/files${pdfCloudPath}`,
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