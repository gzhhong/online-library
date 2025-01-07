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

    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setStatus({
                    type: 'error',
                    message: `${type === 'cover' ? '封面图片' : 'PDF文件'}大小超过30MB限制`
                });
                e.target.value = ''; // 清空文件输入
                return;
            }
            if (type === 'cover') {
                setCover(file);
            } else {
                setPdf(file);
            }
            setStatus({ type: '', message: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            // 处理封面图片上传，路径不能以'/'开头，否则会报错-501007
            // 但是存入数据库时，路径需要以'/'开头，文件路径链接不正确
            const coverPath = `covers/${Date.now()}-${cover.name}`;
            
            const coverUploadRes = await fetch('/api/admin/books/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: coverPath }),
            });
            
            if (!coverUploadRes.ok) throw new Error('获取封面上传链接失败');
            const coverUploadData = await coverUploadRes.json();
            console.log('Got cover upload URL:', coverUploadData.url);

            // 上传封面到COS
            const coverFormData = new FormData();
            coverFormData.append('key', coverPath);
            coverFormData.append('Signature', coverUploadData.authorization);
            coverFormData.append('x-cos-security-token', coverUploadData.token);
            coverFormData.append('x-cos-meta-fileid', coverUploadData.cos_file_id);
            coverFormData.append('file', cover);

            const coverCosRes = await fetch(coverUploadData.url, {
                method: 'POST',
                body: coverFormData,
            });

            if (!coverCosRes.ok) throw new Error('封面上传失败');
            console.log('Cover upload successful');

            // 处理PDF文件上传，路径不能以'/'开头，否则会报错-501007
            // 但是存入数据库时，路径需要以'/'开头，文件路径链接不正确
            const pdfPath = `pdfs/${Date.now()}-${pdf.name}`;

            const pdfUploadRes = await fetch('/api/admin/books/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: pdfPath }),
            });

            if (!pdfUploadRes.ok) throw new Error('获取PDF上传链接失败');
            const pdfUploadData = await pdfUploadRes.json();
            console.log('Got PDF upload URL:', pdfUploadData.url);

            // 上传PDF到COS
            const pdfFormData = new FormData();
            pdfFormData.append('key', pdfPath);
            pdfFormData.append('Signature', pdfUploadData.authorization);
            pdfFormData.append('x-cos-security-token', pdfUploadData.token);
            pdfFormData.append('x-cos-meta-fileid', pdfUploadData.cos_file_id);
            pdfFormData.append('file', pdf);

            const pdfCosRes = await fetch(pdfUploadData.url, {
                method: 'POST',
                body: pdfFormData,
            });

            if (!pdfCosRes.ok) throw new Error('PDF上传失败');
            console.log('PDF upload successful, proceeding to create book record');

            const res = await fetch('/api/admin/books/uploadSuccess', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    accessLevel,
                    coverPath,
                    pdfPath
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || '上传失败');
            }

            console.log('Book record created successfully');
            setStatus({ type: 'success', message: '期刊上传成功！' });
            setTitle('');
            setAccessLevel(0);
            setCover(null);
            setPdf(null);
        } catch (error) {
            console.error('Upload process failed:', {
                error: error.message,
                stack: error.stack
            });
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
            console.log('Upload process completed');
        }
    };

    return (
        <Layout>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom>
                    上传新期刊
                </Typography>
                {status.message && (
                    <Alert severity={status.type} sx={{ mb: 2 }}>
                        {status.message}
                    </Alert>
                )}
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="期刊标题"
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
                            onChange={(e) => handleFileChange(e, 'cover')}
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
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            支持jpg、png格式，文件大小不超过30MB
                        </Typography>
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
                            onChange={(e) => handleFileChange(e, 'pdf')}
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
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            支持PDF格式，文件大小不超过30MB
                        </Typography>
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
                        {loading ? <CircularProgress size={24} /> : '上传期刊'}
                    </Button>
                </form>
            </Paper>
        </Layout>
    );
} 