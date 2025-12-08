'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { getOrCreateSessionId } from '../lib/session';
import { processRecipeWithAI } from '../lib/api-client';
import RecipeDetail from '../components/RecipeDetail';
import type { UnifiedRecipe, ProcessedRecipe } from '../types/recipe';

interface SavedRecipe {
  id: string;
  recipe_id: string;
  title: string;
  image: string;
  url: string;
  source: string;
  calories?: number;
  time?: number;
  created_at: string;
}

export default function MyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const [processedRecipe, setProcessedRecipe] = useState<ProcessedRecipe | null>(null);
  const [isGridView, setIsGridView] = useState(false);
  
  // レシピキャッシュ
  const [recipeCache, setRecipeCache] = useState<Map<string, ProcessedRecipe>>(new Map());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      
      // Supabaseからトークンを取得
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/saved-recipes?sessionId=${sessionId}`, {
        headers,
      });
      const data = await response.json();
      
      console.log('Loaded recipes:', data.savedRecipes);
      
      setSavedRecipes(data.savedRecipes || []);
    } catch (error) {
      console.error('Failed to load saved recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('このレシピを削除しますか？')) return;

    console.log('Deleting recipe with recipe_id:', recipeId);

    try {
      const sessionId = getOrCreateSessionId();
      
      // Supabaseからトークンを取得
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/saved-recipes', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ sessionId, recipeId }),
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      console.log('Delete successful');
      
      setSavedRecipes((prev) => {
        const filtered = prev.filter((r) => r.recipe_id !== recipeId);
        console.log('Remaining recipes:', filtered);
        return filtered;
      });
      
      // キャッシュからも削除
      setRecipeCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(recipeId);
        return newCache;
      });
      
      if (expandedRecipeId === recipeId) {
        setExpandedRecipeId(null);
        setProcessedRecipe(null);
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      alert('削除に失敗しました');
    }
  };

  const handleRecipeClick = async (recipe: SavedRecipe) => {
    if (expandedRecipeId === recipe.recipe_id) {
      setExpandedRecipeId(null);
      setProcessedRecipe(null);
      return;
    }

    setExpandedRecipeId(recipe.recipe_id);
    
    // キャッシュを確認
    if (recipeCache.has(recipe.recipe_id)) {
      console.log('Using cached recipe');
      setProcessedRecipe(recipeCache.get(recipe.recipe_id)!);
      return;
    }
    
    // キャッシュにない場合は処理
    setLoadingRecipeId(recipe.recipe_id);
    setProcessedRecipe(null);

    const unifiedRecipe: UnifiedRecipe = {
      id: recipe.recipe_id,
      title: recipe.title,
      image: recipe.image,
      url: recipe.url,
      source: recipe.source as 'rakuten' | 'edamam',
      calories: recipe.calories,
      time: recipe.time,
    };

    console.log('Processing recipe:', unifiedRecipe.title);

    const processed = await processRecipeWithAI(unifiedRecipe);
    
    console.log('Processed recipe:', processed);
    
    if (processed) {
      setProcessedRecipe(processed);
      // キャッシュに保存
      setRecipeCache(new Map(recipeCache.set(recipe.recipe_id, processed)));
    }
    
    setLoadingRecipeId(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-green-50">
      {/* ヘッダー */}
      <div className="bg-linear-to-r from-orange-500 to-red-600 text-white py-12 px-8 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            📚 マイページ
          </h1>
          <p className="text-center text-orange-100 mt-2">
            保存したレシピ一覧
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {authLoading || loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-semibold">読み込み中...</p>
          </div>
        ) : savedRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl text-gray-600 mb-4">📭 保存したレシピがありません</p>
            <p className="text-gray-500 mb-8">レシピを保存すると、ここに表示されます</p>
            <Link
              href="/"
              className="inline-block bg-linear-to-r from-orange-500 to-red-600 text-white px-8 py-3 rounded-full font-bold hover:from-orange-600 hover:to-red-700 transition"
            >
              レシピを探す
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                保存したレシピ ({savedRecipes.length}件)
              </h2>
              
              {/* 表示切替ボタン */}
              <button
                onClick={() => setIsGridView(!isGridView)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                <span className="text-xl">{isGridView ? '📋' : '⊞'}</span>
                <span className="text-sm font-medium text-gray-700">
                  {isGridView ? '1列' : '2列'}
                </span>
              </button>
            </div>
            
            <div className={`grid ${isGridView ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
              {savedRecipes.map((recipe) => (
                <div key={recipe.id} className={expandedRecipeId === recipe.recipe_id && !isGridView ? 'col-span-2' : ''}>
                  <div
                    onClick={() => handleRecipeClick(recipe)}
                    className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className={`relative overflow-hidden ${
                        isGridView 
                          ? 'h-64 w-full' 
                          : 'h-48 sm:h-auto sm:w-64 flex-shrink-0'
                      }`}>
                        <Image
                          src={recipe.image}
                          alt={recipe.title}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => handleDelete(recipe.recipe_id, e)}
                            className="bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md transition"
                            title="削除"
                          >
                            <span className="text-xl">🗑️</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className={`font-bold text-gray-800 group-hover:text-orange-600 transition mb-2 ${
                          isGridView ? 'text-xl' : 'text-base'
                        }`}>
                          {recipe.title}
                        </h3>
                        {recipe.calories && (
                          <div className={`flex items-center gap-3 text-gray-600 ${
                            isGridView ? 'text-sm' : 'text-xs'
                          }`}>
                            <span>🔥 {recipe.calories}kcal</span>
                            {recipe.time && recipe.time > 0 && <span>⏱️ {recipe.time}分</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 展開エリア（ローディングまたは詳細表示） */}
                  {expandedRecipeId === recipe.recipe_id && (
                    <div className="mt-4">
                      {loadingRecipeId === recipe.recipe_id ? (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                          <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="mt-4 text-gray-600 font-semibold">レシピの詳細を読み込み中...</p>
                        </div>
                      ) : processedRecipe ? (
                        <RecipeDetail
                          recipe={processedRecipe}
                          onBack={() => {
                            setExpandedRecipeId(null);
                            setProcessedRecipe(null);
                          }}
                          hideButtons={true}
                        />
                      ) : (
                        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                          <p className="text-red-600 font-semibold">⚠️ レシピの読み込みに失敗しました</p>
                          <button
                            onClick={() => handleRecipeClick(recipe)}
                            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
                          >
                            再試行
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
