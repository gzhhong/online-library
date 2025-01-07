import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Books from '@/pages/admin/books';

// Mock fetch API
global.fetch = jest.fn();

describe('Books Page', () => {
    beforeEach(() => {
        // 模拟获取图书列表的API响应
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
                {
                    id: 1,
                    title: '测试图书1',
                    accessLevel: 0,
                    unlist: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'test book 2',
                    accessLevel: 0,
                    unlist: false,
                    createdAt: new Date().toISOString()
                }
            ])
        }));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('显示图书列表', async () => {
        render(<Books />);
        
        // 等待加载完成
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });
    });

    test('搜索图书功能', async () => {
        // 重置 fetch mock
        fetch.mockReset();
        
        // 模拟图书列表API响应
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
                {
                    id: 1,
                    title: '测试图书1',
                    accessLevel: 0,
                    unlist: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'test book 2',
                    accessLevel: 0,
                    unlist: false,
                    createdAt: new Date().toISOString()
                }
            ])
        }));

        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('搜索图书...');
        
        // 等待初始图书列表加载
        await waitFor(() => {
            screen.debug();
            expect(screen.getByText('测试图书1', { exact: false })).toBeInTheDocument();
            expect(screen.getByText('test book 2', { exact: false })).toBeInTheDocument();
        }, { timeout: 3000 });

        // 测试中文搜索
        await userEvent.type(searchInput, '测试');
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.queryByText('test book 2')).not.toBeInTheDocument();
        });

        // 清空搜索框
        await userEvent.clear(searchInput);
        
        // 测试英文搜索
        await userEvent.type(searchInput, 'test');
        await waitFor(() => {
            expect(screen.getByText('test book 2')).toBeInTheDocument();
            expect(screen.queryByText('测试图书1')).not.toBeInTheDocument();
        });
    });

}); 