import { useState } from 'react';
import type { ProcessedRecipe } from '../types/recipe';
import { getOrCreateSessionId } from '../lib/session';

interface RecipeDetailProps {
  recipe: ProcessedRecipe;
  onBack: () => void;
  hideButtons?: boolean;
}

export default function RecipeDetail({ recipe, onBack, hideButtons = false }: RecipeDetailProps) {
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSave = async () => {
    if (saving || isSaved) return;
    
    setSaving(true);
    
    try {
      const sessionId = getOrCreateSessionId();
      
      const unifiedRecipe = {
        id: recipe.originalRecipeId || `processed-${Date.now()}`,
        title: recipe.title,
        image: recipe.image || '/placeholder-recipe.jpg',
        url: recipe.url || '#',
        source: recipe.source || 'unknown',
        calories: recipe.totalCalories,
        time: recipe.totalTime,
      };
      
      // Supabaseからトークンを取得
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/saved-recipes', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, recipe: unifiedRecipe }),
      });
      
      if (response.ok) {
        setIsSaved(true);
        if (typeof window !== 'undefined') {
          window.alert('⭐ レシピを保存しました！');
        }
      } else if (response.status === 409) {
        setIsSaved(true);
        if (typeof window !== 'undefined') {
          window.alert('ℹ️ このレシピはすでに保存されています');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save failed:', errorData);
        if (typeof window !== 'undefined') {
          window.alert(`保存に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      if (typeof window !== 'undefined') {
        window.alert('保存に失敗しました。ネットワーク接続を確認してください。');
      }
    } finally {
      setSaving(false);
    }
  };

  // 折りたたみ時の簡易表示
  if (!isExpanded) {
    return (
      <div className="max-w-5xl mx-auto px-2 sm:px-4 md:px-8 pb-4">
        <div 
          onClick={() => setIsExpanded(true)}
          className="cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition"
        >
          <div className="bg-linear-to-r from-orange-500 to-red-600 text-white p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{recipe.title}</h3>
                <div className="flex items-center gap-4 text-orange-100 text-sm mt-1">
                  <span>⏱️ {recipe.totalTime}分</span>
                  <span>💰 約{recipe.totalCost}円</span>
                  <span>🔥 {recipe.totalCalories}kcal</span>
                </div>
              </div>
              <button className="text-white text-2xl">▼</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 md:px-8 pb-16">
      {!hideButtons && (
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={handleSave}
            disabled={saving || isSaved}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
              isSaved
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isSaved ? '✓ 保存済み' : saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-orange-500 to-red-600 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-bold mb-2">{recipe.title}</h2>
              <div className="flex items-center gap-6 text-orange-100">
                <span className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <span className="font-semibold">{recipe.totalTime}分</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="font-semibold">約{recipe.totalCost}円</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white hover:text-orange-100 transition text-2xl"
            >
              ▲
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* 栄養情報 */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span> 栄養情報
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-orange-100 to-orange-200 p-6 rounded-2xl text-center">
                <p className="text-sm text-orange-700 font-semibold mb-1">カロリー</p>
                <p className="text-3xl font-bold text-orange-600">{recipe.totalCalories}</p>
                <p className="text-xs text-orange-600">kcal</p>
              </div>
              <div className="bg-linear-to-br from-green-100 to-green-200 p-6 rounded-2xl text-center">
                <p className="text-sm text-green-700 font-semibold mb-1">タンパク質</p>
                <p className="text-3xl font-bold text-green-600">{recipe.protein}</p>
                <p className="text-xs text-green-600">g</p>
              </div>
              <div className="bg-linear-to-br from-yellow-100 to-yellow-200 p-6 rounded-2xl text-center">
                <p className="text-sm text-yellow-700 font-semibold mb-1">脂質</p>
                <p className="text-3xl font-bold text-yellow-600">{recipe.fat}</p>
                <p className="text-xs text-yellow-600">g</p>
              </div>
              <div className="bg-linear-to-br from-blue-100 to-blue-200 p-6 rounded-2xl text-center">
                <p className="text-sm text-blue-700 font-semibold mb-1">炭水化物</p>
                <p className="text-3xl font-bold text-blue-600">{recipe.carbs}</p>
                <p className="text-xs text-blue-600">g</p>
              </div>
            </div>
          </div>

          {/* 材料 */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🛒</span> 材料
            </h3>
            <div className="bg-orange-50 rounded-2xl p-6">
              <ul className="space-y-3">
                {recipe.ingredients?.map((ingredient, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-orange-200 last:border-0"
                  >
                    <span className="text-gray-800 font-medium">
                      {ingredient.name}{' '}
                      <span className="text-gray-500">({ingredient.amount})</span>
                    </span>
                    <span className="text-orange-600 font-bold">
                      ¥{ingredient.cost}{' '}
                      <span className="text-sm text-gray-500">
                        ({ingredient.calories}kcal)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 手順 */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👨‍🍳</span> 作り方
            </h3>
            <div className="space-y-4">
              {recipe.steps?.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex gap-4 bg-linear-to-r from-green-50 to-emerald-50 p-5 rounded-2xl"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-linear-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed">{step.description}</p>
                    {step.timeMinutes && (
                      <p className="text-sm text-green-600 mt-1 font-semibold">
                        ⏱️ 約{step.timeMinutes}分
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
