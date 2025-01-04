import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function Books() {
    const [books, setBooks] = useState([]);
    const router = useRouter();

    function getFullUrl(path) {
        return `${window.location.origin}/api/files${path}`;
    }

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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {books.map(book => (
                        <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden p-4 flex flex-col">
                            <div className="w-full pb-[100%] relative">
                                <img 
                                    src={getFullUrl(book.coverPath)} 
                                    alt={book.title} 
                                    className="absolute inset-0 w-full h-full object-contain rounded-lg"
                                />
                            </div>
                            <div className="mt-4">
                                <h2 className="text-base font-semibold text-gray-800 mb-2 truncate">{book.title}</h2>
                                <p className="text-gray-600 text-sm mb-1">访问级别：{book.accessLevel}</p>
                                <p className="text-gray-500 text-xs mb-4">
                                    上传时间：{new Date(book.createdAt).toLocaleString()}
                                </p>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => handleDelete(book.id)}
                                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition-colors"
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