import type { EdamamSearchResponse, EdamamSearchFilters } from '../types/edamam';
import type { RakutenSearchResponse } from '../types/rakuten';
import type { UnifiedRecipe, RecipeDataForAPI, ProcessedRecipe } from '../types/recipe';

/**
 * Edamam APIからレシピを検索（フィルター対応）
 */
export async function searchEdamamRecipes(
  query: string,
  filters?: Partial<EdamamSearchFilters>
): Promise<UnifiedRecipe[]> {
  try {
    const params = new URLSearchParams({ q: query });
    
    // フィルターを追加
    if (filters?.diet) params.append('diet', filters.diet);
    if (filters?.health) params.append('health', filters.health);
    if (filters?.cuisineType) params.append('cuisineType', filters.cuisineType);
    if (filters?.mealType) params.append('mealType', filters.mealType);
    if (filters?.dishType) params.append('dishType', filters.dishType);
    if (filters?.calories) params.append('calories', filters.calories);
    if (filters?.time) params.append('time', filters.time);
    if (filters?.from !== undefined) params.append('from', filters.from.toString());
    if (filters?.to !== undefined) params.append('to', filters.to.toString());

    const response = await fetch(`/api/recipes/edamam?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }

    const data: EdamamSearchResponse = await response.json();
    
    // APIキーが未設定の場合は空配列を返す
    if (!data.hits || data.hits.length === 0) {
      console.warn('Edamam API returned no results. Check if API credentials are configured.');
      return [];
    }

    return data.hits.map((hit) => ({
      id: hit.recipe.uri,
      title: hit.recipe.label,
      image: hit.recipe.image,
      url: hit.recipe.url,
      source: 'edamam' as const,
      calories: Math.round(hit.recipe.calories),
      time: hit.recipe.totalTime || 0,
      servings: hit.recipe.yield,
      ingredients: hit.recipe.ingredientLines,
    }));
  } catch (error) {
    console.error('Edamam search error:', error);
    return [];
  }
}

/**
 * 楽天レシピAPIからカテゴリ別レシピを検索
 */
export async function searchRakutenRecipesByCategory(category: string): Promise<UnifiedRecipe[]> {
  try {
    const response = await fetch(`/api/recipes/search?category=${encodeURIComponent(category)}`);
    if (!response.ok) {
      throw new Error(`Rakuten API error: ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      console.error('Empty response from Rakuten API');
      return [];
    }

    const data: RakutenSearchResponse = JSON.parse(text);

    return (data.result || []).map((recipe) => ({
      id: recipe.recipeUrl,
      title: recipe.recipeTitle,
      image: recipe.foodImageUrl,
      url: recipe.recipeUrl,
      source: 'rakuten' as const,
      recipeMaterial: recipe.recipeMaterial,
      recipeIndication: recipe.recipeIndication,
    }));
  } catch (error) {
    console.error('Rakuten search error:', error);
    return [];
  }
}

/**
 * 楽天レシピをキーワードで検索（人気メニューから絞り込み）
 */
export async function searchRakutenRecipesByKeyword(keyword: string): Promise<UnifiedRecipe[]> {
  try {
    const recipes = await searchRakutenRecipesByCategory('人気メニュー');
    return recipes.filter((recipe) =>
      recipe.title.toLowerCase().includes(keyword.toLowerCase())
    );
  } catch (error) {
    console.error('Rakuten keyword search error:', error);
    return [];
  }
}

/**
 * OpenAI APIでレシピを処理
 */
export async function processRecipeWithAI(recipe: UnifiedRecipe): Promise<ProcessedRecipe | null> {
  try {
    let recipeData: RecipeDataForAPI;

    if (recipe.source === 'edamam') {
      recipeData = {
        recipeTitle: recipe.title,
        recipeMaterial: recipe.ingredients || [],
        recipeIndication: `Cooking time: ${recipe.time || 0} minutes. Serves ${recipe.servings || 0}.`,
      };
    } else {
      recipeData = {
        recipeTitle: recipe.title,
        recipeMaterial: recipe.recipeMaterial || [],
        recipeIndication: recipe.recipeIndication || '',
      };
    }

    const response = await fetch('/api/recipes/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeData }),
    });

    if (!response.ok) {
      throw new Error(`Process API error: ${response.status}`);
    }

    const processedRecipe: ProcessedRecipe = await response.json();
    
    // 元のレシピ情報を追加
    return {
      ...processedRecipe,
      originalRecipeId: recipe.id,
      image: recipe.image,
      url: recipe.url,
      source: recipe.source,
    };
  } catch (error) {
    console.error('Recipe processing error:', error);
    return null;
  }
}
