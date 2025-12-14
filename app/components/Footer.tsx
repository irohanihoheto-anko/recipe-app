'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { signOut } from '../lib/auth';

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await signOut();
      router.push('/auth');
    }
  };

  // 認証ページではフッターを表示しない
  if (pathname === '/auth') {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-1">
        <div className="flex justify-around items-center">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition ${pathname === '/'
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[10px] font-semibold">ホーム</span>
          </Link>

          <Link
            href="/mypage"
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition ${pathname === '/mypage'
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              }`}
          >
            <span className="text-xl">📚</span>
            <span className="text-[10px] font-semibold">マイページ</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
