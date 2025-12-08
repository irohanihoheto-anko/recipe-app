import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Recipe {
  recipeTitle: string;
  foodImageUrl: string;
  recipeUrl: string;
  recipeMaterial: string[];
  recipeIndication: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || '人気メニュー';

  try {
    const filePath = path.join(process.cwd(), 'public', 'recipes.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const allRecipes = JSON.parse(fileContents);

    const categoryData = allRecipes[category];
    
    if (!categoryData) {
      return NextResponse.json({ result: [] });
    }

    let recipes: Recipe[] = [];
    if (typeof categoryData === 'object' && !Array.isArray(categoryData)) {
      for (const subcategoryRecipes of Object.values(categoryData)) {
        recipes = recipes.concat(subcategoryRecipes as Recipe[]);
      }
    } else {
      recipes = categoryData;
    }

    console.log(`${category}: ${recipes.length} recipes`);
    return NextResponse.json({ result: recipes });
  } catch (error) {
    console.error('Error reading recipes:', error);
    return NextResponse.json({ error: 'レシピの取得に失敗しました' }, { status: 500 });
  }
}