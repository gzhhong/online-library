import { prisma } from '@/lib/db';
import { parseSearchText } from '@/lib/searchUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { searchText, nickName } = req.query;
    let whereClause = {
      unlist: false  // 基础条件：不显示下架的期刊
    };

    // 处理搜索条件
    if (searchText?.trim()) {
      const searchConditions = parseSearchText(searchText);
      console.log(searchConditions);
      // 如果解析出错，返回空结果
      if (searchConditions.error) {
        return res.status(200).json([]);
      }

      // 处理所有搜索条件
      const timeConditions = [];
      let accessLevelCondition = null;
      let titleCondition = null;

      searchConditions.forEach(condition => {
        switch (condition.key) {
          case 'time':
            // 收集所有时间条件
            switch (condition.opt) {
              case 'eq':
                timeConditions.push({ time: parseInt(condition.value) });
                break;
              case 'gte':
                timeConditions.push({ time: { gte: parseInt(condition.value) } });
                break;
              case 'lte':
                timeConditions.push({ time: { lte: parseInt(condition.value) } });
                break;
            }
            break;

          case 'accessLevel':
            // 处理访问权限条件
            switch (condition.opt) {
              case 'eq':
                accessLevelCondition = { accessLevel: condition.value };
                break;
              case 'gte':
                accessLevelCondition = { accessLevel: { gte: condition.value } };
                break;
              case 'lte':
                accessLevelCondition = { accessLevel: { lte: condition.value } };
                break;
            }
            break;

          case 'keywords':
            // 处理关键词搜索
            titleCondition = {
              OR: [
                { title: { contains: condition.value } },
                { description: { contains: condition.value } }
              ]
            };
            break;

          // 暂时忽略 type 条件
          case 'type':
            break;
        }
      });

      // 组合所有条件
      if (timeConditions.length > 0 || accessLevelCondition || titleCondition) {
        whereClause.AND = [
          ...timeConditions,
          ...(accessLevelCondition ? [accessLevelCondition] : []),
          ...(titleCondition ? [titleCondition] : [])
        ];
      }
    }

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

    // 添加访问权限过滤
    whereClause.accessLevel = { lte: userAccessLevel };

    console.log('=== Search Debug Info ===');
    console.log('1. Raw search text:', searchText);
    console.log('6. Final whereClause:', JSON.stringify(whereClause, null, 2));
    console.log('=====================');

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