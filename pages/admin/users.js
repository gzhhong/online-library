import { useState, useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText
} from '@mui/material';
import Layout from '@/components/Layout';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ 
        nickName: '', 
        accessLevel: 0,
        name: '',
        title: '',
        organization: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        userId: null,
        nickName: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users/list');
            if (!res.ok) throw new Error('获取用户列表失败');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newUser,
                    isEditing
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '操作失败');
            }

            setStatus({ type: 'success', message: isEditing ? '用户更新成功！' : '用户创建成功！' });
            handleReset();
            fetchUsers();
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    // 检查字符串中的汉字数量
    const countChineseChars = (str) => {
        return (str.match(/[\u4e00-\u9fa5]/g) || []).length;
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        if (countChineseChars(value) <= 10) {
            setNewUser({ ...newUser, name: value });
        }
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        if (countChineseChars(value) <= 10) {
            setNewUser({ ...newUser, title: value });
        }
    };

    const handleOrganizationChange = (e) => {
        const value = e.target.value;
        if (countChineseChars(value) <= 20) {
            setNewUser({ ...newUser, organization: value });
        }
    };

    const handleDeleteClick = (user) => {
        setDeleteDialog({
            open: true,
            userId: user.id,
            nickName: user.nickName
        });
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({
            open: false,
            userId: null,
            nickName: ''
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            const res = await fetch(`/api/admin/users/delete?id=${deleteDialog.userId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '删除用户失败');
            }

            setStatus({ type: 'success', message: '用户删除成功' });
            handleDeleteCancel();
            fetchUsers();
            handleReset();
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
            handleDeleteCancel();
        } finally {
        }
    };

    const handleRowClick = (user) => {
        setNewUser({
            id: user.id,
            nickName: user.nickName,
            accessLevel: user.accessLevel,
            name: user.name || '',
            title: user.title || '',
            organization: user.organization || ''
        });
        setIsEditing(true);
    };

    const handleReset = () => {
        setNewUser({
            nickName: '',
            accessLevel: 0,
            name: '',
            title: '',
            organization: ''
        });
        setIsEditing(false);
    };

    return (
        <Layout>
            <Box>
                <TableContainer component={Paper} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ p: 2 }}>
                        用户列表
                    </Typography>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>微信昵称</TableCell>
                                <TableCell>访问权限</TableCell>
                                <TableCell>姓名</TableCell>
                                <TableCell>职务</TableCell>
                                <TableCell>单位</TableCell>
                                <TableCell>创建时间</TableCell>
                                <TableCell>最后访问时间</TableCell>
                                <TableCell align="right">操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow 
                                    key={user.id}
                                    onClick={() => handleRowClick(user)}
                                    sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <TableCell>{user.nickName}</TableCell>
                                    <TableCell>{user.accessLevel}</TableCell>
                                    <TableCell>{user.name || '-'}</TableCell>
                                    <TableCell>{user.title || '-'}</TableCell>
                                    <TableCell>{user.organization || '-'}</TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.lastVisit).toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteClick(user)}
                                            title="删除用户"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {isEditing ? '编辑用户' : '创建新用户'}
                    </Typography>
                    {status.message && (
                        <Alert severity={status.type} sx={{ mb: 2 }}>
                            {status.message}
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="微信昵称"
                            margin="normal"
                            value={newUser.nickName}
                            onChange={(e) => setNewUser({ ...newUser, nickName: e.target.value })}
                            required
                            disabled={submitting || isEditing}
                            helperText={isEditing ? "微信昵称不可修改" : ""}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>访问权限</InputLabel>
                            <Select
                                value={newUser.accessLevel}
                                label="访问权限"
                                onChange={(e) => setNewUser({ ...newUser, accessLevel: e.target.value })}
                                disabled={submitting}
                            >
                                {[0, 1, 2, 3, 4, 5].map((level) => (
                                    <MenuItem key={level} value={level}>
                                        {level}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="姓名"
                            margin="normal"
                            value={newUser.name}
                            onChange={handleNameChange}
                            inputProps={{ maxLength: 20 }}
                            disabled={submitting}
                            helperText="最多输入10个汉字或20个字母"
                        />
                        <TextField
                            fullWidth
                            label="职务"
                            margin="normal"
                            value={newUser.title}
                            onChange={handleTitleChange}
                            inputProps={{ maxLength: 20 }}
                            disabled={submitting}
                            helperText="最多输入10个汉字或20个字母"
                        />
                        <TextField
                            fullWidth
                            label="单位"
                            margin="normal"
                            value={newUser.organization}
                            onChange={handleOrganizationChange}
                            inputProps={{ maxLength: 40 }}
                            disabled={submitting}
                            helperText="最多输入20个汉字或40个字母"
                        />
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={submitting || !newUser.nickName}
                            >
                                {submitting ? <CircularProgress size={24} /> : 
                                    (isEditing ? '更新用户' : '创建用户')}
                            </Button>
                            {isEditing && (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={handleReset}
                                    disabled={submitting}
                                >
                                    取消编辑
                                </Button>
                            )}
                        </Box>
                    </form>
                </Paper>

                <Dialog
                    open={deleteDialog.open}
                    onClose={handleDeleteCancel}
                >
                    <DialogTitle>确认删除</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            确定要删除用户 "{deleteDialog.nickName}" 吗？此操作不可恢复。
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDeleteCancel}>取消</Button>
                        <Button onClick={handleDeleteConfirm} color="error">
                            确定删除
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
} 