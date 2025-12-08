import { useState } from 'react';
import type { EdamamSearchFilters } from '../types/edamam';

interface SearchFiltersProps {
  onFilterChange: (filters: Partial<EdamamSearchFilters>) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Partial<EdamamSearchFilters>>({});

  const handleFilterChange = (key: keyof EdamamSearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof EdamamSearchFilters]
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-8 py-6">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-gray-800 font-bold text-lg hover:text-orange-600 transition"
          >
            <span>🔍</span>
            <span>詳細フィルター</span>
            {activeFilterCount > 0 && (
              <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                {activeFilterCount}
              </span>
            )}
            <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
          </button>
          
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-orange-600 transition"
            >
              クリア
            </button>
          )}
        </div>

        {isOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* 食事タイプ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🍽️ 食事タイプ
              </label>
              <select
                value={filters.mealType || ''}
                onChange={(e) => handleFilterChange('mealType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">すべて</option>
                <option value="breakfast">朝食</option>
                <option value="lunch">昼食</option>
                <option value="dinner">夕食</option>
                <option value="snack">スナック</option>
                <option value="teatime">ティータイム</option>
              </select>
            </div>

            {/* 料理タイプ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🥘 料理タイプ
              </label>
              <select
                value={filters.dishType || ''}
                onChange={(e) => handleFilterChange('dishType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">すべて</option>
                <option value="main course">メインコース</option>
                <option value="side dish">サイドディッシュ</option>
                <option value="soup">スープ</option>
                <option value="salad">サラダ</option>
                <option value="desserts">デザート</option>
                <option value="drinks">ドリンク</option>
                <option value="bread">パン</option>
              </select>
            </div>

            {/* 料理の地域 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌍 料理の地域
              </label>
              <select
                value={filters.cuisineType || ''}
                onChange={(e) => handleFilterChange('cuisineType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">すべて</option>
                <option value="american">アメリカ</option>
                <option value="asian">アジア</option>
                <option value="chinese">中華</option>
                <option value="french">フランス</option>
                <option value="indian">インド</option>
                <option value="italian">イタリア</option>
                <option value="japanese">日本</option>
                <option value="mediterranean">地中海</option>
                <option value="mexican">メキシコ</option>
                <option value="middle eastern">中東</option>
              </select>
            </div>

            {/* ダイエット */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🥗 ダイエット
              </label>
              <select
                value={filters.diet || ''}
                onChange={(e) => handleFilterChange('diet', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">すべて</option>
                <option value="balanced">バランス</option>
                <option value="high-protein">高タンパク</option>
                <option value="low-carb">低炭水化物</option>
                <option value="low-fat">低脂肪</option>
              </select>
            </div>

            {/* 健康ラベル */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💚 健康ラベル
              </label>
              <select
                value={filters.health || ''}
                onChange={(e) => handleFilterChange('health', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">すべて</option>
                <option value="vegan">ビーガン</option>
                <option value="vegetarian">ベジタリアン</option>
                <option value="paleo">パレオ</option>
                <option value="dairy-free">乳製品不使用</option>
                <option value="gluten-free">グルテンフリー</option>
                <option value="wheat-free">小麦不使用</option>
                <option value="egg-free">卵不使用</option>
                <option value="peanut-free">ピーナッツ不使用</option>
                <option value="soy-free">大豆不使用</option>
              </select>
            </div>

            {/* カロリー範囲 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔥 カロリー範囲
              </label>
              <select
                value={filters.calories || ''}
                onChange={(e) => handleFilterChange('calories', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">すべて</option>
                <option value="0-300">0-300 kcal</option>
                <option value="300-500">300-500 kcal</option>
                <option value="500-700">500-700 kcal</option>
                <option value="700-1000">700-1000 kcal</option>
              </select>
            </div>

            {/* 調理時間 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⏱️ 調理時間
              </label>
              <select
                value={filters.time || ''}
                onChange={(e) => handleFilterChange('time', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-300 focus:outline-none"
              >
                <option value="">すべて</option>
                <option value="1-15">15分以内</option>
                <option value="1-30">30分以内</option>
                <option value="1-60">60分以内</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
