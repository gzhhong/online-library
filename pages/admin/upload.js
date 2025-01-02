import { useState } from 'react';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';
import Layout from '@/components/Layout';

export default function Upload() {
    const [title, setTitle] = useState('');
    const [accessLevel, setAccessLevel] = useState(0);
    const [cover, setCover] = useState(null);
    const [pdf, setPdf] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('accessLevel', accessLevel);
            formData.append('cover', cover);
            formData.append('pdf', pdf);

            const res = await fetch('/api/admin/books/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '上传失败');
            }

            setStatus({ type: 'success', message: '图书上传成功！' });
            setTitle('');
            setAccessLevel(0);
            setCover(null);
            setPdf(null);
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom>
                    上传新图书
                </Typography>
                {status.message && (
                    <Alert severity={status.type} sx={{ mb: 2 }}>
                        {status.message}
                    </Alert>
                )}
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="图书标题"
                        margin="normal"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>访问权限</InputLabel>
                        <Select
                            value={accessLevel}
                            label="访问权限"
                            onChange={(e) => setAccessLevel(e.target.value)}
                            disabled={loading}
                        >
                            {[0, 1, 2, 3, 4, 5].map((level) => (
                                <MenuItem key={level} value={level}>
                                    {level}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept="image/*"
                            type="file"
                            id="cover-file"
                            onChange={(e) => setCover(e.target.files[0])}
                            style={{ display: 'none' }}
                            disabled={loading}
                        />
                        <label htmlFor="cover-file">
                            <Button
                                variant="outlined"
                                component="span"
                                fullWidth
                                disabled={loading}
                            >
                                选择封面图片
                            </Button>
                        </label>
                        {cover && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                已选择: {cover.name}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept="application/pdf"
                            type="file"
                            id="pdf-file"
                            onChange={(e) => setPdf(e.target.files[0])}
                            style={{ display: 'none' }}
                            disabled={loading}
                        />
                        <label htmlFor="pdf-file">
                            <Button
                                variant="outlined"
                                component="span"
                                fullWidth
                                disabled={loading}
                            >
                                选择PDF文件
                            </Button>
                        </label>
                        {pdf && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                已选择: {pdf.name}
                            </Typography>
                        )}
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ mt: 3 }}
                        disabled={loading || !title || !cover || !pdf}
                    >
                        {loading ? <CircularProgress size={24} /> : '上传图书'}
                    </Button>
                </form>
            </Paper>
        </Layout>
    );
} 