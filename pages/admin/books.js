import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
    Grid, 
    Card, 
    CardMedia, 
    CardContent, 
    Typography, 
    CardActions, 
    Button,
    Box,
    CircularProgress,
    TextField,
    InputAdornment,
    Switch,
    FormControlLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '@/components/Layout';

export default function Books() {
    const [books, setBooks] = useState([]);
    const [allBooks, setAllBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const router = useRouter();
    const [updatingId, setUpdatingId] = useState(null);

    function getFullUrl(path) {
        return `${window.location.origin}/api/files${path}`;
    }

    const handleSearch = (event) => {
        const value = event.target.value;
        setSearchText(value);
        
        if (value.length >= 3 || /[\u4e00-\u9fa5]{2,}/.test(value)) {
            const searchValue = value.trim().toLowerCase();
            const filtered = allBooks.filter(book => 
                book.title.toLowerCase().includes(searchValue)
            );
            setBooks(filtered);
        } else if (!value) {
            setBooks(allBooks);
        }
    };

    async function handleDelete(id) {
        if (!confirm('确定要删除这本书吗？')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/books/delete?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setBooks(currentBooks => currentBooks.filter(book => book.id !== id));
                setAllBooks(currentAllBooks => currentAllBooks.filter(book => book.id !== id));
            } else {
                const data = await res.json();
                alert(data.message || '删除失败');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('删除失败');
        }
    }

    async function handlePreview(pdfPath) {
        try {
            const response = await fetch(getFullUrl(pdfPath));
            if (!response.ok) throw new Error('Failed to fetch PDF');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Error previewing PDF:', error);
            alert('无法预览PDF文件');
        }
    }

    const handleUnlistChange = async (book) => {
        try {
            setUpdatingId(book.id);
            const res = await fetch('/api/admin/books/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: book.id,
                    unlist: !book.unlist
                })
            });

            if (!res.ok) throw new Error('更新图书状态失败');
            
            const updatedBook = await res.json();
            
            setBooks(currentBooks => currentBooks.map(b => 
                b.id === updatedBook.id ? updatedBook : b
            ));
            
            setAllBooks(currentAllBooks => currentAllBooks.map(b => 
                b.id === updatedBook.id ? updatedBook : b
            ));

        } catch (error) {
            console.error('更新图书状态失败:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        async function fetchBooks() {
            try {
                const res = await fetch('/api/admin/books/list');
                if (!res.ok) throw new Error('获取图书列表失败');
                const data = await res.json();
                setBooks(data);
                setAllBooks(data);
            } catch (error) {
                console.error('获取图书列表失败:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBooks();
    }, []);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center flex-1">
                        <h1 className="text-3xl font-bold text-gray-800 mr-4">图书管理</h1>
                        <TextField
                            size="small"
                            placeholder="搜索图书..."
                            value={searchText}
                            onChange={handleSearch}
                            sx={{ 
                                width: 300,
                                ml: 'auto',
                                mr: 2,
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white'
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </div>
                    <Link 
                        href="/admin/upload" 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        上传新书
                    </Link>
                </div>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                        <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography color="text.secondary">
                                正在获取图书列表...
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {books.map(book => (
                            <Grid item xs={6} md={3} key={book.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardMedia
                                        component="img"
                                        sx={{ 
                                            height: 200, 
                                            objectFit: 'contain',
                                            bgcolor: 'grey.50'
                                        }}
                                        image={getFullUrl(book.coverPath)}
                                        alt={book.title}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="subtitle1" component="div" noWrap>
                                            {book.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            访问级别：{book.accessLevel}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {new Date(book.createdAt).toLocaleString()}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={book.unlist}
                                                    onChange={() => handleUnlistChange(book)}
                                                    disabled={updatingId === book.id}
                                                />
                                            }
                                            label={updatingId === book.id ? 
                                                <CircularProgress size={16} /> : 
                                                (book.unlist ? "已下架" : "下架")}
                                        />
                                        <Button
                                            size="small"
                                            color="primary"
                                            onClick={() => handlePreview(book.pdfPath)}
                                        >
                                            预览
                                        </Button>
                                        <Button 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleDelete(book.id)}
                                        >
                                            删除
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </div>
        </Layout>
    );
} 