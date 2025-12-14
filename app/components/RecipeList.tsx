import Image from 'next/image';
import { useState, useCallback } from 'react';
import type { UnifiedRecipe, ProcessedRecipe } from '../types/recipe';
import { getOrCreateSessionId } from '../lib/session';
import RecipeDetail from './RecipeDetail';

interface RecipeListProps {
  recipes: UnifiedRecipe[];
  selectedCategory: string;
  onRecipeClick: (recipe: UnifiedRecipe) => Promise<ProcessedRecipe | null>;
}

/**
 * レシピ一覧表示コンポーネント
 * レシピカードの表示、保存、詳細表示を管理
 */
export default function RecipeList({
  recipes,
  selectedCategory,
  onRecipeClick,
}: RecipeListProps) {
  // State管理
  const [savingRecipes, setSavingRecipes] = useState<Set<string>>(new Set());
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const [processedRecipe, setProcessedRecipe] = useState<ProcessedRecipe | null>(null);

  /**
   * レシピ保存処理
   * Supabase認証トークンを取得してAPIに送信
   */
  const handleSaveRecipe = useCallback(async (recipe: UnifiedRecipe, e: React.MouseEvent) => {
    e.stopPropagation();

    // 既に保存処理中の場合は何もしない
    if (savingRecipes.has(recipe.id)) return;

    setSavingRecipes(prev => new Set(prev).add(recipe.id));

    try {
      const sessionId = getOrCreateSessionId();

      // Supabase認証トークンを取得
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // レシピ保存APIを呼び出し
      const response = await fetch('/api/saved-recipes', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, recipe }),
      });

      // レスポンス処理
      if (response.ok) {
        window.alert('⭐ レシピを保存しました！');
      } else if (response.status === 409) {
        window.alert('ℹ️ このレシピはすでに保存されています');
      } else {
        const errorData = await response.json().catch(() => ({ error: '不明なエラー' }));
        console.error('Save failed:', errorData);
        window.alert(`保存に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      window.alert('保存に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setSavingRecipes(prev => {
        const next = new Set(prev);
        next.delete(recipe.id);
        return next;
      });
    }
  }, [savingRecipes]);

  /**
   * レシピカードクリック処理
   * レシピ詳細を展開/折りたたみ、AI処理を実行
   */
  const handleRecipeCardClick = useCallback(async (recipe: UnifiedRecipe, index: number) => {
    // 既に展開中のレシピをクリックした場合は閉じる
    if (expandedIndex === index) {
      setExpandedIndex(null);
      setProcessedRecipe(null);
      return;
    }

    // 新しいレシピを展開
    setExpandedIndex(index);
    setLoadingRecipeId(recipe.id);
    setProcessedRecipe(null);

    // 閲覧履歴に保存 (LocalStorage)
    try {
      const historyKey = 'recipe_history';
      const historyItem = {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        calories: recipe.calories,
        time: recipe.time,
        viewedAt: new Date().toISOString(),
      };

      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      // 重複を除去（同じIDなら古い方を削除して先頭に追加＝最新にする）
      const filteredHistory = existingHistory.filter((item: any) => item.id !== recipe.id);
      const newHistory = [historyItem, ...filteredHistory].slice(0, 50); // 最大50件保持

      localStorage.setItem(historyKey, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history:', e);
    }

    try {
      // AI処理を実行
      const processed = await onRecipeClick(recipe);

      if (processed) {
        setProcessedRecipe(processed);
      } else {
        // Fallback provided by api-client.ts should prevent this, but just in case:
        alert('レシピの読み込みに失敗しました。時間をおいて再度お試しください。');
        setExpandedIndex(null);
      }
    } catch (error) {
      console.error('Error processing recipe:', error);
    } finally {
      setLoadingRecipeId(null);
    }
  }, [expandedIndex, onRecipeClick]);

  // レシピが空の場合は何も表示しない
  if (recipes.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-12">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-stone-700 mb-2">
          {selectedCategory ? `${selectedCategory}のレシピ` : 'レシピ一覧'}
        </h2>
        <p className="text-stone-500">{recipes.length}件のレシピが見つかりました</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {recipes.map((recipe, index) => (
          <div key={recipe.id + index} className={expandedIndex === index ? 'col-span-2 md:col-span-3' : ''}>
            {/* カード表示（展開時は非表示） */}
            {expandedIndex !== index && (
              <div
                onClick={() => handleRecipeCardClick(recipe, index)}
                className="group cursor-pointer bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-stone-200/50"
              >
                <div className="flex flex-col">
                  <div className="relative overflow-hidden aspect-square w-full">
                    <Image
                      src={recipe.image}
                      alt={recipe.title}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute top-1 right-1 md:top-2 md:right-2">
                      {/* 保存ボタン */}
                      <button
                        onClick={(e) => handleSaveRecipe(recipe, e)}
                        disabled={savingRecipes.has(recipe.id)}
                        className="bg-white/90 hover:bg-white text-stone-600 p-1 md:p-2 rounded-lg shadow-md transition disabled:opacity-50"
                        title="レシピを保存"
                      >
                        <span className="text-base md:text-xl">{savingRecipes.has(recipe.id) ? '⏳' : '💾'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-bold text-stone-700 group-hover:text-amber-600 transition mb-1 md:mb-2 text-xs md:text-base line-clamp-2">
                      {recipe.translatedTitle || recipe.title}
                    </h3>
                    {recipe.calories && (
                      <div className="flex items-center gap-2 md:gap-3 text-stone-500 text-xs md:text-sm">
                        <span>🔥 {recipe.calories}kcal</span>
                        {recipe.time && recipe.time > 0 && <span>⏱️ {recipe.time}分</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 展開エリア（ローディングまたは詳細表示） */}
            {expandedIndex === index && (
              <div className="mt-4">
                {loadingRecipeId === recipe.id ? (
                  <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-stone-200/50">
                    <div className="inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-stone-600 font-semibold">レシピの詳細を読み込み中...</p>
                  </div>
                ) : processedRecipe ? (
                  <RecipeDetail
                    recipe={processedRecipe}
                    onBack={() => {
                      setExpandedIndex(null);
                      setProcessedRecipe(null);
                    }}
                  />
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                    <p className="text-red-600 font-semibold">⚠️ レシピの読み込みに失敗しました</p>
                    <button
                      onClick={() => handleRecipeCardClick(recipe, index)}
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
