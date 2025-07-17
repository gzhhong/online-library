import { prisma } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取所有标签，按层级和创建时间排序
    let industries = await prisma.industry.findMany({
      orderBy: [
        { level: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        children: true,
        parent: true
      }
    });

    // 如果没有数据，初始化根节点
    if (industries.length === 0) {
      console.log('数据库为空，正在初始化根节点...');
      
      const rootIndustry = await prisma.industry.create({
        data: {
          id: '000000000000',
          title: '法学',
          description: '这是根标签，请不要编辑或删除',
          level: 0,
          parentId: null
        },
        include: {
          children: true,
          parent: true
        }
      });

      console.log('根标签创建成功:', rootIndustry);
      industries = [rootIndustry];
    }

    // 构建树形结构
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const treeData = buildTree(industries);

    res.status(200).json({
      success: true,
      data: treeData,
      flat: industries
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 