const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// .env.localからAPIキーを読み込む簡易実装
function getApiKey() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const match = envFile.match(/GOOGLE_API_KEY=(.*)/);
        if (match && match[1]) {
            let key = match[1].trim();
            if (key.startsWith('"') && key.endsWith('"')) {
                key = key.slice(1, -1);
            }
            return key;
        }
    } catch (e) {
        console.error("Error reading .env.local", e.message);
    }
    return process.env.GOOGLE_API_KEY;
}

async function listModels() {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("No GOOGLE_API_KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("Fetching available models...");

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.models) {
            console.log("No models found via API list.");
            return;
        }

        // geminiを含むモデルのみ抽出
        const availableModels = data.models
            .filter(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));

        console.log(`Found ${availableModels.length} candidate models.`);

        // 優先度高そうな順にテスト
        const priorityModels = [
            'gemini-1.5-flash', // 本来のターゲット
            'gemini-2.0-flash', // 最新
            'gemini-2.0-flash-exp', // 実験的
            'gemini-2.5-flash', // さらに最新？
            'gemini-flash-latest',
            'gemini-pro',
            ...availableModels // その他全て
        ];

        // 重複除去
        const uniqueModels = [...new Set(priorityModels)];

        console.log("Starting connectivity test...");

        for (const modelName of uniqueModels) {
            // 利用可能リストになければスキップ（ただし1.5-flashは念の為試す）
            if (!availableModels.includes(modelName) && modelName !== 'gemini-1.5-flash') continue;

            process.stdout.write(`Testing ${modelName}... `);
            try {
                const m = genAI.getGenerativeModel({ model: modelName });
                const result = await m.generateContent("Hello");
                const response = await result.response;
                console.log("✅ OK! (Use this)");
                // 成功したら推奨メッセージを出して終了してもいいが、一通り見る
            } catch (e) {
                let msg = e.message.split('\n')[0];
                if (msg.includes('404')) msg = '404 Not Found';
                if (msg.includes('429')) msg = '429 Quota Exceeded';
                console.log(`❌ ${msg}`);
            }
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

listModels();

