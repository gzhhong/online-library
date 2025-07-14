import { prisma } from '@/lib/db';
import formidable from 'formidable';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const memberId = fields.id ? parseInt(fields.id[0]) : null;
    if (!memberId) {
      return res.status(400).json({ error: '会员ID是必需的' });
    }

    // 检查会员是否存在
    const existingMember = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!existingMember) {
      return res.status(404).json({ error: '会员不存在' });
    }

    // 验证权益类型
    if (fields.benefitType && fields.benefitType[0]) {
      if (!['免费', '1级会员', '2级会员', '3级会员'].includes(fields.benefitType[0])) {
        return res.status(400).json({ error: '权益类型无效' });
      }
    }

    // 验证邮箱格式
    if (fields.email && fields.email[0]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fields.email[0])) {
        return res.status(400).json({ error: '邮箱格式无效' });
      }
    }

    // 验证手机号格式
    if (fields.phone && fields.phone[0]) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(fields.phone[0])) {
        return res.status(400).json({ error: '手机号格式无效' });
      }
    }

    // 验证文字信息长度
    if (fields.description && fields.description[0]) {
      if (fields.description[0].length > 2000) {
        return res.status(400).json({ error: '会员文字信息不能超过2000个字符' });
      }
    }

    // 处理图片上传到腾讯云
    let imagePaths = existingMember.images ? JSON.parse(existingMember.images) : [];
    
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

    // 处理行业标签更新（仅律师）
    let industryIds = [];
    if (fields.type && fields.type[0] === '律师') {
      if (fields.industryIds && fields.industryIds[0]) {
        try {
          industryIds = JSON.parse(fields.industryIds[0]);
          if (!Array.isArray(industryIds)) {
            return res.status(400).json({ error: '行业标签格式无效' });
          }
        } catch (error) {
          return res.status(400).json({ error: '行业标签格式无效' });
        }
      }
    }

    // 准备更新数据
    const updateData = {};
    
    if (fields.benefitType && fields.benefitType[0]) {
      updateData.benefitType = fields.benefitType[0];
    }
    
    if (fields.description !== undefined) {
      updateData.description = fields.description ? fields.description[0] : null;
    }
    
    if (fields.email && fields.email[0]) {
      updateData.email = fields.email[0];
    }
    
    if (fields.phone && fields.phone[0]) {
      updateData.phone = fields.phone[0];
    }
    
    if (fields.company !== undefined) {
      updateData.company = fields.company ? fields.company[0] : null;
    }
    
    if (fields.isPaid !== undefined) {
      updateData.isPaid = fields.isPaid[0] === 'true';
    }
    
    if (imagePaths.length > 0) {
      updateData.images = JSON.stringify(imagePaths);
    }

    if (fields.type && fields.type[0] === '律师') {
      updateData.industryIds = industryIds.length > 0 ? JSON.stringify(industryIds) : null;
    }

    // 更新会员信息
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: updateData
    });

    // 格式化返回数据
    const formattedMember = {
      id: updatedMember.id,
      type: updatedMember.type,
      name: updatedMember.name,
      idNumber: updatedMember.idNumber,
      benefitType: updatedMember.benefitType,
      description: updatedMember.description,
      email: updatedMember.email,
      phone: updatedMember.phone,
      company: updatedMember.company,
      images: updatedMember.images ? JSON.parse(updatedMember.images) : [],
      status: updatedMember.status,
      isPaid: updatedMember.isPaid,
      createdAt: updatedMember.createdAt,
      updatedAt: updatedMember.updatedAt,
      industryIds: updatedMember.industryIds ? JSON.parse(updatedMember.industryIds) : []
    };

    res.status(200).json({
      message: '会员信息更新成功',
      data: formattedMember
    });

  } catch (error) {
    console.error('更新会员信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 