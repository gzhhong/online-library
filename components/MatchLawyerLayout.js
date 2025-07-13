import { AccountTree, Settings, Logout } from '@mui/icons-material';
import Layout from './Layout';

export default function MatchLawyerLayout({ children }) {
    const menuItems = [
        { text: '行业标签管理', icon: <AccountTree />, path: '/matchlawyer/industries' },
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