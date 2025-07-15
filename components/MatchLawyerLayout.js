import { AccountTree, Settings, People, Logout } from '@mui/icons-material';
import Layout from './Layout';

export default function MatchLawyerLayout({ children }) {
    const menuItems = [
        { text: '行业标签管理', icon: <AccountTree />, path: '/matchlawyer/industries' },
        { text: '成员管理', icon: <People />, path: '/matchlawyer/members' },
        { text: '成员注册（测试用）', icon: <People />, path: '/matchlawyer/register' },
        { text: '系统设置', icon: <Settings />, path: '/matchlawyer/settings' }
    ];

    return (
        <Layout 
            menuItems={menuItems} 
            title="律师匹配系统"
        >
            {children}
        </Layout>
    );
} 