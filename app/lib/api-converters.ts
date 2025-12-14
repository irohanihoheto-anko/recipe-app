import type { UnifiedRecipe } from '../types/recipe';
import type { TheMealDBMeal } from '../types/themealdb';
import type { SpoonacularRecipe } from '../types/spoonacular';

/**
 * TheMealDB APIのレスポンスをUnifiedRecipeに変換
 */
export function convertTheMealDBToUnified(meal: TheMealDBMeal): UnifiedRecipe {
  // 材料を収集
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof TheMealDBMeal];
    const measure = meal[`strMeasure${i}` as keyof TheMealDBMeal];

    if (ingredient && ingredient.trim()) {
      const ingredientStr = measure && measure.trim()
        ? `${measure.trim()} ${ingredient.trim()}`
        : ingredient.trim();
      ingredients.push(ingredientStr);
    }
  }

  return {
    id: `themealdb-${meal.idMeal}`,
    title: meal.strMeal,
    image: meal.strMealThumb || '/placeholder-recipe.jpg',
    url: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
    source: 'themealdb',
    calories: undefined, // TheMealDBにはカロリー情報がない
    time: undefined, // TheMealDBには調理時間情報がない
    servings: undefined,
    ingredients: ingredients,
    category: meal.strCategory,
    cuisine: meal.strArea,
    instructions: meal.strInstructions,
    tags: meal.strTags?.split(',').map(tag => tag.trim()),
    videoUrl: meal.strYoutube,
  };
}

/**
 * Spoonacular APIのレスポンスをUnifiedRecipeに変換
 */
export function convertSpoonacularToUnified(recipe: SpoonacularRecipe): UnifiedRecipe {
  // 材料を収集
  const ingredients = recipe.extendedIngredients?.map(ing =>
    `${ing.measures?.metric?.amount || ing.amount} ${ing.measures?.metric?.unitShort || ing.unit} ${ing.name}`
  ) || [];

  // カロリーを取得
  const caloriesNutrient = recipe.nutrition?.nutrients.find(n => n.name === 'Calories');
  const calories = caloriesNutrient ? Math.round(caloriesNutrient.amount) : undefined;

  return {
    id: `spoonacular-${recipe.id}`,
    title: recipe.title,
    image: recipe.image || '/placeholder-recipe.jpg',
    url: recipe.sourceUrl || recipe.spoonacularSourceUrl,
    source: 'spoonacular',
    calories,
    time: recipe.readyInMinutes,
    servings: recipe.servings,
    ingredients,
    category: recipe.dishTypes?.[0],
    cuisine: recipe.cuisines?.[0],
    instructions: recipe.instructions,
    tags: [
      ...(recipe.diets || []),
      ...(recipe.dishTypes || []),
      recipe.vegan ? 'vegan' : null,
      recipe.vegetarian ? 'vegetarian' : null,
      recipe.glutenFree ? 'gluten-free' : null,
      recipe.dairyFree ? 'dairy-free' : null,
    ].filter(Boolean) as string[],
    healthScore: recipe.healthScore,
    pricePerServing: recipe.pricePerServing,
    analyzedInstructions: recipe.analyzedInstructions,
  };
}

/**
 * Edamam APIのレスポンスをUnifiedRecipeに変換
 */
export function convertEdamamToUnified(hit: any): UnifiedRecipe {
  const recipe = hit.recipe;

  return {
    id: `edamam-${recipe.uri.split('#recipe_')[1]}`,
    title: recipe.label,
    image: recipe.image || '/placeholder-recipe.jpg',
    url: recipe.url,
    source: 'edamam',
    calories: recipe.calories ? Math.round(recipe.calories / (recipe.yield || 1)) : undefined,
    time: recipe.totalTime || undefined,
    servings: recipe.yield,
    ingredients: recipe.ingredientLines || [],
    category: recipe.dishType?.[0],
    cuisine: recipe.cuisineType?.[0],
    tags: [
      ...(recipe.dietLabels || []),
      ...(recipe.healthLabels || []),
      ...(recipe.dishType || []),
    ],
    healthScore: recipe.healthLabels?.length,
  };
}

/**
 * 楽天レシピAPIのレスポンスをUnifiedRecipeに変換
 */
export function convertRakutenToUnified(recipe: any): UnifiedRecipe {
  return {
    id: `rakuten-${recipe.recipeId}`,
    title: recipe.recipeTitle,
    image: recipe.foodImageUrl || '/placeholder-recipe.jpg',
    url: recipe.recipeUrl,
    source: 'rakuten',
    calories: undefined,
    time: parseInt(recipe.recipeIndication) || undefined,
    servings: undefined,
    ingredients: recipe.recipeMaterial || [],
    category: recipe.categoryName,
    tags: [recipe.categoryName],
  };
}
