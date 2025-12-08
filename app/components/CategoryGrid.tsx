import { categories } from '../lib/categories';

interface CategoryGridProps {
  selectedCategory: string;
  onCategoryClick: (categoryName: string) => void;
}

export default function CategoryGrid({ selectedCategory, onCategoryClick }: CategoryGridProps) {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">カテゴリから選ぶ</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onCategoryClick(category.name)}
            className={`relative overflow-hidden rounded-2xl p-4 text-gray-800 font-bold text-center shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[100px] flex flex-col items-center justify-center gap-2 ${
              selectedCategory === category.name ? 'ring-4 ring-orange-400' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${category.color.split(' ')[1]}, ${category.color.split(' ')[2]})`,
            }}
          >
            <div className="text-3xl">{category.icon}</div>
            <div className="text-xs leading-tight font-bold">{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
