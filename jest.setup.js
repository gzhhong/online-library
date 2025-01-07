require('@testing-library/jest-dom');

// Mock next/router
jest.mock('next/router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        pathname: '/admin/books'
    })
})); 

// 添加 Layout 组件的 mock
jest.mock('@/components/Layout', () => {
    return function MockLayout({ children }) {
        const React = require('react');
        return React.createElement('div', null, children);
    };
}); 