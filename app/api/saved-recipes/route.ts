import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// レシピを保存
export async function POST(request: NextRequest) {
  try {
    const { sessionId, recipe } = await request.json();
    
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // service_role keyを使ってSupabaseクライアントを作成（RLSをバイパス）
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 現在のユーザーを取得
    const { data: { user } } = await supabase.auth.getUser();
    
    const userId = user?.id || null;

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 重複チェック
    let existingQuery = supabase
      .from('saved_recipes')
      .select('id')
      .eq('recipe_id', recipe.id);
    
    if (userId) {
      existingQuery = existingQuery.eq('user_id', userId);
    } else if (sessionId) {
      existingQuery = existingQuery.eq('session_id', sessionId);
    }
    
    const { data: existing } = await existingQuery.single();

    if (existing) {
      return NextResponse.json({ error: 'Recipe already saved' }, { status: 409 });
    }

    // レシピを保存
    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: userId,
        session_id: sessionId,
        recipe_id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        url: recipe.url,
        source: recipe.source,
        calories: recipe.calories,
        time: recipe.time,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Save recipe error:', error);
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
  }
}

// 保存したレシピ一覧を取得
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // user_idまたはsession_idで検索
    let query = supabase
      .from('saved_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ savedRecipes: data || [] });
  } catch (error) {
    console.error('Get saved recipes error:', error);
    return NextResponse.json({ error: 'Failed to get saved recipes' }, { status: 500 });
  }
}

// レシピを削除
export async function DELETE(request: NextRequest) {
  try {
    const { sessionId, recipeId } = await request.json();
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID required' }, { status: 400 });
    }

    let query = supabase
      .from('saved_recipes')
      .delete()
      .eq('recipe_id', recipeId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
