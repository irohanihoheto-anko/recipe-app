export interface Category {
  name: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  { name: '人気メニュー', icon: '🔥', color: 'from-orange-400 to-red-500' },
  { name: '定番の肉料理', icon: '🍖', color: 'from-red-400 to-pink-500' },
  { name: '定番の魚料理', icon: '🐟', color: 'from-blue-400 to-cyan-500' },
  { name: '卵料理', icon: '🥚', color: 'from-yellow-300 to-orange-400' },
  { name: 'ご飯もの', icon: '🍚', color: 'from-amber-100 to-gray-300' },
  { name: 'パスタ', icon: '🍝', color: 'from-yellow-400 to-orange-500' },
  { name: '麺・粉物料理', icon: '🍜', color: 'from-amber-400 to-yellow-600' },
  { name: '汁物・スープ', icon: '🍲', color: 'from-orange-300 to-red-400' },
  { name: '鍋料理', icon: '🍯', color: 'from-red-500 to-orange-600' },
  { name: 'サラダ', icon: '🥗', color: 'from-green-400 to-emerald-500' },
  { name: 'パン', icon: '🍞', color: 'from-amber-200 to-orange-300' },
  { name: 'お菓子', icon: '🍰', color: 'from-pink-300 to-purple-400' },
  { name: '簡単料理・時短', icon: '⚡', color: 'from-yellow-400 to-orange-500' },
  { name: '節約料理', icon: '💰', color: 'from-green-500 to-teal-600' },
  { name: '健康料理', icon: '🥬', color: 'from-green-400 to-lime-500' },
  { name: '中華料理', icon: '🥟', color: 'from-red-500 to-yellow-500' },
  { name: '韓国料理', icon: '🌶️', color: 'from-red-600 to-orange-600' },
  { name: 'イタリア料理', icon: '🇮🇹', color: 'from-green-500 to-red-500' },
];
