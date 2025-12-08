// Edamam検索フィルター
export interface EdamamSearchFilters {
  query: string;
  diet?: 'balanced' | 'high-protein' | 'low-carb' | 'low-fat';
  health?: 'vegan' | 'vegetarian' | 'paleo' | 'dairy-free' | 'gluten-free' | 'wheat-free' | 'egg-free' | 'peanut-free' | 'tree-nut-free' | 'soy-free' | 'fish-free' | 'shellfish-free';
  cuisineType?: 'american' | 'asian' | 'british' | 'caribbean' | 'central europe' | 'chinese' | 'eastern europe' | 'french' | 'indian' | 'italian' | 'japanese' | 'kosher' | 'mediterranean' | 'mexican' | 'middle eastern' | 'nordic' | 'south american' | 'south east asian';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'teatime';
  dishType?: 'alcohol cocktail' | 'biscuits and cookies' | 'bread' | 'cereals' | 'condiments and sauces' | 'desserts' | 'drinks' | 'main course' | 'pancake' | 'preps' | 'preserve' | 'salad' | 'sandwiches' | 'side dish' | 'soup' | 'starter' | 'sweets';
  calories?: string; // 例: "100-500"
  time?: string; // 例: "1-30" (minutes)
  from?: number;
  to?: number;
}

// Edamam APIのレシピ型定義
export interface EdamamRecipe {
  recipe: {
    uri: string;
    label: string;
    image: string;
    url: string;
    yield: number;
    dietLabels: string[];
    healthLabels: string[];
    ingredientLines: string[];
    ingredients: Array<{
      text: string;
      quantity: number;
      measure: string;
      food: string;
      weight: number;
    }>;
    calories: number;
    totalTime: number;
    cuisineType: string[];
    mealType: string[];
    dishType: string[];
    totalNutrients: {
      ENERC_KCAL: { label: string; quantity: number; unit: string };
      FAT: { label: string; quantity: number; unit: string };
      CHOCDF: { label: string; quantity: number; unit: string };
      PROCNT: { label: string; quantity: number; unit: string };
    };
  };
}

export interface EdamamSearchResponse {
  from: number;
  to: number;
  count: number;
  _links: {
    next?: {
      href: string;
      title: string;
    };
  };
  hits: EdamamRecipe[];
}
