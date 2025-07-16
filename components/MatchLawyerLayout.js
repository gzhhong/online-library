import { AccountTree, Settings, People, Logout, CardGiftcard } from '@mui/icons-material';
import Layout from './Layout';

export default function MatchLawyerLayout({ children }) {
    const menuItems = [
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
                { text: '角色设置', path: '/matchlawyer/employeeroles' }
            ]
        }
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