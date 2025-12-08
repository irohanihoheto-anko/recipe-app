// 統一レシピ型（楽天とEdamamの両方に対応）
export interface UnifiedRecipe {
  id: string;
  title: string;
  image: string;
  url: string;
  source: 'rakuten' | 'edamam';
  // Edamam用
  calories?: number;
  time?: number;
  servings?: number;
  ingredients?: string[];
  // 楽天用
  recipeMaterial?: string[];
  recipeIndication?: string;
}

// OpenAI処理用の型
export interface Ingredient {
  name: string;
  amount: string;
  cost: number;
  calories: number;
}

export interface Step {
  stepNumber: number;
  description: string;
  timeMinutes?: number;
}

export interface ProcessedRecipe {
  title: string;
  totalTime: number;
  totalCost: number;
  totalCalories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: Ingredient[];
  steps: Step[];
  // 保存用の追加フィールド
  originalRecipeId?: string;
  image?: string;
  url?: string;
  source?: string;
}

// OpenAI APIリクエスト用
export interface RecipeDataForAPI {
  recipeTitle: string;
  recipeMaterial: string[];
  recipeIndication: string;
}
