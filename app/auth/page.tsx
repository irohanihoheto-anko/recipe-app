'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '../lib/auth';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        router.push('/');
        router.refresh();
      } else {
        await signIn(email, password);
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-stone-200/50">
          <div className="bg-gradient-to-r from-amber-100 to-emerald-100 p-8">
            <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-emerald-600">
              🍳 おいしいレシピ
            </h1>
            <p className="text-center text-stone-500 mt-2">
              {isSignUp ? 'アカウント作成' : 'ログイン'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-stone-700 bg-white/80"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-stone-700 bg-white/80"
                  placeholder="6文字以上"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:from-amber-600 hover:to-emerald-600 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '処理中...' : isSignUp ? 'サインアップ' : 'ログイン'}
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-amber-600 hover:text-amber-700 font-medium text-sm"
              >
                {isSignUp
                  ? 'すでにアカウントをお持ちですか？ログイン'
                  : 'アカウントをお持ちでない方はこちら'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
