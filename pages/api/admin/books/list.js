import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!verifyToken(token)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { searchText } = req.query;
    const searchConditions = searchText?.trim() 
        ? parseSearchText(searchText)
        : { year: null, issue: null, keyword: null, accessLevel: null, accessLevelOp: null };
    
    const { year, issue, keyword, accessLevel, accessLevelOp } = searchConditions;

    // 构建查询条件
    const searchFilters = [];

    // 添加有值的搜索条件
    if (year !== null) searchFilters.push({ year });
    if (issue !== null) searchFilters.push({ issue });
    if (keyword !== null) {
        searchFilters.push({
            OR: [
                { title: { contains: keyword } },
                { description: { contains: keyword } }
            ]
        });
    }
    
    // 处理访问权限搜索
    if (accessLevel !== null) {
        const levelFilter = { accessLevel: {} };
        switch (accessLevelOp) {
            case 'gte':
                levelFilter.accessLevel.gte = accessLevel;
                break;
            case 'lte':
                levelFilter.accessLevel.lte = accessLevel;
                break;
            case 'eq':
                levelFilter.accessLevel.equals = accessLevel;
                break;
        }
        searchFilters.push(levelFilter);
    }

    const books = await prisma.book.findMany({
        where: searchFilters.length > 0 ? { AND: searchFilters } : undefined,
        orderBy: {
            createdAt: 'desc'
        }
    });
    
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 