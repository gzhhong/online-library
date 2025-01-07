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
        
        // 等待初始图书列表加载，增加更多的调试信息
        await waitFor(() => {
            screen.debug(); // 打印当前渲染的 DOM
            expect(screen.getByText('测试图书1', { exact: false })).toBeInTheDocument();
            expect(screen.getByText('test book 2', { exact: false })).toBeInTheDocument();
        }, { timeout: 3000 }); // 增加超时时间

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
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
        });
    });

    test('下架图书功能', async () => {
        render(<Books />);
        
        // 等待图书加载，初始状态都是未下架
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
            const initialLabels = screen.getAllByText('下架');
            expect(initialLabels).toHaveLength(2);
        });

        // 找到测试图书1对应的下架开关并点击
        const switchButtons = screen.getAllByRole('switch');
        const book1Switch = switchButtons[0];
        // 阻止事件冒泡
        const clickEvent = await userEvent.click(book1Switch, { bubbles: false });

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith('/api/admin/books/update', expect.any(Object));

        // 模拟更新API响应
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

        // 验证UI更新
        await waitFor(() => {
            const book1Labels = screen.getAllByText('已下架');
            expect(book1Labels).toHaveLength(1);
            const book2Labels = screen.getAllByText('下架');
            expect(book2Labels).toHaveLength(1);
        });
    });

    test('删除图书功能', async () => {
        // 模拟确认对话框
        window.confirm = jest.fn(() => true);

        render(<Books />);
        
        // 等待图书加载
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });

        // 点击第一本书的删除按钮
        const deleteButtons = screen.getAllByText('删除');
        const firstBookDeleteButton = deleteButtons[0];
        await userEvent.click(firstBookDeleteButton, { bubbles: false });

        // 验证确认对话框被调用
        expect(window.confirm).toHaveBeenCalled();

        // 模拟删除API响应
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true
        }));

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/books/delete'),
            expect.any(Object)
        );

        // 验证图书被移除
        await waitFor(() => {
            expect(screen.queryByText('测试图书1')).not.toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });
    });
}); 