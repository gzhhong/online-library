import prisma from '@/lib/db';
import { parseSearchText } from '@/lib/searchUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  console.log('just in the handler of api/client/books');

  try {
    const { nickName, searchText } = req.query;
    // 只有当 searchText 存在且不为空字符串时才解析搜索条件
    const searchConditions = searchText?.trim() 
      ? parseSearchText(searchText)
      : { year: null, issue: null, keyword: null };
    
    const { year, issue, keyword } = searchConditions;

    // 更新用户最后访问时间
    let user = await prisma.user.findUnique({
      where: { nickName }
    });

    let accessLevel = 0;

    if (user) {
      // 更新用户访问时间
      user = await prisma.user.update({
        where: { nickName },
        data: { lastVisit: new Date() }
      });
      accessLevel = user.accessLevel;
    } else {
      // 记录访问日志
      let accessLog = await prisma.accessLog.findUnique({
        where: { nickName }
      });

      if (accessLog) {
        await prisma.accessLog.update({
          where: { nickName },
          data: {
            lastVisit: new Date(),
            visitCount: { increment: 1 }
          }
        });
      } else {
        console.log('create accessLog for new user', nickName);
        await prisma.accessLog.create({
          data: {
            nickName,
            firstVisit: new Date(),
            lastVisit: new Date(),
            visitCount: 1
          }
        });
      }
    }

    // 构建查询条件
    const searchFilters = [
      { accessLevel: { lte: accessLevel } },
      { unlist: false }
    ];

    // 只添加有值的搜索条件
    if (year !== null) searchFilters.push({ year });
    if (issue !== null) searchFilters.push({ issue });
    if (searchConditions.accessLevel !== null) {
      const levelFilter = { accessLevel: {} };
      switch (searchConditions.accessLevelOp) {
        case 'gte':
          levelFilter.accessLevel.gte = searchConditions.accessLevel;
          break;
        case 'lte':
          levelFilter.accessLevel.lte = searchConditions.accessLevel;
          break;
        case 'eq':
          levelFilter.accessLevel.equals = searchConditions.accessLevel;
          break;
      }
      searchFilters.push(levelFilter);
    }
    if (keyword !== null) {
      searchFilters.push({
        OR: [
          { title: { contains: keyword } },
          { description: { contains: keyword } }
        ]
      });
    }

    const books = await prisma.book.findMany({
      where: {
        AND: searchFilters
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
} 