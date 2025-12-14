import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'pasta';
  const number = searchParams.get('number') || '20';
  const offset = searchParams.get('offset') || '0';

  // フィルター
  const cuisine = searchParams.get('cuisine'); // italian, mexican, japanese, etc.
  const diet = searchParams.get('diet'); // vegetarian, vegan, paleo, etc.
  const intolerances = searchParams.get('intolerances'); // gluten, dairy, etc.
  const type = searchParams.get('type'); // main course, dessert, etc.
  const maxReadyTime = searchParams.get('maxReadyTime'); // in minutes
  const minCalories = searchParams.get('minCalories');
  const maxCalories = searchParams.get('maxCalories');

  const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

  if (!SPOONACULAR_API_KEY || SPOONACULAR_API_KEY === 'your_api_key_here') {
    console.warn('Spoonacular API key not configured');
    return NextResponse.json(
      {
        error: 'Spoonacular API key not configured. Please sign up at https://spoonacular.com/food-api',
        results: [],
        totalResults: 0
      },
      { status: 200 }
    );
  }

  try {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      query,
      number,
      offset,
      addRecipeInformation: 'true',
      fillIngredients: 'true',
    });

    // オプションのフィルターを追加
    if (cuisine) params.append('cuisine', cuisine);
    if (diet) params.append('diet', diet);
    if (intolerances) params.append('intolerances', intolerances);
    if (type) params.append('type', type);
    if (maxReadyTime) params.append('maxReadyTime', maxReadyTime);
    if (minCalories) params.append('minCalories', minCalories);
    if (maxCalories) params.append('maxCalories', maxCalories);

    const url = `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`;
    console.log('Spoonacular API URL:', url.replace(SPOONACULAR_API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 402) {
        return NextResponse.json(
          {
            error: 'Spoonacular API quota exceeded. Please upgrade your plan.',
            results: [],
            totalResults: 0
          },
          { status: 200 }
        );
      }
      throw new Error(`Spoonacular API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Spoonacular API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes from Spoonacular', results: [], totalResults: 0 },
      { status: 500 }
    );
  }
}
