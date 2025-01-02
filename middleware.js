import { NextResponse } from 'next/server';

export function middleware(request) {
  // 检查是否访问管理员页面
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 排除登录页面
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 检查token
    const token = request.cookies.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
}; 