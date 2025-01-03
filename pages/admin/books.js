import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Books() {
    const [books, setBooks] = useState([]);
    const router = useRouter();

    async function handleDelete(id) {
        if (!confirm('确定要删除这本书吗？')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/books/delete?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // 从列表中移除已删除的书籍
                setBooks(books.filter(book => book.id !== id));
            } else {
                const data = await res.json();
                alert(data.message || '删除失败');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('删除失败');
        }
    }

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
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">图书管理</h1>
            <Link href="/admin/upload" className="bg-blue-500 text-white px-4 py-2 rounded mb-4 inline-block">
                上传新书
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {books.map(book => (
                    <div key={book.id} className="border p-4 rounded">
                        <img src={book.coverPath} alt={book.title} className="w-full h-48 object-cover mb-2"/>
                        <h2 className="text-xl font-bold">{book.title}</h2>
                        <p>访问级别：{book.accessLevel}</p>
                        <button
                            onClick={() => handleDelete(book.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                        >
                            删除
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
} 