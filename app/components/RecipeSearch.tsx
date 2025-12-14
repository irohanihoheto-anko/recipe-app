'use client';

import { useState, useCallback, useRef } from 'react';
import type { UnifiedRecipe, ProcessedRecipe } from '../types/recipe';
import {
  searchRakutenRecipesByCategory,
  processRecipeWithAI,
} from '../lib/api-client';

import SearchHeader from './SearchHeader';
import CategoryGrid from './CategoryGrid';
import RecipeList from './RecipeList';

/**
 * レシピ検索メインコンポーネント
 * カテゴリ選択、レシピ一覧表示、レシピ詳細表示を管理
 */
export default function RecipeSearch() {
  // State管理
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recipes, setRecipes] = useState<UnifiedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipeCache, setRecipeCache] = useState<Map<string, ProcessedRecipe>>(new Map());

  // レシピリストへのRef（スクロール用）
  const recipeListRef = useRef<HTMLDivElement>(null);

  /**
   * カテゴリクリック時の処理
   * 選択されたカテゴリの楽天レシピを検索して表示
   */
  const handleCategoryClick = useCallback(async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setLoading(true);

    try {
      const results = await searchRakutenRecipesByCategory(categoryName);
      setRecipes(results);

      // レシピ一覧へスクロール
      setTimeout(() => {
        recipeListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * レシピクリック時の処理
   * キャッシュをチェックし、なければAI処理を実行してキャッシュに保存
   */
  const handleRecipeClick = useCallback(async (recipe: UnifiedRecipe): Promise<ProcessedRecipe | null> => {
    // キャッシュから取得を試みる
    const cached = recipeCache.get(recipe.id);
    if (cached) {
      return cached;
    }

    // AI処理を実行
    try {
      const processed = await processRecipeWithAI(recipe);

      // キャッシュに保存
      if (processed) {
        setRecipeCache(prev => new Map(prev).set(recipe.id, processed));
      }

      return processed;
    } catch (error) {
      console.error('Failed to process recipe:', error);
      return null;
    }
  }, [recipeCache]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      {/* ヘッダー */}
      <SearchHeader />

      {/* カテゴリセクション */}
      <CategoryGrid
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* ローディング */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-semibold">レシピを読み込み中...</p>
        </div>
      )}

      {/* レシピ一覧（展開型） */}
      <div ref={recipeListRef}>
        <RecipeList
          recipes={recipes}
          selectedCategory={selectedCategory}
          onRecipeClick={handleRecipeClick}
        />
      </div>
    </div>
  );
}
