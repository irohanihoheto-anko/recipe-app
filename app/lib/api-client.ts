import type { EdamamSearchResponse, EdamamSearchFilters } from '../types/edamam';
import type { RakutenSearchResponse } from '../types/rakuten';
import type { TheMealDBSearchResponse, TheMealDBRecipe } from '../types/themealdb';
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
 * TheMealDB APIからレシピを検索
 */
export async function searchTheMealDBRecipes(query: string): Promise<UnifiedRecipe[]> {
  try {
    const response = await fetch(`/api/recipes/themealdb?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`TheMealDB API error: ${response.status}`);
    }

    const data: TheMealDBSearchResponse = await response.json();

    if (!data.meals || data.meals.length === 0) {
      console.warn('TheMealDB API returned no results.');
      return [];
    }

    // 並列で翻訳を実行
    const translationPromises = data.meals.map(meal => translateText(meal.strMeal));
    const translations = await Promise.all(translationPromises);

    return data.meals.map((meal, index) => {
      // 材料リストを作成
      const ingredients: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}` as keyof TheMealDBRecipe];
        const measure = meal[`strMeasure${i}` as keyof TheMealDBRecipe];
        if (ingredient && ingredient.trim()) {
          ingredients.push(`${measure || ''} ${ingredient}`.trim());
        }
      }

      return {
        id: meal.idMeal,
        title: meal.strMeal,
        translatedTitle: translations[index],
        image: meal.strMealThumb,
        url: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
        source: 'themealdb' as const,
        ingredients,
      };
    });
  } catch (error) {
    console.error('TheMealDB search error:', error);
    return [];
  }
}

/**
 * テキストを日本語に翻訳
 */
export async function translateText(text: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // 翻訳失敗時は元のテキストを返す
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
    } else if (recipe.source === 'themealdb') {
      recipeData = {
        recipeTitle: recipe.translatedTitle || recipe.title,
        recipeMaterial: recipe.ingredients || [],
        recipeIndication: '',
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
