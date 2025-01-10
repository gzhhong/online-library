import { prisma } from '@/lib/db';
import { parseSearchText } from '@/lib/searchUtils';
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
    let whereClause = undefined;

    if (searchText?.trim()) {
      const searchConditions = parseSearchText(searchText);
      
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

      // 只有当有实际的搜索条件时才设置 whereClause
      if (timeConditions.length > 0 || accessLevelCondition || titleCondition) {
        whereClause = {
          AND: [
            ...(timeConditions.length > 0 ? [{ OR: timeConditions }] : []),
            ...(accessLevelCondition ? [accessLevelCondition] : []),
            ...(titleCondition ? [titleCondition] : [])
          ]
        };
      }
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