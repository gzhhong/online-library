import { prisma } from '@/lib/db';
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

    const { id, nickName, accessLevel, name, title, organization, isEditing } = req.body;

    // 构建通用的数据对象
    const userData = {
      accessLevel,
      name,
      title,
      organization,
      lastVisit: new Date()
    };

    if (isEditing) {
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: userData
      });
      return res.status(200).json(user);
    }

    // 直接创建新用户
    const user = await prisma.user.create({
      data: {
        ...userData,
        nickName,
      }
    });

    res.status(201).json(user);
  } catch (error) {
    // 处理唯一约束违反错误
    if (error.code === 'P2002' && error.meta?.target?.includes('nickName')) {
      return res.status(400).json({ 
        message: `微信昵称 "${nickName}" 已存在，请使用其他昵称` 
      });
    }
    res.status(500).json({ message: error.message });
  }
} 