import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';

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

    async function handlePreview(pdfPath) {
        try {
            const response = await fetch(pdfPath);
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

    useEffect(() => {
        async function fetchBooks() {
            try {
                const res = await fetch('/api/admin/books/list');
                if (!res.ok) throw new Error('获取图书列表失败');
                const data = await res.json();
                setBooks(data);
            } catch (error) {
                console.error('获取图书列表失败:', error);
            }
        }
        fetchBooks();
    }, []);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">图书管理</h1>
                    <Link 
                        href="/admin/upload" 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        上传新书
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.map(book => (
                        <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="aspect-w-3 aspect-h-4">
                                <img 
                                    src={book.coverPath} 
                                    alt={book.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">{book.title}</h2>
                                <p className="text-gray-600 mb-2">访问级别：{book.accessLevel}</p>
                                <p className="text-gray-500 text-sm mb-4">
                                    上传时间：{new Date(book.createdAt).toLocaleString()}
                                </p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handlePreview(book.pdfPath)}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
                                    >
                                        预览
                                    </button>
                                    <button
                                        onClick={() => handleDelete(book.id)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
} 