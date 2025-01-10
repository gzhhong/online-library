// 创建模拟数据存储
const mockDB = {
  books: [],
  users: [],
  accessLogs: []
};

// 创建模拟 Prisma 客户端
export const createMockPrisma = () => {
  const mockPrismaClient = {
    book: {
      findMany: jest.fn(async (query) => {
        let results = [...mockDB.books];
        
        if (query.where) {
          // 基本过滤条件
          if (query.where.unlist === false) {
            results = results.filter(book => !book.unlist);
          }

          // 时间过滤
          if (query.where.time) {
            if (typeof query.where.time === 'number') {
              results = results.filter(book => book.time === query.where.time);
            }
            if (query.where.time.gte) {
              results = results.filter(book => book.time >= query.where.time.gte);
            }
            if (query.where.time.lte) {
              results = results.filter(book => book.time <= query.where.time.lte);
            }
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
              // 处理 OR 条件（时间范围）
              if (condition.OR) {
                results = results.filter(book => 
                  condition.OR.some(orCondition => {
                    // 处理时间条件
                    if ('time' in orCondition) {
                      if (typeof orCondition.time === 'number') {
                        return book.time === orCondition.time;
                      }
                      if (orCondition.time?.gte) {
                        return book.time >= orCondition.time.gte;
                      }
                      if (orCondition.time?.lte) {
                        return book.time <= orCondition.time.lte;
                      }
                    }
                    // 处理标题和描述搜索
                    if ('title' in orCondition || 'description' in orCondition) {
                      if (orCondition.title?.contains) {
                        return book.title.toLowerCase().includes(orCondition.title.contains.toLowerCase());
                      }
                      if (orCondition.description?.contains) {
                        return book.description?.toLowerCase().includes(orCondition.description.contains.toLowerCase());
                      }
                    }
                    return false;
                  })
                );
              }
            });
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
      findUnique: jest.fn(async ({ where }) => {
        return mockDB.users.find(u => u.nickName === where.nickName);
      }),
      update: jest.fn(async ({ where, data }) => {
        const userIndex = mockDB.users.findIndex(u => u.nickName === where.nickName);
        if (userIndex === -1) return null;
        
        mockDB.users[userIndex] = {
          ...mockDB.users[userIndex],
          ...data
        };
        return mockDB.users[userIndex];
      })
    },
    accessLog: {
      findUnique: jest.fn(async ({ where }) => {
        return mockDB.accessLogs.find(l => l.nickName === where.nickName);
      }),
      update: jest.fn(async ({ where, data }) => {
        const logIndex = mockDB.accessLogs.findIndex(l => l.nickName === where.nickName);
        if (logIndex === -1) return null;
        
        mockDB.accessLogs[logIndex] = {
          ...mockDB.accessLogs[logIndex],
          ...data,
          visitCount: data.visitCount?.increment 
            ? mockDB.accessLogs[logIndex].visitCount + 1 
            : mockDB.accessLogs[logIndex].visitCount
        };
        return mockDB.accessLogs[logIndex];
      }),
      create: jest.fn(async ({ data }) => {
        const newLog = { ...data };
        mockDB.accessLogs.push(newLog);
        return newLog;
      })
    }
  };

  return {
    prisma: mockPrismaClient
  };
};

// 清理模拟数据
export const clearMockDB = () => {
  mockDB.books = [];
  mockDB.users = [];
  mockDB.accessLogs = [];
};

// 添加测试数据的辅助函数
export const addMockData = {
  books: (books) => mockDB.books.push(...books),
  users: (users) => mockDB.users.push(...users),
  accessLogs: (logs) => mockDB.accessLogs.push(...logs)
}; 