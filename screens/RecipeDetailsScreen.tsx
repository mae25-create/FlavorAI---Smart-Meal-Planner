
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedMeal } from '../types';

interface Props {
  onBack: () => void;
  onSwap: () => void;
  meal: GeneratedMeal | null;
}

interface RecipeDetail {
  insight: string;
  nutrition: { protein: string; carbs: string; fat: string; calories: string };
  steps: Array<{ title: string; desc: string; timerSecs: number }>;
  pairings: string[];
}

const StepTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="mt-3 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 w-fit">
      <div className="flex items-center gap-2 px-2">
        <span className={`material-symbols-outlined text-sm ${isActive ? 'text-primary animate-pulse' : 'text-slate-500'}`}>timer</span>
        <span className={`text-sm font-mono font-bold ${timeLeft === 0 ? 'text-red-400' : 'text-white'}`}>{fmt(timeLeft)}</span>
      </div>
      <div className="flex items-center gap-1 border-l border-white/10 pl-2">
        <button
          onClick={() => setIsActive(a => !a)}
          className={`size-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-primary/20 text-primary'}`}
        >
          <span className="material-symbols-outlined text-sm">{isActive ? 'pause' : 'play_arrow'}</span>
        </button>
        <button
          onClick={() => { setIsActive(false); setTimeLeft(seconds); }}
          className="size-8 rounded-lg flex items-center justify-center bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">replay</span>
        </button>
      </div>
    </div>
  );
};

const RecipeDetailsScreen: React.FC<Props> = ({ onBack, onSwap, meal }) => {
  const [cookingMode, setCookingMode] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (meal) {
      setCheckedIngredients(meal.ingredients.map(() => true));
      fetchRecipeDetail(meal);
    }
  }, [meal?.title]);

  const fetchRecipeDetail = async (m: GeneratedMeal) => {
    setIsLoading(true);
    setDetail(null);
    setDetailError(null);
    const apiKey = process.env.API_KEY;
    if (!apiKey) { setDetailError('No API key configured.'); setIsLoading(false); return; }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const ingredientList = m.ingredients.map(i => `${i.name} (${i.qty})`).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [{
            text: `You are a professional chef. Generate detailed recipe info for: "${m.title}" (${m.type}, ${m.prepMins} min prep).
Available ingredients: ${ingredientList}

Return ONLY valid JSON with this exact structure:
{
  "insight": "One sentence about why this recipe works with these ingredients",
  "nutrition": { "protein": "Xg", "carbs": "Xg", "fat": "Xg", "calories": "X kcal" },
  "steps": [
    { "title": "Step title", "desc": "Detailed instructions", "timerSecs": 0 }
  ],
  "pairings": ["pairing1", "pairing2", "pairing3"]
}
Provide 4-5 cooking steps. Use timerSecs > 0 only for steps that need timing (e.g. 120 for 2 min).`
          }]
        }],
        config: { responseMimeType: "application/json" }
      });
      const result: RecipeDetail = JSON.parse(response.text ?? '{}');
      setDetail(result);
    } catch (err: any) {
      console.error('Recipe detail error:', err);
      setDetailError(`${err?.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => prev.map((v, i) => i === idx ? !v : v));
  };

  if (!meal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background-dark">
        <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">restaurant_menu</span>
        <p className="text-slate-400">No recipe selected.</p>
        <button onClick={onBack} className="mt-4 text-primary text-sm underline">Go Back</button>
      </div>
    );
  }

  const nutritionItems = detail ? [
    { label: 'Protein', value: detail.nutrition.protein, color: 'bg-blue-500' },
    { label: 'Carbs', value: detail.nutrition.carbs, color: 'bg-green-500' },
    { label: 'Fat', value: detail.nutrition.fat, color: 'bg-yellow-500' },
    { label: 'Calories', value: detail.nutrition.calories, color: 'bg-red-500' },
  ] : [];

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in fade-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md px-4 py-3 justify-between border-b border-white/10 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <span onClick={onBack} className="material-symbols-outlined cursor-pointer hover:bg-white/10 p-2 rounded-full transition-colors">arrow_back_ios_new</span>
          <h2 className="text-lg font-bold leading-tight tracking-tight">Recipe Details</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSwap} className="p-2 hover:bg-white/10 rounded-full transition-colors text-primary">
            <span className="material-symbols-outlined">sync</span>
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">favorite</span>
          </button>
        </div>
      </div>

      <main className="pt-16 pb-32 overflow-y-auto custom-scrollbar">

        {/* Hero — text only, no image */}
        <div className="px-4 py-6">
          <div className="rounded-2xl bg-emerald-900/20 border border-emerald-900/30 p-6">
            <span className="bg-primary text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded mb-3 inline-block">
              {meal.type} · AI Suggested
            </span>
            <h1 className="text-white text-3xl font-extrabold tracking-tight leading-tight">{meal.title}</h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="material-symbols-outlined text-primary text-sm">schedule</span>
              <span className="text-slate-400 text-sm">{meal.prepMins} min prep</span>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="mx-4 mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              <h3 className="font-bold text-primary text-sm">AI Insight</h3>
            </div>
            {detailError && (
              <button onClick={() => meal && fetchRecipeDetail(meal)} className="text-[10px] font-bold text-primary bg-primary/20 px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">refresh</span>Retry
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="h-4 bg-emerald-900/40 rounded animate-pulse w-3/4" />
          ) : detailError ? (
            <p className="text-xs text-orange-400 leading-relaxed">⚠ {detailError}</p>
          ) : (
            <p className="text-sm leading-relaxed text-slate-300">{detail?.insight}</p>
          )}
        </div>

        {/* Nutrition */}
        <div className="px-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Nutritional Info</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-emerald-900/20 animate-pulse" />)}
            </div>
          ) : detail ? (
            <div className="grid grid-cols-2 gap-3">
              {nutritionItems.map(n => (
                <div key={n.label} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className={`w-2 h-8 rounded-full ${n.color}`} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{n.label}</p>
                    <p className="text-base font-bold text-white">{n.value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Ingredients */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Ingredients</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{meal.ingredients.length} items</span>
          </div>
          <div className="space-y-2">
            {meal.ingredients.map((ing, idx) => (
              <div
                key={idx}
                onClick={() => toggleIngredient(idx)}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${checkedIngredients[idx] ? 'border-primary bg-primary/20' : 'border-slate-600'}`}>
                    {checkedIngredients[idx] && <span className="material-symbols-outlined text-primary text-sm">check</span>}
                  </div>
                  <span className={`text-sm font-medium transition-opacity ${checkedIngredients[idx] ? 'opacity-100' : 'opacity-60'}`}>{ing.name}</span>
                </div>
                <span className="text-slate-500 text-sm font-bold">{ing.qty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cooking Steps */}
        <div className="px-4 mb-8">
          <h2 className="text-xl font-bold mb-4">Cooking Instructions</h2>
          {isLoading ? (
            <div className="space-y-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-900/40 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-emerald-900/40 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-emerald-900/30 rounded animate-pulse w-full" />
                    <div className="h-3 bg-emerald-900/30 rounded animate-pulse w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : detail?.steps ? (
            <div className="space-y-6">
              {detail.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center font-bold shrink-0">{idx + 1}</div>
                    {idx !== detail.steps.length - 1 && <div className="w-px h-full bg-white/10 my-2" />}
                  </div>
                  <div className="pb-4">
                    <h3 className="font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    {step.timerSecs > 0 && <StepTimer seconds={step.timerSecs} />}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Pairings — text only */}
        {detail?.pairings && detail.pairings.length > 0 && (
          <div className="px-4 mb-8">
            <h2 className="text-xl font-bold mb-4">Perfect Pairings</h2>
            <div className="flex flex-wrap gap-2">
              {detail.pairings.map(p => (
                <span key={p} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-slate-300">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Start Cooking button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-10 max-w-md mx-auto">
        <button
          onClick={() => { setCookingMode(true); setTimeout(() => setCookingMode(false), 1500); }}
          className="w-full bg-primary hover:bg-primary/90 text-black h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {cookingMode ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined">play_circle</span>
          )}
          {cookingMode ? 'Loading...' : 'Start Cooking Mode'}
        </button>
      </div>
    </div>
  );
};

export default RecipeDetailsScreen;
