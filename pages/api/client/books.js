import { prisma } from '@/lib/db';
import { buildSearchWhereClause } from '@/lib/bookSearch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { searchText, nickName } = req.query;
    
    // 获取用户访问权限
    let userAccessLevel = 0;
    let user = await prisma.user.findUnique({
      where: { nickName }
    });

    if (user) {
      user = await prisma.user.update({
        where: { nickName },
        data: { lastVisit: new Date() }
      });
      userAccessLevel = user.accessLevel;
    } else {
      // 记录访问日志
      console.log('create accessLog for new user', nickName);
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
    const whereClause = buildSearchWhereClause(searchText, {
      baseWhereClause: { unlist: false },
      userAccessLevel
    });

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
    console.error('Error in books API:', error);
    res.status(500).json({ message: error.message });
  }
} 