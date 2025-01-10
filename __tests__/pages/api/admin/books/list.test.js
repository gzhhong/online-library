import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/admin/books/list';
import { verifyToken } from '@/lib/auth';

// Mock auth
jest.mock('@/lib/auth', () => ({
    verifyToken: jest.fn()
}));

// Mock Prisma
jest.mock('@/lib/db', () => {
    const { createMockPrisma } = jest.requireActual('../../../../utils/mockPrisma');
    return createMockPrisma();
});

// 导入测试工具
const { clearMockDB, addMockData } = jest.requireActual('../../../../utils/mockPrisma');

describe('/api/admin/books/list', () => {
    beforeEach(() => {
        clearMockDB();
        jest.clearAllMocks();
        verifyToken.mockReturnValue(true);
    });

    test('空搜索文本应返回所有数据', async () => {
        // 准备测试数据，按 year desc, issue desc 排序
        const mockBooks = [
            { 
                id: 3, 
                title: '期刊3', 
                year: 2024, 
                issue: 5, 
                time: 202405
            },
            { 
                id: 2, 
                title: '期刊2', 
                year: 2024, 
                issue: 3, 
                time: 202403
            },
            { 
                id: 1, 
                title: '期刊1', 
                year: 2024, 
                issue: 1, 
                time: 202401
            },
            { 
                id: 4, 
                title: '期刊4', 
                year: 2023, 
                issue: 12, 
                time: 202312
            }
        ];
        addMockData.books(mockBooks);

        const { req, res } = createMocks({
            method: 'GET',
            query: {
                searchText: ''
            },
            cookies: {
                token: 'valid-token'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const sortedBooks = [...mockBooks].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.issue - a.issue;
        });
        expect(JSON.parse(res._getData())).toEqual(sortedBooks);
    });

    test('未授权访问应返回401', async () => {
        // Mock 验证失败
        verifyToken.mockReturnValue(false);

        const { req, res } = createMocks({
            method: 'GET',
            cookies: {
                token: 'invalid-token'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData())).toEqual({
            message: 'Unauthorized'
        });
    });

    test('非GET请求应返回405', async () => {
        const { req, res } = createMocks({
            method: 'POST'
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(405);
        expect(JSON.parse(res._getData())).toEqual({
            message: 'Method not allowed'
        });
    });
}); 