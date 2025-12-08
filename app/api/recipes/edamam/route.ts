import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'chicken';
  const from = searchParams.get('from') || '0';
  const to = searchParams.get('to') || '20';
  
  // フィルター機能
  const diet = searchParams.get('diet'); // balanced, high-protein, low-carb, low-fat
  const health = searchParams.get('health'); // vegan, vegetarian, paleo, etc.
  const cuisineType = searchParams.get('cuisineType'); // american, asian, british, etc.
  const mealType = searchParams.get('mealType'); // breakfast, lunch, dinner, snack
  const dishType = searchParams.get('dishType'); // main course, side dish, dessert, etc.
  const calories = searchParams.get('calories'); // 例: "100-500"
  const time = searchParams.get('time'); // 例: "1-30"

  const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
  const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY || 
      EDAMAM_APP_ID === 'your_app_id_here' || 
      EDAMAM_APP_KEY === 'your_app_key_here') {
    console.warn('Edamam API credentials not configured');
    return NextResponse.json(
      { 
        error: 'Edamam API credentials not configured. Please sign up at https://developer.edamam.com/',
        hits: [] 
      },
      { status: 200 } // 200で返してフロントエンドでエラーハンドリング
    );
  }

  try {
    // クエリパラメータを構築
    const params = new URLSearchParams({
      type: 'public',
      q: query,
      app_id: EDAMAM_APP_ID,
      app_key: EDAMAM_APP_KEY,
      from,
      to,
    });

    // オプションのフィルターを追加
    if (diet) params.append('diet', diet);
    if (health) params.append('health', health);
    if (cuisineType) params.append('cuisineType', cuisineType);
    if (mealType) params.append('mealType', mealType);
    if (dishType) params.append('dishType', dishType);
    if (calories) params.append('calories', calories);
    if (time) params.append('time', time);

    const url = `https://api.edamam.com/api/recipes/v2?${params.toString()}`;
    console.log('Edamam API URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Edamam API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes from Edamam' },
      { status: 500 }
    );
  }
}
