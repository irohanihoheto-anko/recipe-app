export default function SearchHeader() {
  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-stone-200/50 py-12 px-8 shadow-sm">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-emerald-600">
          🍳 おいしいレシピを見つけよう
        </h1>
        <p className="text-lg md:text-xl text-stone-500">
          あなたにぴったりの料理が見つかる
        </p>
      </div>
    </div>
  );
}
