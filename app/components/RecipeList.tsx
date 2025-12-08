import Image from 'next/image';
import type { UnifiedRecipe, ProcessedRecipe } from '../types/recipe';
import { getOrCreateSessionId } from '../lib/session';
import { useState } from 'react';
import RecipeDetail from './RecipeDetail';

interface RecipeListProps {
  recipes: UnifiedRecipe[];
  selectedCategory: string;
  searchQuery: string;
  onRecipeClick: (recipe: UnifiedRecipe) => Promise<ProcessedRecipe | null>;
}

export default function RecipeList({
  recipes,
  selectedCategory,
  searchQuery,
  onRecipeClick,
}: RecipeListProps) {
  const [savingRecipes, setSavingRecipes] = useState<Set<string>>(new Set());
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const [processedRecipe, setProcessedRecipe] = useState<ProcessedRecipe | null>(null);
  const [isGridView, setIsGridView] = useState(false); // true: 2列, false: 1列

  if (recipes.length === 0) {
    return null;
  }

  const handleSaveRecipe = async (recipe: UnifiedRecipe, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (savingRecipes.has(recipe.id)) return;
    
    setSavingRecipes((prev) => new Set(prev).add(recipe.id));
    
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
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, recipe }),
      });
      
      if (response.ok) {
        if (typeof window !== 'undefined') {
          window.alert('⭐ レシピを保存しました！');
        }
      } else if (response.status === 409) {
        if (typeof window !== 'undefined') {
          window.alert('ℹ️ このレシピはすでに保存されています');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save failed:', errorData);
        if (typeof window !== 'undefined') {
          window.alert(`保存に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      if (typeof window !== 'undefined') {
        window.alert('保存に失敗しました。ネットワーク接続を確認してください。');
      }
    } finally {
      setSavingRecipes((prev) => {
        const next = new Set(prev);
        next.delete(recipe.id);
        return next;
      });
    }
  };

  const handleRecipeCardClick = async (recipe: UnifiedRecipe) => {
    console.log('=== Recipe Card Clicked ===' );
    console.log('Recipe:', recipe);
    
    // すでに展開されているレシピをクリックした場合は閉じる
    if (expandedRecipeId === recipe.id) {
      setExpandedRecipeId(null);
      setProcessedRecipe(null);
      return;
    }

    // 新しいレシピをクリックした場合
    setExpandedRecipeId(recipe.id);
    setLoadingRecipeId(recipe.id);
    setProcessedRecipe(null);

    console.log('Calling onRecipeClick...');
    
    // AI処理を実行
    const processed = await onRecipeClick(recipe);
    
    console.log('Received processed recipe:', processed);
    
    if (processed) {
      setProcessedRecipe(processed);
      console.log('Set processed recipe to state');
    } else {
      console.error('Processed recipe is null!');
    }
    
    setLoadingRecipeId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {selectedCategory
              ? `${selectedCategory}のレシピ`
              : searchQuery
              ? `「${searchQuery}」の検索結果`
              : 'レシピ一覧'}
          </h2>
          <p className="text-gray-600">{recipes.length}件のレシピが見つかりました</p>
        </div>
        
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
        {recipes.map((recipe, index) => (
          <div key={recipe.id + index} className={expandedRecipeId === recipe.id && !isGridView ? 'col-span-2' : ''}>
            <div
              onClick={() => handleRecipeCardClick(recipe)}
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
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-2 right-2">
                    {/* 保存ボタン */}
                    <button
                      onClick={(e) => handleSaveRecipe(recipe, e)}
                      disabled={savingRecipes.has(recipe.id)}
                      className="bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md transition disabled:opacity-50"
                      title="レシピを保存"
                    >
                      <span className="text-xl">{savingRecipes.has(recipe.id) ? '⏳' : '💾'}</span>
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
            {expandedRecipeId === recipe.id && (
              <div className="mt-4">
                {loadingRecipeId === recipe.id ? (
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
                  />
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                    <p className="text-red-600 font-semibold">⚠️ レシピの読み込みに失敗しました</p>
                    <button
                      onClick={() => handleRecipeCardClick(recipe)}
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
    </div>
  );
}
