import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

    test('下架图书功能', async () => {
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
        
        // 等待图书加载，初始状态都是未下架
        await waitFor(() => {
            expect(screen.getAllByText('下架')).toHaveLength(2);
        });

        // 找到测试图书1对应的下架开关并点击
        const switchButtons = screen.getAllByRole('checkbox');
        const book1Switch = switchButtons[0];

        // 准备更新API的mock响应
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                id: 1,
                title: '测试图书1',
                accessLevel: 0,
                unlist: true,
                createdAt: new Date().toISOString()
            })
        }));

        // 点击开关
        await userEvent.click(book1Switch);

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith('/api/admin/books/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                unlist: true
            })
        });

        // 验证UI更新
        await waitFor(() => {
            expect(screen.getByText('已下架')).toBeInTheDocument();  // 第一本书已下架
            expect(screen.getByText('下架')).toBeInTheDocument();    // 第二本书未下架
        });
    });

}); 