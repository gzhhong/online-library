import { prisma } from '@/lib/db';
import { buildSearchWhereClause } from '@/lib/bookSearch';
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
    
    // 构建查询条件
    const whereClause = buildSearchWhereClause(searchText);

    // 如果解析出错，返回空结果
    if (whereClause === null) {
      return res.status(200).json([]);
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { issue: 'desc' }
      ]
    });

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}