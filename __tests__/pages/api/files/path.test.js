import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/files/[...path]';
import axios from 'axios';
import { verifyToken } from '@/lib/auth';

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn()
}));

// Mock axios
jest.mock('axios');

// Mock Prisma
jest.mock('@/lib/db', () => {
  const { createMockPrisma } = jest.requireActual('../../../utils/mockPrisma');
  return createMockPrisma();
});

// 导入测试工具
const { clearMockDB, addMockData } = jest.requireActual('../../../utils/mockPrisma');

describe('File Path API', () => {
  beforeEach(() => {
    clearMockDB();
    jest.clearAllMocks();
    verifyToken.mockReturnValue(true);
  });

  test('返回400如果path参数缺失', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {}
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Invalid file path'
    });
  });

  test('返回404如果找不到对应的书籍记录', async () => {
    prisma.book.findFirst.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['books', 'test.pdf']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'File not found in database'
    });
  });

  test('管理员可以访问任何文件', async () => {
    // Mock 数据
    const mockBook = {
      id: 1,
      title: 'Test Book',
      accessLevel: 3,
      coverPath: '/covers/test.jpg',
      pdfPath: '/books/test.pdf',
      coverFileId: 'cloud://test-env.covers/test.jpg',
      pdfFileId: 'cloud://test-env.books/test.pdf'
    };

    const mockDownloadUrl = 'https://example.com/download/test.pdf';

    // Mock 返回值
    prisma.book.findFirst.mockResolvedValue(mockBook);
    verifyToken.mockReturnValue(true);  // 模拟管理员token验证通过
    axios.post.mockResolvedValue({
      data: {
        errcode: 0,
        file_list: [{
          fileid: mockBook.pdfFileId,  // 使用mock数据中的fileId
          download_url: mockDownloadUrl,
          status: 0
        }]
      }
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['books', 'test.pdf']
      },
      cookies: {
        token: 'valid-admin-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(302);  // 重定向状态码
    expect(res._getRedirectUrl()).toBe(mockDownloadUrl);
    expect(prisma.book.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { coverPath: '/books/test.pdf' },
          { pdfPath: '/books/test.pdf' }
        ]
      }
    });
    // 验证使用了正确的fileId调用微信API
    expect(axios.post).toHaveBeenCalledWith(
      'http://api.weixin.qq.com/tcb/batchdownloadfile',
      {
        env: process.env.CLOUD_ENV_ID,
        file_list: [{
          fileid: mockBook.pdfFileId,  // 应该使用PDF的fileId
          max_age: 3600
        }]
      },
      expect.any(Object)
    );
  });

  test('普通用户访问权限不足的文件时返回403', async () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      accessLevel: 3,
      pdfPath: '/books/test.pdf'
    };

    const mockUser = {
      nickName: 'testUser',
      accessLevel: 1
    };

    prisma.book.findFirst.mockResolvedValue(mockBook);
    prisma.user.findUnique.mockResolvedValue(mockUser);
    verifyToken.mockReturnValue(false);  // 不是管理员

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['books', 'test.pdf'],
        nickName: 'testUser'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Access denied'
    });
  });

  test('微信API调用失败时返回500', async () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      accessLevel: 1,
      pdfPath: '/books/test.pdf'
    };

    prisma.book.findFirst.mockResolvedValue(mockBook);
    verifyToken.mockReturnValue(false);
    axios.post.mockResolvedValue({
      data: {
        errcode: 1,
        errmsg: 'API Error'
      }
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['books', 'test.pdf']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Internal server error'
    });
  });

  test('成功获取下载链接并重定向', async () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      accessLevel: 1,
      pdfPath: '/books/test.pdf',
      coverPath: '/covers/test.jpg',
      coverFileId: 'cloud://test-env.covers/test.jpg',
      pdfFileId: 'cloud://test-env.books/test.pdf'
    };

    const mockDownloadUrl = 'https://example.com/download/test.pdf';

    prisma.book.findFirst.mockResolvedValue(mockBook);
    verifyToken.mockReturnValue(false);
    axios.post.mockResolvedValue({
      data: {
        errcode: 0,
        file_list: [{
          fileid: mockBook.pdfFileId,
          download_url: mockDownloadUrl,
          status: 0
        }]
      }
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['books', 'test.pdf']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(302);
    expect(res._getRedirectUrl()).toBe(mockDownloadUrl);
    expect(axios.post).toHaveBeenCalledWith(
      'http://api.weixin.qq.com/tcb/batchdownloadfile',
      {
        env: process.env.CLOUD_ENV_ID,
        file_list: [{
          fileid: mockBook.pdfFileId,
          max_age: 3600
        }]
      },
      expect.any(Object)
    );
  });

  test('成功获取封面图片下载链接', async () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      accessLevel: 1,
      coverPath: '/covers/test.jpg',
      pdfPath: '/books/test.pdf',
      coverFileId: 'cloud://test-env.covers/test.jpg',
      pdfFileId: 'cloud://test-env.books/test.pdf'
    };

    const mockDownloadUrl = 'https://example.com/download/test.jpg';

    prisma.book.findFirst.mockResolvedValue(mockBook);
    verifyToken.mockReturnValue(false);
    axios.post.mockResolvedValue({
      data: {
        errcode: 0,
        file_list: [{
          fileid: mockBook.coverFileId,
          download_url: mockDownloadUrl,
          status: 0
        }]
      }
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['covers', 'test.jpg']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(302);
    expect(res._getRedirectUrl()).toBe(mockDownloadUrl);
    expect(axios.post).toHaveBeenCalledWith(
      'http://api.weixin.qq.com/tcb/batchdownloadfile',
      {
        env: process.env.CLOUD_ENV_ID,
        file_list: [{
          fileid: mockBook.coverFileId,  // 应该使用封面的fileId
          max_age: 3600
        }]
      },
      expect.any(Object)
    );
  });

  test('处理包含中文的下载链接', async () => {
    const mockBook = {
      id: 1,
      title: 'Test Book',
      accessLevel: 1,
      coverPath: '/covers/测试.jpg',
      pdfPath: '/books/test.pdf',
      coverFileId: 'cloud://test-env.covers/测试.jpg',
      pdfFileId: 'cloud://test-env.books/test.pdf'
    };

    const mockDownloadUrl = 'https://example.com/download/测试文件.jpg';
    const expectedEncodedUrl = 'https://example.com/download/%E6%B5%8B%E8%AF%95%E6%96%87%E4%BB%B6.jpg';

    prisma.book.findFirst.mockResolvedValue(mockBook);
    verifyToken.mockReturnValue(false);
    axios.post.mockResolvedValue({
      data: {
        errcode: 0,
        file_list: [{
          fileid: mockBook.coverFileId,
          download_url: mockDownloadUrl,
          status: 0
        }]
      }
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['covers', '测试.jpg']
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(302);
    expect(res._getRedirectUrl()).toBe(expectedEncodedUrl);
  });
}); 