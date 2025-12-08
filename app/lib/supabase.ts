import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// スキーマキャッシュを無効化するオプション
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'cache-control': 'no-cache',
    },
  },
});

// デバッグ用
if (typeof window !== 'undefined') {
  console.log('🔍 Supabase Client initialized');
}
