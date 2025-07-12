import { NextResponse } from 'next/server';

export function middleware(request) {
  // 检查是否访问管理员页面
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 如果访问的是根路径 /admin
    if (request.nextUrl.pathname === '/admin') {
      // 先检查token
      const token = request.cookies.get('token');
      if (!token) {
        // 没有token，重定向到登录页
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      // 有token，重定向到上传页面
      return NextResponse.redirect(new URL('/admin/upload', request.url));
    }

    // 排除登录页面
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 其他admin路径检查token
    const token = request.cookies.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // 检查是否访问MatchLawyer页面
  if (request.nextUrl.pathname.startsWith('/matchlawyer')) {

    // 如果访问的是根路径 /matchlawyer
    if (request.nextUrl.pathname === '/matchlawyer') {
      // 先检查token
      const token = request.cookies.get('token');
      if (!token) {
        // 没有token，重定向到登录页
        return NextResponse.redirect(new URL('/matchlawyer/login', request.url));
      }
      // 有token，重定向到首页或主页面
      return NextResponse.redirect(new URL('/matchlawyer/dashboard', request.url));
    }
    // 排除登录页面，直接通过
    if (request.nextUrl.pathname === '/matchlawyer/login') {
        return NextResponse.next();
      }
  
    // 其他matchlawyer路径检查token
    const token = request.cookies.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/matchlawyer/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/matchlawyer/:path*']
}; 