import { memo, useEffect } from 'react';
import { 
    Card, 
    CardMedia, 
    CardContent, 
    Typography, 
    CardActions, 
    Button,
    CircularProgress,
    Switch,
    FormControlLabel
} from '@mui/material';

// 创建一个记忆化的 BookCard 组件
const BookCard = memo(({ book, onDelete, onPreview, onUnlistChange, updatingId, getFullUrl }) => {
    // 预加载图片
    useEffect(() => {
        const img = new Image();
        img.src = getFullUrl(book.coverPath);
    }, [book.coverPath, getFullUrl]);

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
                component="img"
                sx={{ 
                    height: 200, 
                    objectFit: 'contain',
                    bgcolor: 'grey.50'
                }}
                image={getFullUrl(book.coverPath)}
                loading="lazy"
                alt={book.title}
            />
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6">
                    {book.title}
                </Typography>
                {book.year && book.issue && (
                    <Typography variant="body2" color="text.secondary">
                        {book.year}年 第{book.issue}期
                    </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                    访问权限: {book.accessLevel}
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={book.unlist}
                            onChange={() => onUnlistChange(book)}
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
                    onClick={() => onPreview(book.pdfPath)}
                >
                    预览
                </Button>
                <Button 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(book.id)}
                >
                    删除
                </Button>
            </CardActions>
        </Card>
    );
});

// 添加显示名称，方便调试
BookCard.displayName = 'BookCard';

export default BookCard; 