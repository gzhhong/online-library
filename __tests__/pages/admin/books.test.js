import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Books from '@/pages/admin/books';

// Mock fetch API
global.fetch = jest.fn();

describe('Books Page', () => {
    const mockBooks = [
        {
            id: 1,
            title: '测试期刊1',
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

    // 辅助函数：设置初始期刊列表的mock
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

    test('显示期刊列表', async () => {
        render(<Books />);
        
        // 等待加载完成
        await waitFor(() => {
            expect(screen.getByText('测试期刊1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });
    });

    test('搜索期刊功能', async () => {
        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('查询期刊，支持复合查询，如：2024年第10期意林');
        
        // 等待初始期刊列表加载
        await waitFor(() => {
            expect(screen.getByText('测试期刊1', { exact: false })).toBeInTheDocument();
            expect(screen.getByText('test book 2', { exact: false })).toBeInTheDocument();
        }, { timeout: 3000 });

        // 测试中文搜索
        await userEvent.type(searchInput, '测试');
        await waitFor(() => {
            expect(screen.getByText('测试期刊1')).toBeInTheDocument();
            expect(screen.queryByText('test book 2')).not.toBeInTheDocument();
        });

        // 清空搜索框
        await userEvent.clear(searchInput);
        
        // 测试英文搜索
        await userEvent.type(searchInput, 'test');
        await waitFor(() => {
            expect(screen.getByText('test book 2')).toBeInTheDocument();
            expect(screen.queryByText('测试期刊1')).not.toBeInTheDocument();
        });
    });

    test('下架期刊功能', async () => {
        render(<Books />);
        
        // 等待期刊加载，初始状态都是未下架
        await waitFor(() => {
            expect(screen.getAllByText('下架')).toHaveLength(2);
        });

        // 找到测试期刊1对应的下架开关并点击
        const switchButtons = screen.getAllByRole('checkbox');
        const book1Switch = switchButtons[0];

        // 准备更新API的mock响应
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                id: 1,
                title: '测试期刊1',
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
            // 找到所有期刊卡片
            const book1Card = screen.getByText('测试期刊1').closest('.MuiCard-root');
            const book2Card = screen.getByText('test book 2').closest('.MuiCard-root');
            
            // 验证测试期刊1的卡片中包含"已下架"状态
            expect(within(book1Card).getByText('已下架')).toBeInTheDocument();
            
            // 验证test book 2的卡片中包含"下架"状态
            expect(within(book2Card).getByText('下架')).toBeInTheDocument();
        });
    });

    test('删除期刊功能', async () => {
        // 模拟 window.confirm
        window.confirm = jest.fn(() => true);

        render(<Books />);
        
        // 等待期刊加载完成
        await waitFor(() => {
            expect(screen.getByText('测试期刊1')).toBeInTheDocument();
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
        expect(window.confirm).toHaveBeenCalledWith('确定要删除这本期刊吗？');

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith(
            '/api/admin/books/delete?id=1',
            { method: 'DELETE' }
        );

        // 验证UI更新：第一本书被移除，第二本书保留
        await waitFor(() => {
            expect(screen.queryByText('测试期刊1')).not.toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });
    });

    test('搜索、下架和清空搜索的组合操作', async () => {
        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('查询期刊，支持复合查询，如：2024年第10期意林');
        
        // 等待初始期刊列表加载
        await waitFor(() => {
            expect(screen.getByText('测试期刊1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });

        // 1. 搜索"测试"
        await userEvent.type(searchInput, '测试');
        await waitFor(() => {
            expect(screen.getByText('测试期刊1')).toBeInTheDocument();
            expect(screen.queryByText('test book 2')).not.toBeInTheDocument();
        });

        // 2. 准备更新API响应，改变测试期刊1的下架状态
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                id: 1,
                title: '测试期刊1',
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

        // 验证测试期刊1状态更新为已下架
        await waitFor(() => {
            expect(screen.getByText('已下架')).toBeInTheDocument();
        });

        // 3. 清空搜索框
        await userEvent.clear(searchInput);

        // 验证两本书都显示，且状态正确
        await waitFor(() => {
            // 找到所有期刊卡片
            const book1Card = screen.getByText('测试期刊1').closest('.MuiCard-root');
            const book2Card = screen.getByText('test book 2').closest('.MuiCard-root');
            
            // 验证测试期刊1的卡片中包含"已下架"状态
            expect(within(book1Card).getByText('已下架')).toBeInTheDocument();
            
            // 验证test book 2的卡片中包含"下架"状态
            expect(within(book2Card).getByText('下架')).toBeInTheDocument();
        });
    });

    test('搜索、删除和清空搜索的组合操作', async () => {
        // 模拟 window.confirm
        window.confirm = jest.fn(() => true);

        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('查询期刊，支持复合查询，如：2024年第10期意林');
        
        // 等待初始期刊列表加载
        await waitFor(() => {
            expect(screen.getByText('测试期刊1')).toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });

        // 1. 搜索"测试"
        await userEvent.type(searchInput, '测试');
        await waitFor(() => {
            expect(screen.getByText('测试期刊1')).toBeInTheDocument();
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
        expect(window.confirm).toHaveBeenCalledWith('确定要删除这本期刊吗？');

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith(
            '/api/admin/books/delete?id=1',
            { method: 'DELETE' }
        );

        // 验证搜索结果为空
        await waitFor(() => {
            expect(screen.queryByText('测试期刊1')).not.toBeInTheDocument();
            expect(screen.queryByText('test book 2')).not.toBeInTheDocument();
        });

        // 3. 清空搜索框
        await userEvent.clear(searchInput);

        // 验证只剩下 test book 2
        await waitFor(() => {
            expect(screen.queryByText('测试期刊1')).not.toBeInTheDocument();
            expect(screen.getByText('test book 2')).toBeInTheDocument();
        });
    });

    test('按时间搜索期刊功能', async () => {
        // Mock 期刊数据
        const mockBooks = [
            { id: 1, title: '期刊1', year: 2024, issue: 1, time: 202401 },
            { id: 2, title: '期刊2', year: 2024, issue: 3, time: 202403 },
            { id: 3, title: '期刊3', year: 2024, issue: 5, time: 202405 },
            { id: 4, title: '期刊4', year: 2023, issue: 12, time: 202312 },
        ];
        
        // Mock API 响应
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockBooks)
            })
        );

        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('查询期刊，支持复合查询，如：2024年第10期意林');
        
        // 等待初始期刊列表加载
        await waitFor(() => {
            expect(screen.getByText('期刊1')).toBeInTheDocument();
            expect(screen.getByText('期刊4')).toBeInTheDocument();
        });

        // 测试具体年月
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, '2024年3月');
        await waitFor(() => {
            expect(screen.getByText('期刊2')).toBeInTheDocument();
            expect(screen.queryByText('期刊1')).not.toBeInTheDocument();
            expect(screen.queryByText('期刊3')).not.toBeInTheDocument();
            expect(screen.queryByText('期刊4')).not.toBeInTheDocument();
        });

        // 测试时间范围（同年）
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, '2024年1-3月');
        await waitFor(() => {
            expect(screen.getByText('期刊1')).toBeInTheDocument();
            expect(screen.getByText('期刊2')).toBeInTheDocument();
            expect(screen.queryByText('期刊3')).not.toBeInTheDocument();
            expect(screen.queryByText('期刊4')).not.toBeInTheDocument();
        });

        // 测试时间范围（跨年）
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, '2023年12月-2024年3月');
        await waitFor(() => {
            expect(screen.getByText('期刊1')).toBeInTheDocument();
            expect(screen.getByText('期刊2')).toBeInTheDocument();
            expect(screen.getByText('期刊4')).toBeInTheDocument();
            expect(screen.queryByText('期刊3')).not.toBeInTheDocument();
        });

        // 测试年份
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, '2024年');
        await waitFor(() => {
            expect(screen.getByText('期刊1')).toBeInTheDocument();
            expect(screen.getByText('期刊2')).toBeInTheDocument();
            expect(screen.getByText('期刊3')).toBeInTheDocument();
            expect(screen.queryByText('期刊4')).not.toBeInTheDocument();
        });

        // 测试相对时间
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, '最近3个月');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        await waitFor(() => {
            // 这里的断言需要根据当前日期动态判断
            // 假设当前是2024年3月，那么最近3个月应该包含2024年1-3月的期刊
            const recentBooks = mockBooks.filter(book => {
                const bookDate = new Date(Math.floor(book.time / 100), (book.time % 100) - 1);
                const threeMonthsAgo = new Date(now);
                threeMonthsAgo.setMonth(now.getMonth() - 3);
                return bookDate >= threeMonthsAgo && bookDate <= now;
            });
            recentBooks.forEach(book => {
                expect(screen.getByText(book.title)).toBeInTheDocument();
            });
        });
    });

    test('空搜索文本应返回所有数据', async () => {
        // Mock 期刊数据
        const mockBooks = [
            { id: 1, title: '期刊1', year: 2024, issue: 1, time: 202401 },
            { id: 2, title: '期刊2', year: 2024, issue: 3, time: 202403 },
            { id: 3, title: '期刊3', year: 2024, issue: 5, time: 202405 },
            { id: 4, title: '期刊4', year: 2023, issue: 12, time: 202312 },
        ];
        
        // Mock API 响应
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockBooks)
            })
        );

        render(<Books />);
        
        const searchInput = screen.getByPlaceholderText('查询期刊，支持复合查询，如：2024年第10期意林');
        
        // 等待初始期刊列表加载（应显示所有数据）
        await waitFor(() => {
            mockBooks.forEach(book => {
                expect(screen.getByText(book.title)).toBeInTheDocument();
            });
        });

        // 测试空字符串
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, '   ');  // 输入空格
        await waitFor(() => {
            mockBooks.forEach(book => {
                expect(screen.getByText(book.title)).toBeInTheDocument();
            });
        });

        // 测试清空搜索框
        await userEvent.clear(searchInput);
        await waitFor(() => {
            mockBooks.forEach(book => {
                expect(screen.getByText(book.title)).toBeInTheDocument();
            });
        });
    });

}); 