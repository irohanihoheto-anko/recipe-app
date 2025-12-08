# レシピ検索アプリ 🍳

Next.js + Supabase + Prisma + OpenAI + Edamam APIで作られたレシピ検索・栄養情報表示アプリ

## 🌟 特徴

- **230万件以上のレシピ検索**: Edamam APIで海外レシピも検索可能
- **楽天レシピ統合**: 日本のレシピも豊富
- **AI栄養情報生成**: OpenAI GPT-4o-miniで自動生成
- **カテゴリ検索**: 18種類のカテゴリから選択
- **キーワード検索**: 「カレー」「パスタ」などで検索
- **レスポンシブUI**: スマホでも快適

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成して以下を設定:

```env
# Supabase
DATABASE_URL="your_supabase_database_url"

# 楽天API
RAKUTEN_APP_ID="your_rakuten_app_id"

# OpenAI
OPENAI_API_KEY="your_openai_api_key"

# Edamam API
EDAMAM_APP_ID="your_edamam_app_id"
EDAMAM_APP_KEY="your_edamam_app_key"
```

### 3. Edamam APIキーの取得方法

1. [Edamam Developer](https://developer.edamam.com/)にアクセス
2. 「Sign Up」から無料アカウントを作成
3. ダッシュボードで「Recipe Search API」を選択
4. **Application ID**と**Application Key**をコピー
5. `.env.local`に貼り付け

**無料プラン**: 月10,000リクエストまで無料

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開く

## 📚 使用技術

- **Next.js 16** - App Router
- **React 19** - UI
- **Tailwind CSS 4** - スタイリング
- **Prisma 5** - ORM
- **Supabase** - PostgreSQL Database
- **OpenAI API** - GPT-4o-mini
- **Edamam API** - レシピ検索
- **楽天レシピAPI** - 日本のレシピ

## 🎨 主な機能

### レシピ検索
- 海外レシピ（Edamam）
- 日本のレシピ（楽天）
- 両方から検索

### カテゴリ
人気メニュー、肉料理、魚料理、パスタ、サラダ、お菓子など18カテゴリ

### 栄養情報
- カロリー
- タンパク質
- 脂質
- 炭水化物

### 詳細情報
- 材料リストと推定金額
- 調理手順（5-10ステップ）
- 調理時間

## 📁 プロジェクト構造

```
recipe-app/
├── app/
│   ├── api/
│   │   └── recipes/
│   │       ├── edamam/       # Edamam API
│   │       ├── process/      # OpenAI処理
│   │       └── search/       # 楽天API
│   ├── components/
│   │   └── RecipeSearch.tsx  # メインコンポーネント
│   ├── types/
│   │   └── edamam.ts        # 型定義
│   └── lib/
├── prisma/
│   └── schema.prisma        # DBスキーマ
└── public/
    └── recipes.json         # 楽天レシピデータ
```

## 🔄 今後の予定

- [ ] レシピのお気に入り機能
- [ ] ユーザー認証
- [ ] レシピ投稿機能
- [ ] 買い物リスト生成
- [ ] カロリー計算機能

## 📝 ライセンス

MIT
