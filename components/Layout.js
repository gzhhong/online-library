import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { LibraryBooks, CloudUpload, People, History, Logout } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useState } from 'react';

const drawerWidth = 240;

export default function Layout({ children, menuItems, title }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Default menu items for admin (fallback)
    const defaultMenuItems = [
        { text: '期刊上传', icon: <CloudUpload />, path: '/admin/upload' },
        { text: '期刊管理', icon: <LibraryBooks />, path: '/admin/books' },
        { text: '用户管理', icon: <People />, path: '/admin/users' },
        { text: '访客记录', icon: <History />, path: '/admin/guests' }
    ];

    // Use provided menuItems or fallback to default
    const items = menuItems || defaultMenuItems;
    const appTitle = title || '期刊馆管理系统';

    const handleLogout = async () => {
        setLoading(true);
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        // Redirect based on current path
        const isMatchLawyer = router.pathname.startsWith('/matchlawyer');
        await router.push(isMatchLawyer ? '/matchlawyer/login' : '/admin/login');
        setLoading(false);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {appTitle}
                    </Typography>
                    <IconButton 
                        color="inherit" 
                        onClick={handleLogout}
                        disabled={loading}
                    >
                        <Logout />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {items.map((item) => (
                            <ListItem 
                                button 
                                key={item.text} 
                                onClick={() => router.push(item.path)}
                                selected={router.pathname === item.path}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
} 