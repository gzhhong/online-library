import { prisma } from '@/lib/db';

// 生成12位随机ID（大写字母和数字）
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, parentId } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    let level = 0;
    let parent = null;

    // 如果有父节点，获取父节点信息
    if (parentId && parentId !== 'null') {
      // 特殊处理：如果parentId是000000000000，检查根节点是否存在，不存在则创建
      if (parentId === '000000000000') {
        parent = await prisma.industry.findUnique({
          where: { id: '000000000000' }
        });

        if (!parent) {
          // 创建根节点
          parent = await prisma.industry.create({
            data: {
              id: '000000000000',
              title: '法学',
              description: '节点为根节点，不能编辑',
              level: 0,
              parentId: null
            }
          });
          console.log('自动创建根节点:', parent);
        }
      } else {
        parent = await prisma.industry.findUnique({
          where: { id: parentId }
        });

        if (!parent) {
          return res.status(404).json({ error: 'Parent industry not found' });
        }
      }

      level = parent.level + 1;
    }

    // 生成唯一ID
    let id;
    let isUnique = false;
    while (!isUnique) {
      id = generateId();
      const existing = await prisma.industry.findUnique({
        where: { id }
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // 创建新标签
    const newIndustry = await prisma.industry.create({
      data: {
        id,
        title: title.trim(),
        description: description?.trim() || null,
        level,
        parentId: parentId === 'null' ? null : parentId
      },
      include: {
        parent: true,
        children: true
      }
    });

    res.status(201).json({
      success: true,
      data: newIndustry
    });
  } catch (error) {
    console.error('Error creating industry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 

export default withAuth(handler, '/matchlawyer/industries');