
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedMeal, DetectedItem } from '../types';

interface SwapOption extends GeneratedMeal {
  matchPercent: number;
  badge: string;
  reason: string;
}

interface Props {
  onBack: () => void;
  onConfirm: (meal: GeneratedMeal) => void;
  meal: GeneratedMeal | null;
  ingredients: DetectedItem[];
}

const MEAL_META: Record<string, { icon: string; time: string }> = {
  Breakfast: { icon: 'wb_sunny', time: '08:30 AM' },
  Lunch: { icon: 'lunch_dining', time: '12:45 PM' },
  Dinner: { icon: 'dinner_dining', time: '07:30 PM' },
};

const SwapMealScreen: React.FC<Props> = ({ onBack, onConfirm, meal, ingredients }) => {
  const [options, setOptions] = useState<SwapOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [reason, setReason] = useState('Expiring Ingredients');

  useEffect(() => {
    if (meal) fetchAlternatives(meal);
  }, [meal?.title]);

  const fetchAlternatives = async (current: GeneratedMeal) => {
    setIsLoading(true);
    setOptions([]);
    const apiKey = process.env.API_KEY;
    if (!apiKey) { setIsLoading(false); return; }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const ingredientList = ingredients
        .filter(i => i.confirmed)
        .map(i => `${i.name} (${i.amount}${i.status === 'expiring' ? ' - EXPIRING' : ''})`)
        .join(', ');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [{
            text: `You are a chef suggesting meal swaps. The user wants to swap their ${current.type}: "${current.title}".
Available fridge ingredients: ${ingredientList || 'assorted items'}

Suggest exactly 3 alternative ${current.type} meals that are different from "${current.title}".
Prioritize using expiring ingredients. Vary the cuisine styles.

Return ONLY valid JSON array of 3 objects:
[{
  "title": "Recipe name",
  "prepMins": 15,
  "matchPercent": 95,
  "badge": "BEST FOR EXPIRING",
  "reason": "Short reason why (e.g. Uses expiring tomatoes)",
  "ingredients": [{"name": "...", "qty": "..."}]
}]
matchPercent should be 70-99. badge options: "BEST FOR EXPIRING", "HEALTHY CHOICE", "QUICK & EASY", "CHEF'S PICK".`
          }]
        }],
        config: { responseMimeType: "application/json" }
      });

      const result: any[] = JSON.parse(response.text ?? '[]');
      const mapped: SwapOption[] = result.map(o => ({
        ...o,
        type: current.type,
        icon: MEAL_META[current.type]?.icon ?? 'restaurant',
        time: MEAL_META[current.type]?.time ?? '',
      }));
      setOptions(mapped);
      setSelectedIdx(0);
    } catch (err) {
      console.error('Swap alternatives error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (options.length > 0) onConfirm(options[selectedIdx]);
  };

  const badgeColor = (badge: string) => {
    if (badge.includes('EXPIRING')) return 'bg-primary text-black';
    if (badge.includes('HEALTHY')) return 'bg-emerald-500 text-white';
    if (badge.includes('QUICK')) return 'bg-blue-500 text-white';
    return 'bg-purple-500 text-white';
  };

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <header className="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Swap Meal</h1>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">Why swap today?</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['Expiring Ingredients', 'Running Late', 'Change of Taste'].map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors ${reason === r ? 'bg-primary text-black' : 'bg-white/5 border border-white/10 text-slate-300'}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {r === 'Expiring Ingredients' ? 'inventory_2' : r === 'Running Late' ? 'schedule' : 'restaurant'}
                </span>
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-32 overflow-y-auto custom-scrollbar">

        {/* Current meal */}
        <section className="mt-4 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Current Meal</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 opacity-60">
            <div className="w-12 h-12 rounded-xl bg-emerald-900/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">{meal ? MEAL_META[meal.type]?.icon ?? 'restaurant' : 'restaurant'}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base">{meal?.title ?? 'No meal selected'}</h3>
              <p className="text-sm text-slate-400">{meal?.prepMins} mins · {meal?.type}</p>
            </div>
            <span className="material-symbols-outlined text-slate-400">sync_disabled</span>
          </div>
        </section>

        {/* Alternatives */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Alternatives</h2>
            <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Live AI
            </span>
          </div>

          {isLoading && (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="h-5 w-2/3 bg-emerald-900/40 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-emerald-900/30 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-emerald-900/20 rounded animate-pulse" />
                </div>
              ))}
            </>
          )}

          {!isLoading && options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`relative cursor-pointer active:scale-95 transition-all ${selectedIdx === idx ? 'scale-[1.01]' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className={`absolute -top-3 left-4 z-10 text-[10px] font-black px-2 py-1 rounded-md shadow-lg flex items-center gap-1 ${badgeColor(opt.badge)}`}>
                <span className="material-symbols-outlined text-xs">
                  {opt.badge.includes('EXPIRING') ? 'priority_high' : opt.badge.includes('HEALTHY') ? 'favorite' : opt.badge.includes('QUICK') ? 'bolt' : 'star'}
                </span>
                {opt.badge}
              </div>
              <div className={`rounded-2xl p-4 transition-all ${selectedIdx === idx ? 'bg-white/10 border-2 border-primary shadow-xl shadow-primary/10' : 'bg-white/5 border border-white/10'}`}>
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-emerald-900/30 flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-primary text-xl">{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base leading-tight flex-1 pr-2">{opt.title}</h3>
                      <div className="text-right shrink-0">
                        <span className="text-primary font-black text-base">{opt.matchPercent}%</span>
                        <p className="text-[9px] uppercase font-bold text-primary/70">match</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                        {opt.prepMins} mins
                      </span>
                    </div>
                    <div className={`mt-3 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-2 ${selectedIdx === idx ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      {opt.reason}
                    </div>
                    {/* Key ingredients */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {opt.ingredients.slice(0, 3).map((ing, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-slate-400">
                          {ing.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!isLoading && options.length === 0 && !meal && (
            <div className="text-center py-12 text-slate-500 text-sm">No meal to swap.</div>
          )}
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent z-40">
        <button
          onClick={handleConfirm}
          disabled={options.length === 0 || isLoading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-black font-bold py-4 rounded-xl shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined font-bold">check_circle</span>
          Confirm Swap
        </button>
        <p className="text-center text-[10px] text-slate-500 mt-3 font-medium tracking-wide">
          Selection will update your weekly plan
        </p>
      </div>
    </div>
  );
};

export default SwapMealScreen;
