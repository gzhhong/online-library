import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from './Layout';
import { reactIconMapper } from '../lib/defaultMenuData';
import { convertToReactMenuItems } from '../lib/menuUtils';
import { toast } from 'react-hot-toast';

export default function MatchLawyerLayout({ children }) {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(true);
    const router = useRouter();

    // 检查当前路径是否在用户菜单中
    const checkPathInMenu = (menuItems, currentPath) => {
        // 递归检查菜单项
        console.log('menuItems', menuItems);
        console.log('currentPath', currentPath);
        const checkMenuItem = (items) => {
            for (const item of items) {
                if (item.path === currentPath) {
                    return true;
                }
                if (item.subItems && item.subItems.length > 0) {
                    if (checkMenuItem(item.subItems)) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        return checkMenuItem(menuItems);
    };

    // 加载菜单数据
    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/matchlawyer/menusettings/menu');
            if (response.ok) {
                const result = await response.json();
                const menuItemsWithIcons = convertToReactMenuItems(result.data, reactIconMapper);
                console.log('menuItemsWithIcons', menuItemsWithIcons);
                
                // 检查当前路径是否在用户菜单中
                const currentPath = router.pathname;
                const pathExists = checkPathInMenu(menuItemsWithIcons, currentPath);
                
                if (!pathExists) {
                    setHasPermission(false);
                    return;
                }
                
                setMenuItems(menuItemsWithIcons);
            } else {
                console.log('response', response);
                setMenuItems([]);
            }
        } catch (error) {
            console.error('加载菜单失败:', error);
            toast.error('加载菜单失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (router.pathname && router.pathname !== '/matchlawyer/login') {
            loadMenuItems();
        } else {
            setLoading(false);
        }
    }, [router.pathname]);

    // 如果没有权限，显示错误页面
    if (!hasPermission) {
        return (
            <Layout 
                menuItems={[]} 
                title="聚变场后台管理系统"
            >
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-6xl font-bold text-red-500 mb-4">401</div>
                        <div className="text-xl text-gray-600 mb-4">权限不足</div>
                        <div className="text-gray-500">您没有权限访问此页面</div>
                        <button 
                            onClick={() => router.push('/matchlawyer/login')}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            返回登录页
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (loading) {
        return (
            <Layout 
                menuItems={[]} 
                title="聚变场后台管理系统"
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
            title="聚变场后台管理系统"
        >
            {children}
        </Layout>
    );
} 