
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '../../lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const { messages, recipe } = await request.json();

        if (!messages || !recipe) {
            return NextResponse.json(
                { error: 'Messages and recipe data are required' },
                { status: 400 }
            );
        }

        // レシピ情報をコンテキストとして整形（System Prompt）
        const systemPrompt = `あなたはプロの料理アシスタントですが、普段の会話も楽しめるフレンドリーなパートナーです。
基本的にはユーザーと一緒に以下のレシピを作っていますが、料理以外の話題（天気、ニュース、雑談など）を振られた場合は、快くその話題に乗ってください。

【レシピ情報】
タイトル: ${recipe.title}
時間: ${recipe.time || '不明'}分
カロリー: ${recipe.calories || '不明'}kcal
材料: ${(recipe.ingredients || []).map((i: any) => `${i.name} (${i.amount})`).join(', ')}

手順:
${(recipe.steps || []).map((s: any) => `${s.stepNumber}. ${s.description}`).join('\n')}

【振る舞いの指示】
- 明るく、親しみやすく、かつ的確にアドバイスしてください。
- 音声で読み上げられることを想定して、長すぎない、聞き取りやすい話し言葉で答えてください。
- **ユーザーが「スタート」や「こんにちは」と話しかけた場合のみ、「わからないことがあればお尋ねください。」と答えてください。**
- **それ以外の具体的な質問（例：「材料は？」「手順を教えて」など）が来た場合は、挨拶を省略してすぐにその質問に答えてください。**
- ユーザーから「天気は？」などの料理に関係ない質問をされた場合も、一般的な知識の範囲で答えてください。（例：リアルタイムな天気はわからない場合は「正確な今の天気はわかりませんが、窓の外はいかがですか？」などと機転を利かせて会話を続けてください）`;

        // 最後のユーザーメッセージを取得
        const lastUserMessage = messages[messages.length - 1];
        const userPrompt = lastUserMessage.role === 'user' ? lastUserMessage.content : 'こんにちは'; // 会話の継続の場合は履歴も含めるべきだが、簡易版として最新を使用

        // Geminiで応答生成 (会話履歴の管理は簡易的に最新プロンプト+システムプロンプトで行う)
        // 必要ならmessages全体を連結して渡すことも可能
        const conversationHistory = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content} `).join('\n');
        const finalPrompt = `${conversationHistory} \nUser: ${lastUserMessage.content} `; // 少し重複するがコンテキストとして

        const aiResponseText = await generateText(lastUserMessage.content, systemPrompt);

        // 音声合成はクライアント側（ブラウザ標準機能）で行うため、テキストのみ返す
        return NextResponse.json({
            role: 'assistant',
            content: aiResponseText,
            // audio: null // クライアント側でTTSを実行する
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);

        const status = error.status || 500;
        return NextResponse.json(
            {
                error: 'Chat processing failed',
                message: error.message || String(error),
                code: error.code || 'unknown_error'
            },
            { status }
        );
    }
}
