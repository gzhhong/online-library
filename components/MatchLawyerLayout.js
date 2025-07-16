import { AccountTree, Settings, People, Logout, CardGiftcard } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import Layout from './Layout';

// 图标映射函数
const iconMapper = (iconName) => {
  const iconMap = {
    'AccountTree': <AccountTree />,
    'Settings': <Settings />,
    'People': <People />,
    'CardGiftcard': <CardGiftcard />,
    'Logout': <Logout />
  };
  return iconMap[iconName] || null;
};

export default function MatchLawyerLayout({ children }) {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // 获取当前用户的角色ID（这里需要根据你的认证系统来实现）
    const getCurrentUserRoleId = () => {
        // 从localStorage、cookie或context中获取用户角色ID
        // 这里暂时返回1作为默认角色，你需要根据实际情况修改
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.roleId || 1;
            } catch (error) {
                console.error('解析token失败:', error);
                return 1;
            }
        }
        return 1;
    };

    // 加载菜单数据
    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const roleId = getCurrentUserRoleId();
            
            const response = await fetch(`/api/matchlawyer/menusettings/menu?roleId=${roleId}`);
            if (response.ok) {
                const result = await response.json();
                // 检查数据项数量，如果少于3个则使用默认菜单
                if (!result.data || result.data.length < 3) {
                    console.log('菜单数据项少于3个，使用默认菜单');
                    setMenuItems(getDefaultMenuItems());
                } else {
                    // 将字符串图标转换为React组件
                    const menuItemsWithIcons = convertMenuItemsWithIcons(result.data);
                    setMenuItems(menuItemsWithIcons);
                }
            } else {
                console.error('加载菜单失败:', response.statusText);
                // 如果加载失败，使用默认菜单
                setMenuItems(getDefaultMenuItems());
            }
        } catch (error) {
            console.error('加载菜单错误:', error);
            // 如果出错，使用默认菜单
            setMenuItems(getDefaultMenuItems());
        } finally {
            setLoading(false);
        }
    };

    // 将菜单项中的字符串图标转换为React组件
    const convertMenuItemsWithIcons = (items) => {
        return items.map(item => {
            const convertedItem = {
                ...item,
                icon: item.icon ? iconMapper(item.icon) : null
            };

            if (item.subItems && item.subItems.length > 0) {
                convertedItem.subItems = convertMenuItemsWithIcons(item.subItems);
            }

            return convertedItem;
        });
    };

    // 默认菜单项（作为fallback）
    const getDefaultMenuItems = () => [
        { text: '行业标签管理', icon: <AccountTree />, path: '/matchlawyer/industries' },
        { text: '成员管理', icon: <People />, path: '/matchlawyer/members' },
        { text: '成员注册（测试用）', icon: <People />, path: '/matchlawyer/register' },
        { 
            text: '权益管理', 
            icon: <CardGiftcard />, 
            path: '/matchlawyer/benefit',
            subItems: [
                { text: '权益类型', path: '/matchlawyer/benefit/definetype' },
                { text: '权益分组', path: '/matchlawyer/benefit/group' },
                { text: '用户数据', path: '/matchlawyer/benefit/userdata' }
            ]
        },
        { 
            text: '系统设置', 
            icon: <Settings />, 
            path: '/matchlawyer/settings',
            subItems: [
                { text: '角色设置', path: '/matchlawyer/settings/employeeroles' },
                { text: '员工管理', path: '/matchlawyer/settings/employee' },
                { text: '权限设定', path: '/matchlawyer/settings/menusetting' }
            ]
        }
    ];

    useEffect(() => {
        loadMenuItems();
    }, []);

    if (loading) {
        return (
            <Layout 
                menuItems={getDefaultMenuItems()} 
                title="律师匹配系统"
            >
                <div className="flex items-center justify-center h-screen">
                    <div className="text-xl">加载菜单中...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout 
            menuItems={menuItems} 
            title="律师匹配系统"
        >
            {children}
        </Layout>
    );
} 