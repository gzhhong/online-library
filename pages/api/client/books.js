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
      : { 
        year: null, 
        issue: null, 
        keyword: null, 
        accessLevel: null, 
        accessLevelOp: null 
      };
    
    const { 
      year, 
      issue, 
      keyword, 
      accessLevel: searchAccessLevel,  // 重命名以避免冲突
      accessLevelOp 
    } = searchConditions;

    // 更新用户最后访问时间
    let user = await prisma.user.findUnique({
      where: { nickName }
    });

    let userAccessLevel = 0;  // 重命名用户的访问权限变量

    if (user) {
      // 更新用户访问时间
      user = await prisma.user.update({
        where: { nickName },
        data: { lastVisit: new Date() }
      });
      userAccessLevel = user.accessLevel;
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
    const where = {
      unlist: false, // 只返回未下架的期刊
      accessLevel: { lte: userAccessLevel }  // 用户只能看到自己权限范围内的期刊
    };

    if (year) {
      where.year = year;
    }

    if (issue) {
      where.issue = issue;
    }

    // 处理访问权限条件
    if (searchAccessLevel !== null) {
      switch (accessLevelOp) {
        case 'gte':
          where.accessLevel = { 
            gte: searchAccessLevel,
            lte: userAccessLevel  // 保持在用户权限范围内
          };
          break;
        case 'lte':
          where.accessLevel = { 
            lte: Math.min(searchAccessLevel, userAccessLevel)  // 取较小值
          };
          break;
        case 'eq':
        default:
          if (searchAccessLevel <= userAccessLevel) {
            where.accessLevel = searchAccessLevel;
          }
      }
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } }
      ];
    }

    const books = await prisma.book.findMany({
      where,
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