export interface Category {
  id?: string;
  name: string;
  icon: string;
  color: string;
  englishKeywords: string[];
  rakutenKeywords?: string[];
}

export const categories: Category[] = [
  {
    name: '人気メニュー',
    icon: '🔥',
    color: 'from-orange-400 to-red-500',
    englishKeywords: ['popular', 'trending', 'best'],
    rakutenKeywords: ['人気', '定番']
  },
  {
    name: '定番の肉料理',
    icon: '🍖',
    color: 'from-red-400 to-pink-500',
    englishKeywords: ['meat', 'beef', 'pork', 'chicken', 'steak'],
    rakutenKeywords: ['肉料理', '鶏肉', '豚肉', '牛肉']
  },
  {
    name: '定番の魚料理',
    icon: '🐟',
    color: 'from-blue-400 to-cyan-500',
    englishKeywords: ['fish', 'seafood', 'salmon', 'tuna'],
    rakutenKeywords: ['魚料理', '魚']
  },
  {
    name: '卵料理',
    icon: '🥚',
    color: 'from-yellow-300 to-orange-400',
    englishKeywords: ['egg', 'omelet', 'scramble'],
    rakutenKeywords: ['卵料理', '卵']
  },
  {
    name: 'ご飯もの',
    icon: '🍚',
    color: 'from-amber-100 to-gray-300',
    englishKeywords: ['rice', 'bowl', 'fried rice', 'donburi'],
    rakutenKeywords: ['ご飯もの', '丼']
  },
  {
    name: 'パスタ',
    icon: '🍝',
    color: 'from-yellow-400 to-orange-500',
    englishKeywords: ['pasta', 'spaghetti', 'carbonara'],
    rakutenKeywords: ['パスタ', 'スパゲッティ']
  },
  {
    name: '麺・粉物料理',
    icon: '🍜',
    color: 'from-amber-400 to-yellow-600',
    englishKeywords: ['noodle', 'ramen', 'udon', 'soba'],
    rakutenKeywords: ['麺類', 'うどん', 'そば']
  },
  {
    name: '汁物・スープ',
    icon: '🍲',
    color: 'from-orange-300 to-red-400',
    englishKeywords: ['soup', 'stew', 'miso soup'],
    rakutenKeywords: ['汁物', 'スープ']
  },
  {
    name: '鍋料理',
    icon: '🍯',
    color: 'from-red-500 to-orange-600',
    englishKeywords: ['hot pot', 'nabe', 'stew'],
    rakutenKeywords: ['鍋', '鍋料理']
  },
  {
    name: 'サラダ',
    icon: '🥗',
    color: 'from-green-400 to-emerald-500',
    englishKeywords: ['salad', 'vegetable', 'caesar'],
    rakutenKeywords: ['サラダ']
  },
  {
    name: 'パン',
    icon: '🍞',
    color: 'from-amber-200 to-orange-300',
    englishKeywords: ['bread', 'sandwich', 'toast'],
    rakutenKeywords: ['パン', 'サンドイッチ']
  },
  {
    name: 'お菓子',
    icon: '🍰',
    color: 'from-pink-300 to-purple-400',
    englishKeywords: ['dessert', 'cake', 'cookie', 'sweet'],
    rakutenKeywords: ['お菓子', 'スイーツ']
  },
  {
    name: '簡単料理・時短',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-500',
    englishKeywords: ['quick', 'easy', 'simple'],
    rakutenKeywords: ['簡単', '時短']
  },
  {
    name: '節約料理',
    icon: '💰',
    color: 'from-green-500 to-teal-600',
    englishKeywords: ['budget', 'cheap', 'economy'],
    rakutenKeywords: ['節約', '節約料理']
  },
  {
    name: '健康料理',
    icon: '🥬',
    color: 'from-green-400 to-lime-500',
    englishKeywords: ['healthy', 'diet', 'low carb'],
    rakutenKeywords: ['健康', 'ヘルシー']
  },
  {
    name: '中華料理',
    icon: '🥟',
    color: 'from-red-500 to-yellow-500',
    englishKeywords: ['chinese', 'dumpling', 'fried rice'],
    rakutenKeywords: ['中華', '中華料理']
  },
  {
    name: '韓国料理',
    icon: '🌶️',
    color: 'from-red-600 to-orange-600',
    englishKeywords: ['korean', 'kimchi', 'bibimbap'],
    rakutenKeywords: ['韓国料理', 'キムチ']
  },
  {
    name: 'イタリア料理',
    icon: '🇮🇹',
    color: 'from-green-500 to-red-500',
    englishKeywords: ['italian', 'pasta', 'pizza'],
    rakutenKeywords: ['イタリアン', 'イタリア料理']
  },
];
