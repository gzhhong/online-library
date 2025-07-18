import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token');

  // 检查是否访问管理员页面
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
        return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // 如果访问的是根路径 /admin
    if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/admin/upload', request.url));
    }
    return NextResponse.next();
  }

  // 检查是否访问MatchLawyer页面
  if (pathname.startsWith('/matchlawyer')) {
    if (pathname === '/matchlawyer/login') {
        return NextResponse.next();
    }
    if (!token) {
        return NextResponse.redirect(new URL('/matchlawyer/login', request.url));
    }
    // 如果访问的是根路径 /matchlawyer
    if (pathname === '/matchlawyer') {
        return NextResponse.redirect(new URL('/matchlawyer/industries', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
    // 匹配admin和matchlawyer路径，只处理页面
    // 不处理api路径
  matcher: ['/admin/:path*', '/matchlawyer/:path*']
}; 