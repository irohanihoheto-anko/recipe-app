import { NextRequest, NextResponse } from 'next/server';
import { categories } from '../../../lib/categories';
import {
  convertTheMealDBToUnified,
  convertSpoonacularToUnified,
  convertEdamamToUnified,
  convertRakutenToUnified,
} from '../../../lib/api-converters';

/**
 * カテゴリ検索用エンドポイント
 * 日本語カテゴリ名から英語キーワードを取得し、全APIで検索
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryName = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perApiLimit = 100; // 各APIから取得する件数（多めに設定）

  // カテゴリ情報を取得
  const category = categories.find(c => c.name === categoryName);

  if (!category) {
    return NextResponse.json({ error: 'Category not found', recipes: [] }, { status: 404 });
  }

  // 各APIのレシピを個別に保存（表示順制御のため）
  const themealdbRecipes: any[] = [];
  const spoonacularRecipes: any[] = [];
  const rakutenRecipes: any[] = [];
  const errors: { source: string; error: string }[] = [];

  // 並列でAPIリクエストを実行
  const promises = [];

  // 英語キーワードを全て使用してバリエーションを増やす
  const englishKeywords = category.englishKeywords;
  const rakutenKeywords = category.rakutenKeywords || [categoryName]; // 楽天用キーワード

  // 各英語キーワードで並列検索（TheMealDB、Spoonacular）
  for (const keyword of englishKeywords) {
    // Edamam（英語） - 削除（無料APIではない）
    // promises.push(
    //   fetch(`${request.nextUrl.origin}/api/recipes/edamam?q=${encodeURIComponent(keyword)}&to=${perApiLimit}`)
    //     .then(res => res.json())
    //     .then(data => {
    //       if (data.hits) {
    //         const recipes = data.hits.map((hit: any) => convertEdamamToUnified(hit));
    //         results.push(...recipes);
    //       }
    //     })
    //     .catch(err => {
    //       console.error(`Edamam API error (${keyword}):`, err);
    //       errors.push({ source: `edamam-${keyword}`, error: err.message });
    //     })
    // );

    // TheMealDB（英語・最優先）
    promises.push(
      fetch(`${request.nextUrl.origin}/api/recipes/themealdb?q=${encodeURIComponent(keyword)}`)
        .then(res => res.json())
        .then(data => {
          if (data.meals) {
            const recipes = data.meals.map((meal: any) => convertTheMealDBToUnified(meal));
            themealdbRecipes.push(...recipes);
          }
        })
        .catch(err => {
          console.error(`TheMealDB API error (${keyword}):`, err);
          errors.push({ source: `themealdb-${keyword}`, error: err.message });
        })
    );

    // Spoonacular（英語・2番目）
    promises.push(
      fetch(`${request.nextUrl.origin}/api/recipes/spoonacular?q=${encodeURIComponent(keyword)}&number=${perApiLimit}`)
        .then(res => res.json())
        .then(data => {
          if (data.results) {
            const recipes = data.results.map((recipe: any) => convertSpoonacularToUnified(recipe));
            spoonacularRecipes.push(...recipes);
          }
        })
        .catch(err => {
          console.error(`Spoonacular API error (${keyword}):`, err);
          errors.push({ source: `spoonacular-${keyword}`, error: err.message });
        })
    );
  }

  // 楽天レシピ（日本語・最後）- 各キーワードで検索
  for (const keyword of rakutenKeywords) {
    promises.push(
      fetch(`${request.nextUrl.origin}/api/recipes/search?keyword=${encodeURIComponent(keyword)}`)
        .then(res => res.json())
        .then(data => {
          if (data.result) {
            const recipes = data.result.map((r: any) => convertRakutenToUnified(r));
            rakutenRecipes.push(...recipes);
          }
        })
        .catch(err => {
          console.error(`Rakuten API error (${keyword}):`, err);
          errors.push({ source: `rakuten-${keyword}`, error: err.message });
        })
    );
  }

  // 全てのAPIリクエストが完了するまで待機
  await Promise.allSettled(promises);

  // 表示順: TheMealDB → Spoonacular → 楽天
  const allRecipes = [...themealdbRecipes, ...spoonacularRecipes, ...rakutenRecipes];

  // 重複を削除（同じIDのレシピ）- 表示順を保持
  const uniqueRecipes = Array.from(
    new Map(allRecipes.map(recipe => [recipe.id, recipe])).values()
  );

  // ページネーション用の設定
  const recipesPerPage = 50;
  const startIndex = (page - 1) * recipesPerPage;
  const endIndex = startIndex + recipesPerPage;
  const paginatedResults = uniqueRecipes.slice(startIndex, endIndex);

  return NextResponse.json({
    recipes: paginatedResults,
    totalCount: uniqueRecipes.length,
    page,
    recipesPerPage,
    hasMore: endIndex < uniqueRecipes.length,
    category: categoryName,
    englishKeywords: englishKeywords,
    errors: errors.length > 0 ? errors : undefined,
  });
}
