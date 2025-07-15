import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton, Collapse } from '@mui/material';
import { LibraryBooks, CloudUpload, People, History, Logout, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

const drawerWidth = 240;

export default function Layout({ children, menuItems, title }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});

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

    const handleMenuClick = (item) => {
        if (item.subItems) {
            // Toggle submenu expansion
            setExpandedMenus(prev => ({
                ...prev,
                [item.text]: !prev[item.text]
            }));
        } else {
            // Navigate to page
            router.push(item.path);
        }
    };

    const handleSubItemClick = (path) => {
        router.push(path);
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
                            <div key={item.text}>
                                <ListItem 
                                    button 
                                    onClick={() => handleMenuClick(item)}
                                    selected={router.pathname === item.path}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                    {item.subItems && (
                                        expandedMenus[item.text] ? <ExpandLess /> : <ExpandMore />
                                    )}
                                </ListItem>
                                {item.subItems && (
                                    <Collapse in={expandedMenus[item.text]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {item.subItems.map((subItem) => (
                                                <ListItem 
                                                    button 
                                                    key={subItem.text}
                                                    sx={{ pl: 4 }}
                                                    onClick={() => handleSubItemClick(subItem.path)}
                                                    selected={router.pathname === subItem.path}
                                                >
                                                    <ListItemText primary={subItem.text} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Collapse>
                                )}
                            </div>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                {children}
            </Box>
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        style: {
                            background: '#4caf50',
                        },
                    },
                    error: {
                        duration: 4000,
                        style: {
                            background: '#f44336',
                        },
                    },
                }}
            />
        </Box>
    );
} 