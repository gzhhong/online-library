import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Users from '@/pages/admin/users';

// Mock fetch API
global.fetch = jest.fn();

describe('Users Page', () => {
    const mockUsers = [
        {
            id: 1,
            nickName: '用户1',
            accessLevel: 1,
            name: '张三',
            title: '工程师',
            organization: '公司A',
            lastVisit: new Date().toISOString(),
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            nickName: 'user2',
            accessLevel: 2,
            name: '李四',
            title: '经理',
            organization: '公司B',
            lastVisit: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
    ];

    // 辅助函数：设置初始用户列表的mock
    const setupInitialUsersList = () => {
        fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsers)
        }));
    };

    beforeEach(() => {
        fetch.mockReset();
        setupInitialUsersList();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('显示用户列表', async () => {
        render(<Users />);
        
        await waitFor(() => {
            // 验证用户基本信息显示
            expect(screen.getByText('用户1')).toBeInTheDocument();
            expect(screen.getByText('user2')).toBeInTheDocument();
            expect(screen.getByText('张三')).toBeInTheDocument();
            expect(screen.getByText('李四')).toBeInTheDocument();
            
            // 验证权限等级显示
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });
    });

    test('创建新用户', async () => {
        render(<Users />);

        // 等待页面加载完成
        await waitFor(() => {
            expect(screen.getByText('用户1')).toBeInTheDocument();
        });

        // 准备创建用户API响应
        const createResponse = Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                id: 3,
                nickName: '新用户',
                accessLevel: 3,
                name: '王五',
                title: '总监',
                organization: '公司C',
                lastVisit: new Date().toISOString(),
                createdAt: new Date().toISOString()
            })
        });

        const listResponse = Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
                ...mockUsers,  // 原有用户
                {   // 新创建的用户
                    id: 3,
                    nickName: '新用户',
                    accessLevel: 3,
                    name: '王五',
                    title: '总监',
                    organization: '公司C',
                    lastVisit: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }
            ])
        });

        fetch
            .mockImplementationOnce(() => createResponse)  // 创建用户的响应
            .mockImplementationOnce(() => listResponse);   // 刷新列表的响应

        // 填写新用户表单
        const inputs = screen.getAllByRole('textbox');
        await userEvent.type(inputs[0], '新用户');  // 微信昵称
        await userEvent.type(inputs[1], '王五');    // 姓名
        await userEvent.type(inputs[2], '总监');    // 职务
        await userEvent.type(inputs[3], '公司C');   // 单位
        
        // 选择权限等级
        const accessLevelSelect = screen.getByRole('combobox');
        await userEvent.click(accessLevelSelect);
        await userEvent.click(screen.getByText('3'));

        // 点击创建按钮
        const createButton = screen.getByText('创建用户');

        // 执行创建操作
        await userEvent.click(createButton);
        await createResponse;  // 等待创建响应完成
        await listResponse;    // 等待列表刷新完成

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith('/api/admin/users/create', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(JSON.stringify({
                nickName: '新用户',
                accessLevel: 3,
                name: '王五',
                title: '总监',
                organization: '公司C',
                isEditing: false
            }))
        }));

        // 验证新用户显示在列表中
        await waitFor(() => {
            expect(screen.getByText('新用户')).toBeInTheDocument();
            expect(screen.getByText('王五')).toBeInTheDocument();
            expect(screen.getByText('总监')).toBeInTheDocument();
            expect(screen.getByText('公司C')).toBeInTheDocument();
        });
    });

    test('更新用户信息', async () => {
        render(<Users />);
        
        // 等待用户列表加载
        await waitFor(() => {
            expect(screen.getByText('用户1')).toBeInTheDocument();
        });

        // 点击第一个用户进行编辑
        const userRow = screen.getByText('用户1').closest('tr');
        await userEvent.click(userRow);

        // 验证用户信息已填入编辑区
        const inputs = screen.getAllByRole('textbox');
        
        // 验证昵称字段已填入且被禁用
        const nicknameInput = inputs[0];
        expect(nicknameInput).toHaveValue('用户1');
        expect(nicknameInput).toBeDisabled();

        // 验证其他字段已正确填入
        expect(inputs[1]).toHaveValue('张三');  // 姓名
        expect(inputs[2]).toHaveValue('工程师');  // 职务
        expect(inputs[3]).toHaveValue('公司A');  // 单位

        // const select = screen.getByLabelText('访问权限');
        // expect(select).toHaveValue('1');
    
        // 修改职务
        await userEvent.clear(inputs[2]);
        await userEvent.type(inputs[2], '高级工程师');

        // 准备更新API响应
        const updateResponse = Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                id: 1,
                nickName: '用户1',
                accessLevel: 1,
                name: '张三',
                title: '高级工程师',  // 更新后的职务
                organization: '公司A',
                lastVisit: new Date().toISOString(),
                createdAt: new Date().toISOString()
            })
        });

        const listResponse = Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
                {   // 更新后的用户
                    id: 1,
                    nickName: '用户1',
                    accessLevel: 1,
                    name: '张三',
                    title: '高级工程师',
                    organization: '公司A',
                    lastVisit: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                },
                mockUsers[1]  // 保持第二个用户不变
            ])
        });

        fetch
            .mockImplementationOnce(() => updateResponse)  // 更新用户的响应
            .mockImplementationOnce(() => listResponse);   // 刷新列表的响应

        // 点击更新按钮
        const updateButton = screen.getByText('更新用户');
        await userEvent.click(updateButton);

        // 验证API调用
        expect(fetch).toHaveBeenCalledWith('/api/admin/users/create', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(JSON.stringify({
                id: 1,
                nickName: '用户1',
                accessLevel: 1,
                name: '张三',
                title: '高级工程师',
                organization: '公司A',
                isEditing: true
            }))
        }));

        // 等待更新和刷新操作完成
        await updateResponse;
        await listResponse;

        // 验证用户信息已更新
        await waitFor(() => {
            expect(screen.getByText('高级工程师')).toBeInTheDocument();
            // 验证其他信息保持不变
            expect(screen.getByText('用户1')).toBeInTheDocument();
            expect(screen.getByText('张三')).toBeInTheDocument();
            expect(screen.getByText('公司A')).toBeInTheDocument();
        });
    });

}); 