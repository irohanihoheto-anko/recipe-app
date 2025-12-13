'use client';

import { useState } from 'react';
import type { UnifiedRecipe, ProcessedRecipe } from '../types/recipe';
import {
  searchRakutenRecipesByCategory,
  processRecipeWithAI,
} from '../lib/api-client';

import SearchHeader from './SearchHeader';
import CategoryGrid from './CategoryGrid';
import RecipeList from './RecipeList';

export default function RecipeSearch() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recipes, setRecipes] = useState<UnifiedRecipe[]>([]);
  const [loading, setLoading] = useState(false);

  // レシピキャッシュ: recipeId -> ProcessedRecipe
  const [recipeCache, setRecipeCache] = useState<Map<string, ProcessedRecipe>>(new Map());

  // カテゴリでレシピを検索（楽天のみ）
  const handleCategoryClick = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setLoading(true);

    const results = await searchRakutenRecipesByCategory(categoryName);
    setRecipes(results);
    setLoading(false);
  };

  // レシピを処理（キャッシュを確認してから処理）
  const handleRecipeClick = async (recipe: UnifiedRecipe): Promise<ProcessedRecipe | null> => {
    console.log('Processing recipe:', recipe.title);
    
    // キャッシュを確認
    if (recipeCache.has(recipe.id)) {
      console.log('Using cached recipe');
      return recipeCache.get(recipe.id)!;
    }
    
    // キャッシュにない場合は処理
    const processed = await processRecipeWithAI(recipe);
    console.log('Processed recipe:', processed);
    
    // キャッシュに保存
    if (processed) {
      setRecipeCache(new Map(recipeCache.set(recipe.id, processed)));
    }
    
    return processed;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-green-50">
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
      <RecipeList
        recipes={recipes}
        selectedCategory={selectedCategory}
        onRecipeClick={handleRecipeClick}
      />
    </div>
  );
}
