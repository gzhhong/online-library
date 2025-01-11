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

        const searchResults = parseSearchText(searchText);

        // 如果返回错误，不进行过滤
        if (searchResults.error) {
            return;
        }

        // 过滤图书
        const filtered = allBooks.filter(book => {
            let matches = true;

            // 遍历所有搜索条件
            searchResults.forEach(condition => {
                switch (condition.key) {
                    case 'time':
                        const conditionTime = parseInt(condition.value, 10);

                        switch (condition.opt) {
                            case 'eq':
                                matches = matches && book.time === conditionTime;
                                break;
                            case 'gte':
                                matches = matches && book.time >= conditionTime;
                                break;
                            case 'lte':
                                matches = matches && book.time <= conditionTime;
                                break;
                        }
                        break;

                    case 'accessLevel':
                        switch (condition.opt) {
                            case 'eq':
                                matches = matches && book.accessLevel === condition.value;
                                break;
                            case 'gte':
                                matches = matches && book.accessLevel >= condition.value;
                                break;
                            case 'lte':
                                matches = matches && book.accessLevel <= condition.value;
                                break;
                        }
                        break;

                    case 'keywords':
                        matches = matches && (
                            book.title.toLowerCase().includes(condition.value.toLowerCase()) ||
                            (book.description && book.description.toLowerCase().includes(condition.value.toLowerCase()))
                        );
                        break;

                    // 暂时忽略 type
                    case 'type':
                        break;
                }
            });

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

    // function getFileNameFromPath(path) {
    //     return path.split('/').pop();
    // }

    async function handlePreview(pdfPath) {
        try {
            const response = await fetch(getFullUrl(pdfPath));
            if (!response.ok) throw new Error('Failed to fetch PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            // Create a temporary link element for downloading
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = getFileNameFromPath(pdfPath); // Extract file name from path
            // document.body.appendChild(a);
            // a.click();
            // document.body.removeChild(a);

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