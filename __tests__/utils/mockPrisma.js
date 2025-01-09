// 创建模拟数据存储
const mockDB = {
  books: [],
  users: [],
  accessLogs: []
};

// 创建模拟 Prisma 客户端
const createMockPrisma = () => ({
  __esModule: true,
  default: {
    book: {
      findMany: jest.fn(async (query) => {
        let results = [...mockDB.books];
        
        if (query.where) {
          // 基本过滤条件
          if (query.where.unlist === false) {
            results = results.filter(book => !book.unlist);
          }

          // 年份和期号过滤
          if (query.where.year) {
            results = results.filter(book => book.year === query.where.year);
          }
          if (query.where.issue) {
            results = results.filter(book => book.issue === query.where.issue);
          }

          // 访问权限过滤
          if (query.where.accessLevel) {
            if (query.where.accessLevel.lte) {
              results = results.filter(book => book.accessLevel <= query.where.accessLevel.lte);
            }
            if (query.where.accessLevel.gte) {
              results = results.filter(book => book.accessLevel >= query.where.accessLevel.gte);
            }
            if (typeof query.where.accessLevel === 'number') {
              results = results.filter(book => book.accessLevel === query.where.accessLevel);
            }
          }

          // AND 条件
          if (query.where.AND) {
            query.where.AND.forEach(condition => {
              if (condition.accessLevel?.lte) {
                results = results.filter(book => book.accessLevel <= condition.accessLevel.lte);
              }
              if (condition.accessLevel?.gte) {
                results = results.filter(book => book.accessLevel >= condition.accessLevel.gte);
              }
            });
          }

          // OR 条件（用于关键词搜索）
          if (query.where.OR) {
            results = results.filter(book => 
              query.where.OR.some(condition => {
                if (condition.title?.contains) {
                  return book.title.includes(condition.title.contains);
                }
                if (condition.description?.contains) {
                  return book.description?.includes(condition.description.contains);
                }
                return false;
              })
            );
          }
        }

        // 排序
        if (query.orderBy) {
          const orderFields = Array.isArray(query.orderBy) ? query.orderBy : [query.orderBy];
          results.sort((a, b) => {
            for (const order of orderFields) {
              for (const [field, direction] of Object.entries(order)) {
                if (a[field] === b[field]) continue;
                
                const modifier = direction === 'desc' ? -1 : 1;
                if (a[field] == null) return 1 * modifier;
                if (b[field] == null) return -1 * modifier;
                return a[field] < b[field] ? -1 * modifier : 1 * modifier;
              }
            }
            return 0;
          });
        }

        return results;
      }),
      createMany: jest.fn(async ({data}) => {
        mockDB.books.push(...data);
      })
    },
    user: {
      findUnique: jest.fn(async ({where}) => {
        const user = mockDB.users.find(u => u.nickName === where.nickName);
        return user ? {
          ...user,
          lastVisit: new Date(),
          createdAt: new Date()
        } : null;
      }),
      update: jest.fn(async ({where, data}) => {
        const userIndex = mockDB.users.findIndex(u => u.nickName === where.nickName);
        if (userIndex >= 0) {
          mockDB.users[userIndex] = { ...mockDB.users[userIndex], ...data };
          return mockDB.users[userIndex];
        }
        return null;
      })
    },
    accessLog: {
      findUnique: jest.fn(async ({where}) => {
        return mockDB.accessLogs.find(log => log.nickName === where.nickName);
      }),
      create: jest.fn(async ({data}) => {
        const log = { ...data, id: mockDB.accessLogs.length + 1 };
        mockDB.accessLogs.push(log);
        return log;
      }),
      update: jest.fn(async ({where, data}) => {
        const logIndex = mockDB.accessLogs.findIndex(log => log.nickName === where.nickName);
        if (logIndex >= 0) {
          mockDB.accessLogs[logIndex] = { ...mockDB.accessLogs[logIndex], ...data };
          return mockDB.accessLogs[logIndex];
        }
        return null;
      })
    }
  }
});

// 清理模拟数据
const clearMockDB = () => {
  mockDB.books = [];
  mockDB.users = [];
  mockDB.accessLogs = [];
};

// 添加测试数据的辅助函数
const addMockData = {
  books: (books) => mockDB.books.push(...books),
  users: (users) => mockDB.users.push(...users),
  accessLogs: (logs) => mockDB.accessLogs.push(...logs)
};

module.exports = {
  createMockPrisma,
  clearMockDB,
  addMockData
}; 