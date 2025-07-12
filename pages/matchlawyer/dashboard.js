import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MatchLawyerDashboard() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到industries页面
    router.push('/matchlawyer/industries');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">正在跳转...</h1>
        <p className="text-gray-600">正在跳转到标签管理页面</p>
      </div>
    </div>
  );
} 