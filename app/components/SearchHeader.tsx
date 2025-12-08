interface SearchHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  searchSource: 'rakuten' | 'edamam' | 'both';
  onSearchSourceChange: (source: 'rakuten' | 'edamam' | 'both') => void;
}

export default function SearchHeader({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchSource,
  onSearchSourceChange,
}: SearchHeaderProps) {
  return (
    <div className="bg-linear-to-r from-orange-500 to-red-600 text-white py-16 px-8 shadow-xl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center">
        🍳 おいしいレシピを見つけよう
        </h1>
        <p className="text-xl text-center text-orange-100 mb-8">
        あなたにぴったりの料理が見つかる
        </p>

        {/* 検索バー */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="レシピを検索... (例: カレー、パスタ、サラダ)"
              className="w-full px-6 py-4 pr-32 text-lg rounded-full text-gray-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-300"
            />
            <button
              onClick={onSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-linear-to-r from-orange-500 to-red-600 text-white px-8 py-2 rounded-full font-bold hover:from-orange-600 hover:to-red-700 transition shadow-md"
            >
              検索
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
