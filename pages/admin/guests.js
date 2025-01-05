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
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import Layout from '@/components/Layout';

export default function Guests() {
    const [guests, setGuests] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGuests();
    }, []);

    const fetchGuests = async () => {
        try {
            const res = await fetch('/api/admin/guests/list');
            if (!res.ok) throw new Error('获取访客列表失败');
            const data = await res.json();
            setGuests(data);
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Layout>
        );
    }

    return (
        <Layout>
            <Box>
                <TableContainer component={Paper}>
                    <Typography variant="h6" sx={{ p: 2 }}>
                        访客列表
                    </Typography>
                    {status.message && (
                        <Alert severity={status.type} sx={{ mx: 2, mb: 2 }}>
                            {status.message}
                        </Alert>
                    )}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>微信昵称</TableCell>
                                <TableCell>首次访问</TableCell>
                                <TableCell>最后访问</TableCell>
                                <TableCell>访问次数</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {guests.map((guest) => (
                                <TableRow key={guest.id}>
                                    <TableCell>{guest.nickName}</TableCell>
                                    <TableCell>
                                        {new Date(guest.firstVisit).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(guest.lastVisit).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{guest.visitCount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Layout>
    );
} 