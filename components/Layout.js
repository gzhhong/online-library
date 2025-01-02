import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { LibraryBooks, CloudUpload, People, Logout } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useState } from 'react';

const drawerWidth = 240;

export default function Layout({ children }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const menuItems = [
        { text: '图书浏览', icon: <LibraryBooks />, path: '/admin/books' },
        { text: '图书上传', icon: <CloudUpload />, path: '/admin/upload' },
        { text: '用户管理', icon: <People />, path: '/admin/users' }
    ];

    const handleLogout = async () => {
        setLoading(true);
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        await router.push('/admin/login');
        setLoading(false);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        图书馆管理系统
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
                        {menuItems.map((item) => (
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