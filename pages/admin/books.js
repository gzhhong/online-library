import { useState, useEffect } from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, CardActions, Button } from '@mui/material';
import Layout from '@/components/Layout';

export default function Books() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const res = await fetch('/api/admin/books/list');
            if (!res.ok) throw new Error('获取图书列表失败');
            const data = await res.json();
            setBooks(data);
        } catch (error) {
            console.error('获取图书列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (pdfPath) => {
        try {
            // 获取文件内容，fetch会自动带上cookies（包括token）
            const response = await fetch(`${window.location.origin}${pdfPath}`);
            if (!response.ok) throw new Error('Failed to fetch PDF');
            
            // 获取文件内容
            const blob = await response.blob();
            
            // 创建blob URL
            const url = window.URL.createObjectURL(blob);
            
            // 在新窗口打开
            window.open(url, '_blank');
            
            // 清理blob URL
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Error previewing PDF:', error);
            alert('无法预览PDF文件');
        }
    };

    return (
        <Layout>
            <Grid container spacing={3}>
                {books.map((book) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={book._id}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="200"
                                image={`${window.location.origin}${book.coverPath}`}
                                alt={book.title}
                                sx={{ objectFit: 'contain' }}
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    {book.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    访问权限: {book.accessLevel}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    上传时间: {new Date(book.createdAt).toLocaleString()}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button 
                                    size="small" 
                                    onClick={() => handlePreview(book.pdfPath)}
                                >
                                    预览PDF
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Layout>
    );
} 