import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/client/books';

// 模拟 Prisma 客户端
jest.mock('@/lib/db', () => {
  const { createMockPrisma } = jest.requireActual('../../../utils/mockPrisma');
  return createMockPrisma();
});

// 导入测试工具
const { clearMockDB, addMockData } = jest.requireActual('../../../utils/mockPrisma');

describe('Books API', () => {
  beforeEach(() => {
    clearMockDB();
  });

  test('基本搜索：返回所有未下架的期刊', async () => {
    // 准备测试数据
    addMockData.books([
      { 
        title: '期刊1', 
        accessLevel: 0, 
        unlist: false,
        coverPath: '/covers/1.jpg',
        pdfPath: '/pdfs/1.pdf',
        coverFileId: 'cover1',
        pdfFileId: 'pdf1'
      },
      { 
        title: '期刊2', 
        accessLevel: 0, 
        unlist: false,
        coverPath: '/covers/2.jpg',
        pdfPath: '/pdfs/2.pdf',
        coverFileId: 'cover2',
        pdfFileId: 'pdf2'
      },
      { 
        title: '期刊3', 
        accessLevel: 0, 
        unlist: true,  // 已下架的期刊
        coverPath: '/covers/3.jpg',
        pdfPath: '/pdfs/3.pdf',
        coverFileId: 'cover3',
        pdfFileId: 'pdf3'
      }
    ]);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: ''
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const books = JSON.parse(res._getData());
    expect(books).toHaveLength(2);
    expect(books.every(book => !book.unlist)).toBe(true);
  });

  test('访问权限限制：用户只能看到其权限范围内的期刊', async () => {
    // 准备测试数据
    addMockData.users([{
      nickName: 'testUser',
      accessLevel: 2
    }]);

    addMockData.books([
      { 
        title: '期刊1', 
        accessLevel: 1, 
        unlist: false,
        coverPath: '/covers/1.jpg',
        pdfPath: '/pdfs/1.pdf',
        coverFileId: 'cover1',
        pdfFileId: 'pdf1'
      },
      { 
        title: '期刊2', 
        accessLevel: 2, 
        unlist: false,
        coverPath: '/covers/2.jpg',
        pdfPath: '/pdfs/2.pdf',
        coverFileId: 'cover2',
        pdfFileId: 'pdf2'
      },
      { 
        title: '期刊3', 
        accessLevel: 3, 
        unlist: false,
        coverPath: '/covers/3.jpg',
        pdfPath: '/pdfs/3.pdf',
        coverFileId: 'cover3',
        pdfFileId: 'pdf3'
      }
    ]);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: ''
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const books = JSON.parse(res._getData());
    expect(books).toHaveLength(2);
    expect(books.every(book => book.accessLevel <= 2)).toBe(true);
  });

  test('搜索：支持年份和期号过滤', async () => {
    addMockData.books([
      { title: '期刊1', year: 2023, issue: 1, unlist: false, accessLevel: 0 },
      { title: '期刊2', year: 2023, issue: 2, unlist: false, accessLevel: 0 },
      { title: '期刊3', year: 2024, issue: 1, unlist: false, accessLevel: 0 }
    ]);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: '2023年1月'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const books = JSON.parse(res._getData());
    expect(books).toHaveLength(1);
    expect(books[0].year).toBe(2023);
    expect(books[0].issue).toBe(1);
  });

  test('搜索：支持关键词搜索', async () => {
    addMockData.books([
      { 
        title: '测试期刊', 
        description: '这是一本好书',
        unlist: false,
        accessLevel: 0 
      },
      { 
        title: '其他期刊', 
        description: '测试描述',
        unlist: false,
        accessLevel: 0 
      },
      { 
        title: '普通期刊', 
        description: '普通描述',
        unlist: false,
        accessLevel: 0 
      }
    ]);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        nickName: 'testUser',
        searchText: '测试'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const books = JSON.parse(res._getData());
    expect(books).toHaveLength(2);
    expect(books.some(book => book.title.includes('测试'))).toBe(true);
    expect(books.some(book => book.description.includes('测试'))).toBe(true);
  });
}); 