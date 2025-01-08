import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/client/books';
import prisma from '@/lib/db';

// 模拟 Prisma 客户端
jest.mock('@/lib/db', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  accessLog: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  book: {
    findMany: jest.fn(),
  },
}));

describe('Books API', () => {
  beforeEach(() => {
    // 清除所有模拟的调用记录
    jest.clearAllMocks();
  });

  test('返回405当请求方法不是GET', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: 'Method not allowed',
      })
    );
  });

  test('基本搜索：返回所有未下架的期刊', async () => {
    const mockBooks = [
      { id: 1, title: '期刊1', accessLevel: 0, unlist: false },
      { id: 2, title: '期刊2', accessLevel: 0, unlist: false },
    ];

    // 模拟用户查询
    prisma.user.findUnique.mockResolvedValue(null);
    // 模拟访问日志
    prisma.accessLog.findUnique.mockResolvedValue(null);
    prisma.accessLog.create.mockResolvedValue({});
    // 模拟书籍查询结果
    prisma.book.findMany.mockResolvedValue(mockBooks);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: ''
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockBooks);
    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        unlist: false,
        accessLevel: { lte: 0 }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });

  test('搜索带年份和期数', async () => {
    const mockBooks = [
      { id: 1, title: '期刊1', year: 2024, issue: 1 },
    ];

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.accessLog.findUnique.mockResolvedValue(null);
    prisma.accessLog.create.mockResolvedValue({});
    prisma.book.findMany.mockResolvedValue(mockBooks);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: '2024 1期'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockBooks);
    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        unlist: false,
        accessLevel: { lte: 0 },
        year: 2024,
        issue: 1
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });

  test('搜索带访问权限', async () => {
    const mockBooks = [
      { id: 1, title: '期刊1', accessLevel: 2 },
    ];

    // 模拟一个访问权限为3的用户
    prisma.user.findUnique.mockResolvedValue({ accessLevel: 3 });
    prisma.user.update.mockResolvedValue({ accessLevel: 3 });
    prisma.book.findMany.mockResolvedValue(mockBooks);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: '2级以上期刊'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockBooks);
    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        unlist: false,
        accessLevel: { 
          gte: 2,
          lte: 3  // 用户的访问权限
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });

  test('搜索带关键词', async () => {
    const mockBooks = [
      { id: 1, title: '意林期刊' },
    ];

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.accessLog.findUnique.mockResolvedValue(null);
    prisma.accessLog.create.mockResolvedValue({});
    prisma.book.findMany.mockResolvedValue(mockBooks);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: '意林'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockBooks);
    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        unlist: false,
        accessLevel: { lte: 0 },
        OR: [
          { title: { contains: '意林' } },
          { description: { contains: '意林' } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });

  test('访问权限限制：2级用户搜索2级以上期刊', async () => {
    const mockBooks = [
      { 
        id: 1, 
        title: '期刊1', 
        year: 2024, 
        issue: 10, 
        accessLevel: 2 
      },
      { 
        id: 2, 
        title: '期刊2', 
        year: 2024, 
        issue: 10, 
        accessLevel: 3  // 这本书不应该被返回给用户
      }
    ];

    // 模拟一个访问权限为2的用户
    prisma.user.findUnique.mockResolvedValue({ accessLevel: 2 });
    prisma.user.update.mockResolvedValue({ accessLevel: 2 });
    // Prisma 应该只返回用户有权限看到的书
    prisma.book.findMany.mockResolvedValue([mockBooks[0]]);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: '2024年10月的2级以上期刊'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([mockBooks[0]]);  // 只应该返回第一本书
    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        unlist: false,
        year: 2024,
        issue: 10,
        accessLevel: { 
          gte: 2,    // 搜索条件：2级以上
          lte: 2     // 用户权限限制：最多2级
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 验证返回的书籍不包含超出用户权限的内容
    const returnedBooks = JSON.parse(res._getData());
    expect(returnedBooks).toHaveLength(1);  // 应该只返回一本书
    returnedBooks.forEach(book => {
      expect(book.accessLevel).toBeLessThanOrEqual(2);
    });
  });
}); 