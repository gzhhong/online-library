import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
    Grid, 
    Button,
    Box,
    CircularProgress,
    TextField,
    InputAdornment,
    Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import { parseSearchText } from '@/lib/searchUtils';

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

    const handleSearch = (e) => {
        const searchText = e.target.value;
        setSearchText(searchText);
        
        const { year, issue, keyword, accessLevel, accessLevelOp } = parseSearchText(searchText);

        // 过滤图书
        const filtered = allBooks.filter(book => {
            let matches = true;

            // 按年份过滤
            if (year !== null) {
                matches = matches && book.year === year;
            }

            // 按期数过滤
            if (issue !== null) {
                matches = matches && book.issue === issue;
            }

            // 按访问权限过滤
            if (accessLevel !== null) {
                switch (accessLevelOp) {
                    case 'gte':
                        matches = matches && book.accessLevel >= accessLevel;
                        break;
                    case 'lte':
                        matches = matches && book.accessLevel <= accessLevel;
                        break;
                    case 'eq':
                        matches = matches && book.accessLevel === accessLevel;
                        break;
                }
            }

            // 按关键词过滤（标题或简介中包含关键词）
            if (keyword) {
                const keywordLower = keyword.toLowerCase();
                const titleMatches = book.title.toLowerCase().includes(keywordLower);
                const descriptionMatches = book.description?.toLowerCase().includes(keywordLower) || false;
                matches = matches && (titleMatches || descriptionMatches);
            }

            return matches;
        });

        setBooks(filtered);
    };

    async function handleDelete(id) {
        if (!confirm('确定要删除这本期刊吗？')) {
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

            if (!res.ok) throw new Error('更新期刊状态失败');
            
            const updatedBook = await res.json();
            
            setBooks(currentBooks => currentBooks.map(b => 
                b.id === updatedBook.id ? updatedBook : b
            ));
            
            setAllBooks(currentAllBooks => currentAllBooks.map(b => 
                b.id === updatedBook.id ? updatedBook : b
            ));

        } catch (error) {
            console.error('更新期刊状态失败:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    useEffect(() => {
        async function fetchBooks() {
            try {
                const res = await fetch('/api/admin/books/list');
                if (!res.ok) throw new Error('获取期刊列表失败');
                const data = await res.json();
                setBooks(data);
                setAllBooks(data);
            } catch (error) {
                console.error('获取期刊列表失败:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBooks();
    }, []);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '32px' 
                }}>
                    <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>期刊管理</span>
                    <TextField
                        placeholder="查询期刊，支持复合查询，如：2024年第10期意林"
                        value={searchText}
                        onChange={handleSearch}
                        size="small"
                        sx={{ 
                            width: '100%',
                            maxWidth: '450px',
                            '&.MuiOutlinedInput-root': {
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

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                        <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography color="text.secondary">
                                正在获取期刊列表...
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {books.map(book => (
                            <Grid item xs={6} md={3} key={book.id}>
                                <BookCard
                                    book={book}
                                    onDelete={handleDelete}
                                    onPreview={handlePreview}
                                    onUnlistChange={handleUnlistChange}
                                    updatingId={updatingId}
                                    getFullUrl={getFullUrl}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </div>
        </Layout>
    );
} 