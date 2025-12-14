import { GoogleGenerativeAI } from '@google/generative-ai';

// APIキーの確認（サーバーサイドでのみ実行されることを想定）
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.warn('⚠️ GOOGLE_API_KEY is not set in environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

// モデルの初期化 (Liteモデルの方が利用枠に余裕がある可能性があるため変更)
export const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * テキスト生成のヘルッパー関数
 * @param prompt - ユーザーからのプロンプト
 * @param systemInstruction - システムへの指示（オプション）
 * @returns 生成されたテキスト
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
        let finalPrompt = prompt;

        // System Instructionがサポートされていない場合や簡略化のためにプロンプトに含める
        if (systemInstruction) {
            finalPrompt = `${systemInstruction}\n\nUser: ${prompt}`;
        }

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini Generate Error:', error);
        throw error;
    }
}

/**
 * JSON生成のヘルッパー関数
 * @param prompt - プロンプト
 * @returns パースされたJSONオブジェクト
 */
export async function generateJSON(prompt: string): Promise<any> {
    try {
        // JSONモードを明示的に指定（モデル設定で responseConf: { responseMimeType: "application/json" } も可能だが、
        // ここではプロンプトエンジニアリングで対応する汎用的な方法をとる）
        const jsonPrompt = `${prompt}\n\nAnswer ONLY in valid JSON format. Do not use Markdown code blocks.`;

        const result = await model.generateContent(jsonPrompt);
        const text = result.response.text();

        // Markdownコードブロック（```json ... ```）が含まれている場合の除去
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error('Gemini JSON Error:', error);
        throw error;
    }
}
