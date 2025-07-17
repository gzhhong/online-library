import { useState, useEffect } from 'react';
import Layout from './Layout';
import { reactIconMapper } from '../lib/defaultMenuData';
import { convertToReactMenuItems } from '../lib/menuUtils';
import { toast } from 'react-hot-toast';

export default function MatchLawyerLayout({ children }) {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // 加载菜单数据
    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/matchlawyer/menusettings/menu');
            if (response.ok) {
                const result = await response.json();
                console.log('result', result);
                const menuItemsWithIcons = convertToReactMenuItems(result.data, reactIconMapper);
                console.log('menuItemsWithIcons', menuItemsWithIcons);
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
        loadMenuItems();
    }, []);

    if (loading) {
        return (
            <Layout 
                menuItems={[]} 
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