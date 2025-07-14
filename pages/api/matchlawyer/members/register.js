import { prisma } from '@/lib/db';
import formidable from 'formidable';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  console.log('user try to register');

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 200 * 1024, // 200KB
      maxFiles: 3,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // 验证必填字段
    const requiredFields = ['type', 'name', 'idNumber', 'benefitType', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!fields[field] || !fields[field][0]) {
        return res.status(400).json({ error: `${field} 是必填字段` });
      }
    }

    // 验证会员类型
    if (!['企业', '律师'].includes(fields.type[0])) {
      return res.status(400).json({ error: '会员类型必须是"企业"或"律师"' });
    }

    // 验证权益类型
    if (!['免费', '1级会员', '2级会员', '3级会员'].includes(fields.benefitType[0])) {
      return res.status(400).json({ error: '权益类型无效' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fields.email[0])) {
      return res.status(400).json({ error: '邮箱格式无效' });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(fields.phone[0])) {
      return res.status(400).json({ error: '手机号格式无效' });
    }

    // 验证文字信息长度（最长2K汉字）
    if (fields.description && fields.description[0]) {
      if (fields.description[0].length > 2000) {
        return res.status(400).json({ error: '会员文字信息不能超过2000个字符' });
      }
    }

    // 处理图片上传到腾讯云
    const imagePaths = [];
    if (files.images) {
      const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
      
      for (const file of imageFiles) {
        // 验证文件大小（80KB）
        if (file.size > 80 * 1024) {
          return res.status(400).json({ error: '每张图片不能超过80KB' });
        }

        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ error: '只支持 JPG, PNG, GIF 格式的图片' });
        }

        // 生成文件路径
        const ext = file.originalFilename.split('.').pop();
        const fileName = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const cloudPath = `members/${fileName}`;

        try {
          // 获取上传链接
          const uploadRes = await fetch(`${req.headers.host ? `http://${req.headers.host}` : ''}/api/matchlawyer/members/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: cloudPath }),
          });

          if (!uploadRes.ok) {
            throw new Error('获取上传链接失败');
          }

          const uploadData = await uploadRes.json();

          // 上传到腾讯云
          const formData = new FormData();
          formData.append('key', cloudPath);
          formData.append('Signature', uploadData.authorization);
          formData.append('x-cos-security-token', uploadData.token);
          formData.append('x-cos-meta-fileid', uploadData.cos_file_id);
          formData.append('file', file);

          const cosRes = await fetch(uploadData.url, {
            method: 'POST',
            body: formData,
          });

          if (!cosRes.ok) {
            throw new Error('图片上传到腾讯云失败');
          }

          // 保存云存储路径
          imagePaths.push(`/members/${fileName}`);
        } catch (error) {
          console.error('图片上传错误:', error);
          return res.status(500).json({ error: `图片上传失败: ${error.message}` });
        }
      }
    }

    // 验证行业标签（仅律师需要）
    let industryIds = [];
    if (fields.type[0] === '律师') {
      if (!fields.industryIds || !fields.industryIds[0]) {
        return res.status(400).json({ error: '律师必须选择行业标签' });
      }

      try {
        industryIds = JSON.parse(fields.industryIds[0]);
        if (!Array.isArray(industryIds) || industryIds.length === 0) {
          return res.status(400).json({ error: '行业标签不能为空' });
        }
      } catch (error) {
        return res.status(400).json({ error: '行业标签格式无效' });
      }
    }

    // 检查ID是否已存在
    const existingMember = await prisma.member.findUnique({
      where: { idNumber: fields.idNumber[0] }
    });

    if (existingMember) {
      return res.status(400).json({ error: '该ID已存在' });
    }

    // 创建会员
    const member = await prisma.member.create({
      data: {
        type: fields.type[0],
        name: fields.name[0],
        idNumber: fields.idNumber[0],
        benefitType: fields.benefitType[0],
        description: fields.description ? fields.description[0] : null,
        email: fields.email[0],
        phone: fields.phone[0],
        images: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
        industryIds: industryIds.length > 0 ? JSON.stringify(industryIds) : null,
        status: 0, // 待审核
        isPaid: false,
      }
    });

    res.status(201).json({
      message: '会员注册成功，等待审核',
      data: {
        id: member.id,
        name: member.name,
        type: member.type,
        status: member.status
      }
    });

  } catch (error) {
    console.error('会员注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 