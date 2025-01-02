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
    CircularProgress
} from '@mui/material';
import Layout from '@/components/Layout';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ nickName: '', accessLevel: 0 });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
                body: JSON.stringify(newUser),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '创建用户失败');
            }

            setStatus({ type: 'success', message: '用户创建成功！' });
            setNewUser({ nickName: '', accessLevel: 0 });
            fetchUsers();
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSubmitting(false);
        }
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
                                <TableCell>创建时间</TableCell>
                                <TableCell>最后访问时间</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>{user.nickName}</TableCell>
                                    <TableCell>{user.accessLevel}</TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.lastVisit).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        创建新用户
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
                            disabled={submitting}
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
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={submitting || !newUser.nickName}
                        >
                            {submitting ? <CircularProgress size={24} /> : '创建用户'}
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Layout>
    );
} 