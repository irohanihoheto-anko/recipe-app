import { NextRequest, NextResponse } from 'next/server';
import {
  convertTheMealDBToUnified,
  convertSpoonacularToUnified,
  convertEdamamToUnified,
  convertRakutenToUnified,
} from '../../../lib/api-converters';

/**
 * 全てのレシピAPIから同時に検索するエンドポイント
 * クエリパラメータ:
 * - q: 検索キーワード
 * - sources: 使用するAPIソース（カンマ区切り）例: "rakuten,edamam,themealdb,spoonacular"
 * - limit: 各APIから取得する件数（デフォルト: 10）
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const sourcesParam = searchParams.get('sources') || 'rakuten,edamam,themealdb,spoonacular';
  const limit = parseInt(searchParams.get('limit') || '10');

  const sources = sourcesParam.split(',').map(s => s.trim());

  // 各APIのレシピを個別に保存（表示順制御のため）
  const themealdbRecipes: any[] = [];
  const spoonacularRecipes: any[] = [];
  const rakutenRecipes: any[] = [];
  const errors: { source: string; error: string }[] = [];

  // 並列でAPIリクエストを実行
  const promises = [];

  // TheMealDB（最優先）
  if (sources.includes('themealdb')) {
    promises.push(
      fetch(`${request.nextUrl.origin}/api/recipes/themealdb?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.meals) {
            const recipes = data.meals.slice(0, limit).map((meal: any) => convertTheMealDBToUnified(meal));
            themealdbRecipes.push(...recipes);
          }
        })
        .catch(err => {
          console.error('TheMealDB API error:', err);
          errors.push({ source: 'themealdb', error: err.message });
        })
    );
  }

  // Spoonacular（2番目）
  if (sources.includes('spoonacular')) {
    promises.push(
      fetch(`${request.nextUrl.origin}/api/recipes/spoonacular?q=${encodeURIComponent(query)}&number=${limit}`)
        .then(res => res.json())
        .then(data => {
          if (data.results) {
            const recipes = data.results.map((recipe: any) => convertSpoonacularToUnified(recipe));
            spoonacularRecipes.push(...recipes);
          }
        })
        .catch(err => {
          console.error('Spoonacular API error:', err);
          errors.push({ source: 'spoonacular', error: err.message });
        })
    );
  }

  // 楽天レシピ（最後）
  if (sources.includes('rakuten')) {
    promises.push(
      fetch(`${request.nextUrl.origin}/api/recipes/search?keyword=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.result) {
            const recipes = data.result.slice(0, limit).map((r: any) => convertRakutenToUnified(r));
            rakutenRecipes.push(...recipes);
          }
        })
        .catch(err => {
          console.error('Rakuten API error:', err);
          errors.push({ source: 'rakuten', error: err.message });
        })
    );
  }

  // Edamam - 削除（無料APIではない）
  // if (sources.includes('edamam')) {
  //   promises.push(
  //     fetch(`${request.nextUrl.origin}/api/recipes/edamam?q=${encodeURIComponent(query)}&to=${limit}`)
  //       .then(res => res.json())
  //       .then(data => {
  //         if (data.hits) {
  //           const recipes = data.hits.map((hit: any) => convertEdamamToUnified(hit));
  //           results.push(...recipes);
  //         }
  //       })
  //       .catch(err => {
  //         console.error('Edamam API error:', err);
  //         errors.push({ source: 'edamam', error: err.message });
  //       })
  //   );
  // }

  // 全てのAPIリクエストが完了するまで待機
  await Promise.allSettled(promises);

  // 表示順: TheMealDB → Spoonacular → 楽天
  const results = [...themealdbRecipes, ...spoonacularRecipes, ...rakutenRecipes];

  return NextResponse.json({
    recipes: results,
    totalCount: results.length,
    sources: sources,
    errors: errors.length > 0 ? errors : undefined,
  });
}
