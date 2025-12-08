import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { recipeData } = await request.json();
    
    // レシピIDを生成（タイトルベース）
    const recipeId = `recipe-${Buffer.from(recipeData.recipeTitle).toString('base64').slice(0, 50)}`;
    
    // キャッシュをチェック
    const { data: cached } = await supabase
      .from('processed_recipes')
      .select('recipe_data')
      .eq('recipe_id', recipeId)
      .single();
    
    if (cached) {
      console.log('✅ Cache hit! Returning cached recipe:', recipeData.recipeTitle);
      return NextResponse.json(cached.recipe_data);
    }
    
    console.log('⏳ Cache miss. Processing with OpenAI:', recipeData.recipeTitle);
    
    // OpenAIで処理
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはレシピ情報を整理し、栄養情報を推定するアシスタントです。必ず有効なJSONのみを返してください。',
        },
        {
  role: 'user',
  content: `以下のレシピから、詳しくわかりやすい調理手順、材料と金額、カロリー情報を整理してJSON形式で返してください。

レシピ: ${recipeData.recipeTitle}
材料: ${recipeData.recipeMaterial?.join(', ') || '不明'}
作り方の参考情報: ${recipeData.recipeIndication || '不明'}

以下のJSON形式で返してください:

{
  "title": "${recipeData.recipeTitle}",
  "totalTime": 30,
  "totalCalories": 450,
  "protein": 25,
  "fat": 15,
  "carbs": 50,
  "steps": [
    {"stepNumber": 1, "description": "玉ねぎをみじん切りにして、透明になるまで中火で炒める", "timeMinutes": 5},
    {"stepNumber": 2, "description": "ひき肉を加えて、色が変わるまでほぐしながら炒める", "timeMinutes": 10}
  ],
  "ingredients": [
    {"name": "玉ねぎ", "amount": "1個（約200g）", "cost": 50, "calories": 74}
  ],
  "totalCost": 500
}

【重要な指示】
- stepsは料理の複雑さに応じて適切な数にしてください
  - シンプルな料理: 5-7ステップ
  - 一般的な料理: 8-12ステップ
  - 複雑な料理: 13-20ステップ
- 各手順は具体的に書いてください（例：「野菜を切る」ではなく「玉ねぎを薄切りにし、にんじんは短冊切りにする」）
- 下準備、調理、盛り付けまで丁寧に分けてください
- 火加減、調理のコツ、タイミングも含めてください
- 初心者でもわかるように丁寧に説明してください
- totalCaloriesは1人分の総カロリー（kcal）
- protein（タンパク質）、fat（脂質）、carbs（炭水化物）はグラム単位
- 材料の分量も具体的に（「適量」ではなく「大さじ2」など）`,
},
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }
    
    const result = JSON.parse(content);
    
    // stepsが空なら強制的にデフォルト手順を追加
    if (!result.steps || result.steps.length === 0) {
      result.steps = [
        {"stepNumber": 1, "description": "材料を準備する", "timeMinutes": 5},
        {"stepNumber": 2, "description": "調理する", "timeMinutes": 20},
        {"stepNumber": 3, "description": "盛り付けて完成", "timeMinutes": 5}
      ];
    }
    
    // キャッシュに保存
    await supabase
      .from('processed_recipes')
      .insert({
        recipe_id: recipeId,
        recipe_data: result,
      });
    
    console.log('💾 Cached recipe:', recipeData.recipeTitle);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Process API Error:', error);
    return NextResponse.json(
      { error: 'レシピの処理に失敗しました' },
      { status: 500 }
    );
  }
}
