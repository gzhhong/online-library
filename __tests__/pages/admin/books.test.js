import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Books from '@/pages/admin/books';

// Mock fetch API
global.fetch = jest.fn();

describe('Books Page', () => {
    const mockBooks = [
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
    ];

    // 辅助函数：设置初始图书列表的mock
    const setupInitialBooksList = () => {
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBooks)
        }));
    };

    beforeEach(() => {
        fetch.mockReset();
        setupInitialBooksList();
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
        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('搜索图书...');
        
        // 等待初始图书列表加载
        await waitFor(() => {
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
            // 找到所有图书卡片
            const book1Card = screen.getByText('测试图书1').closest('.MuiCard-root');
            const book2Card = screen.getByText('test book 2').closest('.MuiCard-root');
            
            // 验证测试图书1的卡片中包含"已下架"状态
            expect(within(book1Card).getByText('已下架')).toBeInTheDocument();
            
            // 验证test book 2的卡片中包含"下架"状态
            expect(within(book2Card).getByText('下架')).toBeInTheDocument();
        });
    });

    test('删除图书功能', async () => {
        // 模拟 window.confirm
        window.confirm = jest.fn(() => true);

        render(<Books />);
        
        // 等待图书加载完成
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });

        // 准备删除API的mock响应
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Book deleted successfully' })
        }));

        // 点击第一本书的删除按钮
        const deleteButtons = screen.getAllByText('删除');
        const firstBookDeleteButton = deleteButtons[0];
        await userEvent.click(firstBookDeleteButton);

        // 验证确认对话框被调用
        expect(window.confirm).toHaveBeenCalledWith('确定要删除这本书吗？');

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith(
            '/api/admin/books/delete?id=1',
            { method: 'DELETE' }
        );

        // 验证UI更新：第一本书被移除，第二本书保留
        await waitFor(() => {
            expect(screen.queryByText('测试图书1')).not.toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });
    });

    test('搜索、下架和清空搜索的组合操作', async () => {
        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('搜索图书...');
        
        // 等待初始图书列表加载
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });

        // 1. 搜索"测试"
        await userEvent.type(searchInput, '测试');
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.queryByText('test book 2')).not.toBeInTheDocument();
        });

        // 2. 准备更新API响应，改变测试图书1的下架状态
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

        // 点击下架开关
        const switchButtons = screen.getAllByRole('checkbox');
        await userEvent.click(switchButtons[0]);

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith('/api/admin/books/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                unlist: true
            })
        });

        // 验证测试图书1状态更新为已下架
        await waitFor(() => {
            expect(screen.getByText('已下架')).toBeInTheDocument();
        });

        // 3. 清空搜索框
        await userEvent.clear(searchInput);

        // 验证两本书都显示，且状态正确
        await waitFor(() => {
            // 找到所有图书卡片
            const book1Card = screen.getByText('测试图书1').closest('.MuiCard-root');
            const book2Card = screen.getByText('test book 2').closest('.MuiCard-root');
            
            // 验证测试图书1的卡片中包含"已下架"状态
            expect(within(book1Card).getByText('已下架')).toBeInTheDocument();
            
            // 验证test book 2的卡片中包含"下架"状态
            expect(within(book2Card).getByText('下架')).toBeInTheDocument();
        });
    });

    test('搜索、删除和清空搜索的组合操作', async () => {
        // 模拟 window.confirm
        window.confirm = jest.fn(() => true);

        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('搜索图书...');
        
        // 等待初始图书列表加载
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });

        // 1. 搜索"测试"
        await userEvent.type(searchInput, '测试');
        await waitFor(() => {
            expect(screen.getByText('测试图书1')).toBeInTheDocument();
            expect(screen.queryByText('test book 2')).not.toBeInTheDocument();
        });

        // 2. 准备删除API响应
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Book deleted successfully' })
        }));

        // 点击删除按钮
        const deleteButton = screen.getByText('删除');
        await userEvent.click(deleteButton);

        // 验证确认对话框被调用
        expect(window.confirm).toHaveBeenCalledWith('确定要删除这本书吗？');

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith(
            '/api/admin/books/delete?id=1',
            { method: 'DELETE' }
        );

        // 验证搜索结果为空
        await waitFor(() => {
            expect(screen.queryByText('测试图书1')).not.toBeInTheDocument();
            expect(screen.queryByText('test book 2')).not.toBeInTheDocument();
        });

        // 3. 清空搜索框
        await userEvent.clear(searchInput);

        // 验证只剩下 test book 2
        await waitFor(() => {
            expect(screen.queryByText('测试图书1')).not.toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });
    });

}); 