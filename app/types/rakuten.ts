// 楽天レシピAPI の型定義
export interface RakutenRecipe {
  recipeTitle: string;
  foodImageUrl: string;
  recipeUrl: string;
  recipeMaterial: string[];
  recipeIndication: string;
}

export interface RakutenSearchResponse {
  result: RakutenRecipe[];
}
