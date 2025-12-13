import { NextRequest, NextResponse } from 'next/server';
import type { TheMealDBSearchResponse } from '../../../types/themealdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // TheMealDB APIは無料で使える
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`TheMealDB API error: ${response.status}`);
    }

    const data: TheMealDBSearchResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('TheMealDB API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes from TheMealDB' },
      { status: 500 }
    );
  }
}
