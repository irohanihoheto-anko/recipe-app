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
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-around items-center">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
              pathname === '/'
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-semibold">ホーム</span>
          </Link>

          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <span className="text-2xl">🔍</span>
            <span className="text-xs font-semibold">検索</span>
          </Link>

          <Link
            href="/mypage"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
              pathname === '/mypage'
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            <span className="text-2xl">📚</span>
            <span className="text-xs font-semibold">マイページ</span>
          </Link>

          {user && (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <span className="text-2xl">🚪</span>
              <span className="text-xs font-semibold">ログアウト</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
