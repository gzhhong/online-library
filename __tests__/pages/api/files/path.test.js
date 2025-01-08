import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/files/[...path]';
import prisma from '@/lib/db';
import axios from 'axios';
import { verifyToken } from '@/lib/auth';

// Mock prisma
jest.mock('@/lib/db', () => ({
  book: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  }
}));

// Mock axios
jest.mock('axios');

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn()
}));

describe('File Path API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      pdfPath: '/books/test.pdf'
    };

    const mockDownloadUrl = 'https://example.com/download/test.pdf';

    // Mock 返回值
    prisma.book.findFirst.mockResolvedValue(mockBook);
    verifyToken.mockReturnValue(true);  // 模拟管理员token验证通过
    axios.post.mockResolvedValue({
      data: {
        errcode: 0,
        file_list: [{
          fileid: 'test-file-id',
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
      pdfPath: '/books/test.pdf'
    };

    const mockDownloadUrl = 'https://example.com/download/test.pdf';

    prisma.book.findFirst.mockResolvedValue(mockBook);
    verifyToken.mockReturnValue(false);
    axios.post.mockResolvedValue({
      data: {
        errcode: 0,
        file_list: [{
          fileid: 'test-file-id',
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
      'https://api.weixin.qq.com/tcb/batchdownloadfile',
      expect.objectContaining({
        env: process.env.WEIXIN_ENV_ID,
        file_list: [{
          fileid: expect.stringContaining('cloud://'),
          max_age: 3600
        }]
      }),
      expect.any(Object)
    );
  });
}); 