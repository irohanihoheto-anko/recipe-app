'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { getOrCreateSessionId } from '../lib/session';
import { processRecipeWithAI } from '../lib/api-client';
import { signOut } from '../lib/auth';
import RecipeDetail from '../components/RecipeDetail';
import type { UnifiedRecipe, ProcessedRecipe } from '../types/recipe';

interface SavedRecipe {
  id: string; // Supabase DB ID
  recipe_id: string; // Recipe ID (hash)
  title: string;
  image: string;
  calories?: number;
  time?: number;
  created_at: string;
}

interface HistoryItem {
  id: string;
  title: string;
  image: string;
  calories?: number;
  time?: number;
  viewedAt: string;
}

export default function MyPage() {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [historyRecipes, setHistoryRecipes] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'saved' | 'history'>('saved');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [processedRecipe, setProcessedRecipe] = useState<ProcessedRecipe | null>(null);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // 認証チェックとデータ取得
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }

    if (user) {
      fetchSavedRecipes();
      loadHistory();
    }
  }, [user, authLoading, router]);

  const fetchSavedRecipes = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/saved-recipes?sessionId=${sessionId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSavedRecipes(data.savedRecipes || []);
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = () => {
    try {
      const historyKey = 'recipe_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setHistoryRecipes(history);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  const handleDelete = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('このレシピを削除してもよろしいですか？')) return;

    try {
      const sessionId = getOrCreateSessionId();
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/saved-recipes?id=${recipeId}&sessionId=${sessionId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        setSavedRecipes(prev => prev.filter(r => r.recipe_id !== recipeId));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleRecipeClick = async (recipe: SavedRecipe | HistoryItem) => {
    // 履歴アイテムには recipe_id がない場合があるため id を使用
    const targetId = (recipe as SavedRecipe).recipe_id || recipe.id;

    if (expandedRecipeId === targetId) {
      setExpandedRecipeId(null);
      setProcessedRecipe(null);
      return;
    }

    setExpandedRecipeId(targetId);
    setLoadingRecipeId(targetId);
    setProcessedRecipe(null);

    // AI処理用にUnifiedRecipe形式に変換
    const unifiedRecipe: UnifiedRecipe = {
      id: targetId,
      title: recipe.title,
      image: recipe.image,
      url: '',
      source: 'rakuten',
      calories: recipe.calories,
      time: recipe.time,
      ingredients: []
    };

    try {
      const result = await processRecipeWithAI(unifiedRecipe);
      if (result) {
        setProcessedRecipe(result);
      } else {
        alert('レシピの読み込みに失敗しました。');
        setExpandedRecipeId(null);
      }
    } catch (error) {
      console.error('Process failed:', error);
    } finally {
      setLoadingRecipeId(null);
    }
  };

  // 履歴を日付ごとにグループ化
  const groupedHistory = historyRecipes.reduce((acc, recipe) => {
    const date = new Date(recipe.viewedAt).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(recipe);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-green-50 pb-24">
      {/* ヘッダー */}
      <div className="bg-linear-to-r from-orange-500 to-red-600 text-white py-12 px-8 shadow-xl relative">
        <div className="max-w-7xl mx-auto">
          <div className="absolute top-4 right-4">
            <button
              onClick={async () => {
                if (confirm('ログアウトしますか？')) {
                  await signOut();
                  router.push('/auth');
                }
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition text-sm font-bold flex items-center gap-2"
            >
              <span>🚪</span> ログアウト
            </button>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            📚 マイページ
          </h1>
          <p className="text-center text-orange-100 mt-2">
            保存したレシピと閲覧履歴
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* モード切り替えタブ */}
        <div className="flex justify-center mb-8 bg-white p-1 rounded-full shadow-md max-w-md mx-auto">
          <button
            onClick={() => setViewMode('saved')}
            className={`flex-1 py-3 px-6 rounded-full transition-all text-sm md:text-base font-bold flex items-center justify-center gap-2 ${viewMode === 'saved'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <span>💾</span> 保存済み
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-3 px-6 rounded-full transition-all text-sm md:text-base font-bold flex items-center justify-center gap-2 ${viewMode === 'history'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <span>🕰️</span> 閲覧履歴
          </button>
        </div>

        {viewMode === 'saved' ? (
          // 保存済みレシピ一覧
          savedRecipes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <span className="text-6xl mb-4 block">🍳</span>
              <p className="text-xl text-gray-500 font-bold">まだ保存したレシピはありません</p>
              <p className="text-gray-400 mt-2">気に入ったレシピを保存して、自分だけの料理本を作りましょう！</p>
              <Link href="/" className="inline-block mt-8 px-8 py-3 bg-orange-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition">
                レシピを探す
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedRecipes.map((recipe) => (
                <div key={recipe.id} className={expandedRecipeId === recipe.recipe_id ? 'col-span-1 md:col-span-2' : ''}>
                  {/* カード表示（展開時は非表示） */}
                  {expandedRecipeId !== recipe.recipe_id && (
                    <div
                      onClick={() => handleRecipeClick(recipe)}
                      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-row h-32 md:h-48">
                        <div className="relative w-1/3 md:w-48 flex-shrink-0">
                          <Image
                            src={recipe.image}
                            alt={recipe.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between relative">
                          <div>
                            <h3 className="font-bold text-gray-800 group-hover:text-orange-600 transition mb-2 text-base md:text-xl line-clamp-2">
                              {recipe.title}
                            </h3>
                            {recipe.calories && (
                              <div className="flex items-center gap-3 text-gray-600 text-xs md:text-sm">
                                <span>🔥 {recipe.calories}kcal</span>
                                {/* 時間があれば表示 */}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleDelete(recipe.recipe_id, e)}
                            className="absolute bottom-2 right-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 p-2 rounded-full transition"
                            title="削除"
                          >
                            <span className="text-lg">🗑️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 展開エリア */}
                  {expandedRecipeId === recipe.recipe_id && (
                    <div className="mt-4">
                      {loadingRecipeId === recipe.recipe_id ? (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                          <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="mt-4 text-gray-600 font-semibold">読み込み中...</p>
                        </div>
                      ) : processedRecipe ? (
                        <RecipeDetail
                          recipe={processedRecipe}
                          onBack={() => {
                            setExpandedRecipeId(null);
                            setProcessedRecipe(null);
                          }}
                        />
                      ) : (
                        <div className="text-center py-12">エラーが発生しました</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          // 閲覧履歴
          historyRecipes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">閲覧履歴はありません</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedHistory).map(([date, recipes]) => (
                <div key={date}>
                  <h3 className="text-xl font-bold text-gray-700 mb-4 px-2 border-l-4 border-orange-500 flex items-center gap-2">
                    {date}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipes.map((recipe, index) => (
                      <div key={`${date}-${recipe.id}-${index}`} className={expandedRecipeId === recipe.id ? 'col-span-1 md:col-span-2' : ''}>
                        {/* カード表示（展開時は非表示） */}
                        {expandedRecipeId !== recipe.id && (
                          <div
                            onClick={() => handleRecipeClick(recipe)}
                            className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex h-24"
                          >
                            <div className="relative w-24 h-full flex-shrink-0">
                              <Image
                                src={recipe.image}
                                alt={recipe.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-center">
                              <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 group-hover:text-orange-600 transition">
                                {recipe.title}
                              </h4>
                              {recipe.calories && (
                                <span className="text-xs text-gray-500 mt-1">🔥 {recipe.calories}kcal</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 展開エリア */}
                        {expandedRecipeId === recipe.id && (
                          <div className="mt-4">
                            {loadingRecipeId === recipe.id ? (
                              <div className="text-center py-8 bg-white rounded-xl">
                                <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : processedRecipe ? (
                              <RecipeDetail
                                recipe={processedRecipe}
                                onBack={() => {
                                  setExpandedRecipeId(null);
                                  setProcessedRecipe(null);
                                }}
                              />
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
