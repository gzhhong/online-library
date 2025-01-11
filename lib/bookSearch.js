import { parseSearchText } from './searchUtils';

export function buildSearchWhereClause(searchText, options = {}) {
  const {
    baseWhereClause = {},  // 基础查询条件
    userAccessLevel      // 用户访问权限级别
  } = options;

  let whereClause = { ...baseWhereClause };

  if (searchText?.trim()) {
    const searchConditions = parseSearchText(searchText);
    
    // 如果解析出错，返回 null
    if (searchConditions.error) {
      return null;
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

  // 添加访问权限过滤
  if (typeof userAccessLevel === 'number') {
    whereClause.accessLevel = { lte: userAccessLevel };
  }

  return whereClause;
} 