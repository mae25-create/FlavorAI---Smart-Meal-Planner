
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { DetectedItem, GeneratedMeal, PlanSettings, DayPlan } from '../types';

interface Props {
  onSelectRecipe: (meal: GeneratedMeal) => void;
  onGoGrocery: () => void;
  onGoScan: () => void;
  onGoProfile: () => void;
  ingredientCount: number;
  ingredients: DetectedItem[];
  planSettings: PlanSettings;
}

const MEAL_META: Record<string, { icon: string; time: string }> = {
  Breakfast: { icon: 'wb_sunny', time: '08:30 AM' },
  Lunch: { icon: 'lunch_dining', time: '12:45 PM' },
  Dinner: { icon: 'dinner_dining', time: '07:30 PM' },
  Snack: { icon: 'cookie', time: '03:00 PM' },
};

const MEAL_EMOJI: Record<string, string> = {
  Breakfast: '🍳',
  Lunch: '🥗',
  Dinner: '🍽️',
  Snack: '🍎',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function buildDayTabs(numDays: number) {
  const today = new Date();
  return Array.from({ length: numDays }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      shortLabel: DAY_NAMES[d.getDay()],
      dayLabel: FULL_DAY_NAMES[d.getDay()],
      dateNum: String(d.getDate()),
    };
  });
}

function buildDemoPlans(dayTabs: ReturnType<typeof buildDayTabs>, activeMeals: string[]): DayPlan[] {
  const demoMeals: Record<string, GeneratedMeal[]> = {
    Breakfast: [
      { type: 'Breakfast', icon: 'wb_sunny', time: '08:30 AM', title: 'Avocado & Egg Power Bowl', prepMins: 12, ingredients: [{ name: 'Avocado', qty: '1/2' }, { name: 'Eggs', qty: '2' }] },
      { type: 'Breakfast', icon: 'wb_sunny', time: '08:30 AM', title: 'Greek Yogurt Parfait', prepMins: 5, ingredients: [{ name: 'Greek Yogurt', qty: '200g' }, { name: 'Granola', qty: '50g' }] },
    ],
    Lunch: [
      { type: 'Lunch', icon: 'lunch_dining', time: '12:45 PM', title: 'Grilled Chicken Quinoa Salad', prepMins: 18, ingredients: [{ name: 'Chicken', qty: '150g' }, { name: 'Quinoa', qty: '1/2 cup' }] },
      { type: 'Lunch', icon: 'lunch_dining', time: '12:45 PM', title: 'Veggie Wrap', prepMins: 10, ingredients: [{ name: 'Tortilla', qty: '1' }, { name: 'Mixed Greens', qty: '1 cup' }] },
    ],
    Dinner: [
      { type: 'Dinner', icon: 'dinner_dining', time: '07:30 PM', title: 'Herb-Crusted Salmon', prepMins: 25, ingredients: [{ name: 'Salmon', qty: '200g' }, { name: 'Lemon', qty: '1/2' }] },
      { type: 'Dinner', icon: 'dinner_dining', time: '07:30 PM', title: 'Pasta Primavera', prepMins: 20, ingredients: [{ name: 'Pasta', qty: '100g' }, { name: 'Vegetables', qty: '1 cup' }] },
    ],
    Snack: [
      { type: 'Snack', icon: 'cookie', time: '03:00 PM', title: 'Hummus & Veggie Sticks', prepMins: 5, ingredients: [{ name: 'Hummus', qty: '100g' }, { name: 'Carrots', qty: '2 pcs' }] },
    ],
  };

  return dayTabs.map((tab, i) => ({
    ...tab,
    meals: activeMeals.map(type => {
      const pool = demoMeals[type] ?? [];
      return pool[i % pool.length] ?? pool[0];
    }).filter(Boolean),
  }));
}

const WeeklyPlannerScreen: React.FC<Props> = ({ onSelectRecipe, onGoGrocery, onGoScan, onGoProfile, ingredientCount, ingredients, planSettings }) => {
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const dayTabs = buildDayTabs(planSettings.days);
  const expiringIngredients = ingredients.filter(i => i.status === 'expiring' && i.confirmed);

  const generateMealPlan = async () => {
    const confirmed = ingredients.filter(i => i.confirmed);
    if (confirmed.length === 0) {
      setDayPlans(buildDemoPlans(dayTabs, planSettings.activeMeals));
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setDayPlans(buildDemoPlans(dayTabs, planSettings.activeMeals));
      setGenerateError('No API key — showing demo meals.');
      setIsGenerating(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const ingredientList = confirmed.map(i => `${i.name} (${i.amount})`).join(', ');
      const mealList = planSettings.activeMeals.join(', ');
      const dayNames = dayTabs.map(d => d.dayLabel).join(', ');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [{
            text: `You are a creative chef. Generate a meal plan for ${planSettings.days} days (${dayNames}).
Available fridge ingredients: ${ingredientList}
Required meal types per day: ${mealList}

Return ONLY a valid JSON array of ${planSettings.days} day objects:
[{
  "dayLabel": "Monday",
  "meals": [
    {"type": "Breakfast", "title": "recipe name", "prepMins": 10, "ingredients": [{"name": "x", "qty": "1"}]},
    ...one object per meal type
  ]
}]

Rules:
- Each day must have exactly ${planSettings.activeMeals.length} meals, one per type: ${mealList}
- Use primarily the available ingredients, be creative, vary recipes across days
- prepMins must be a number`
          }]
        }],
        config: { responseMimeType: "application/json" }
      });

      const result: any[] = JSON.parse(response.text ?? '[]');
      if (!Array.isArray(result) || result.length === 0) throw new Error('Empty response');

      const plans: DayPlan[] = result.map((d: any, i: number) => ({
        dayLabel: d.dayLabel ?? dayTabs[i]?.dayLabel ?? `Day ${i + 1}`,
        shortLabel: dayTabs[i]?.shortLabel ?? d.dayLabel?.slice(0, 3) ?? `D${i + 1}`,
        dateNum: dayTabs[i]?.dateNum ?? '',
        meals: (d.meals ?? []).map((m: any) => ({
          ...m,
          icon: MEAL_META[m.type]?.icon ?? 'restaurant',
          time: MEAL_META[m.type]?.time ?? '',
        })),
      }));

      setDayPlans(plans);
      setActiveDayIdx(0);
    } catch (err: any) {
      console.error('Meal generation error:', err);
      setGenerateError(`AI error: ${err?.message || String(err)}. Tap ↻ to retry.`);
      setDayPlans(buildDemoPlans(dayTabs, planSettings.activeMeals));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateMealPlan();
  }, []);

  const activePlan = dayPlans[activeDayIdx];

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-emerald-900/30">
        <div className="flex items-center p-4 justify-between">
          <div className="flex size-10 items-center justify-center cursor-pointer text-white">
            <span className="material-symbols-outlined">menu</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Weekly Planner</h1>
          <button
            onClick={generateMealPlan}
            disabled={isGenerating}
            className="flex size-10 items-center justify-center cursor-pointer text-primary disabled:opacity-40"
          >
            <span className={`material-symbols-outlined ${isGenerating ? 'animate-spin' : ''}`}>
              {isGenerating ? 'progress_activity' : 'refresh'}
            </span>
          </button>
        </div>

        {/* Day tabs */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-4 gap-3">
          {dayTabs.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDayIdx(i)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-3 rounded-2xl transition-all ${
                i === activeDayIdx
                  ? 'bg-primary text-background-dark shadow-lg shadow-primary/20'
                  : 'bg-emerald-900/20 border border-emerald-900/30'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold ${i === activeDayIdx ? 'opacity-70' : 'text-slate-400'}`}>{d.shortLabel}</span>
              <span className="text-lg font-bold">{d.dateNum}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">

        {/* Error banner */}
        {generateError && (
          <div className="flex items-start gap-3 bg-orange-950/30 border border-orange-500/30 rounded-2xl p-3">
            <span className="material-symbols-outlined text-orange-400 shrink-0 text-sm mt-0.5">info</span>
            <p className="text-xs text-orange-300 leading-relaxed flex-1">{generateError}</p>
            <button onClick={() => setGenerateError(null)} className="text-orange-400/60 hover:text-orange-400 shrink-0">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Expiring Soon */}
        {expiringIngredients.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-orange-400">warning</span>
              <h2 className="text-lg font-bold">Expiring Soon</h2>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4">
              {expiringIngredients.map(item => (
                <div key={item.id} className="min-w-[200px] bg-orange-950/20 border border-orange-500/30 rounded-2xl p-3 flex gap-3 shrink-0 items-center">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-orange-400 text-lg">nutrition</span>
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                    <p className="text-xs text-orange-400 font-medium mt-0.5">{item.amount} · expiring</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loading skeletons */}
        {isGenerating && (
          <>
            {planSettings.activeMeals.map(type => (
              <section key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-md bg-emerald-900/40 animate-pulse" />
                  <div className="w-20 h-5 rounded-md bg-emerald-900/40 animate-pulse" />
                </div>
                <div className="bg-emerald-900/10 rounded-2xl border border-emerald-900/30 p-4 space-y-3">
                  <div className="w-3/4 h-5 rounded-md bg-emerald-900/40 animate-pulse" />
                  <div className="w-1/3 h-4 rounded-md bg-emerald-900/30 animate-pulse" />
                  <div className="border-t border-emerald-900/20 pt-3 grid grid-cols-2 gap-2">
                    {[1, 2].map(i => <div key={i} className="h-3 rounded bg-emerald-900/30 animate-pulse" />)}
                  </div>
                </div>
              </section>
            ))}
          </>
        )}

        {/* Day label */}
        {!isGenerating && activePlan && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
            <h2 className="text-base font-bold text-slate-300">{activePlan.dayLabel} · {planSettings.activeMeals.length} meals</h2>
          </div>
        )}

        {/* Meals for active day */}
        {!isGenerating && activePlan?.meals.map(m => (
          <section key={m.type} onClick={() => onSelectRecipe(m)} className="cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{MEAL_EMOJI[m.type] ?? '🍽️'}</span>
                <h2 className="text-lg font-bold">{m.type}</h2>
              </div>
              <span className="text-xs font-medium text-slate-400">{m.time}</span>
            </div>
            <div className="group bg-emerald-900/10 rounded-2xl border border-emerald-900/30 overflow-hidden shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex gap-4 p-4 items-start">
                <div className="w-14 h-14 rounded-2xl bg-emerald-900/20 border border-emerald-900/20 flex items-center justify-center shrink-0 text-3xl select-none">
                  {MEAL_EMOJI[m.type] ?? '🍽️'}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="font-bold text-white leading-snug">{m.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                    <span className="text-xs text-slate-400">{m.prepMins} min prep</span>
                    <span className="text-xs text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] tracking-wider">AI Suggested</span>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4 pt-1 border-t border-emerald-900/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-xs text-slate-400">inventory_2</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ingredients</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {m.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">{ing.name}</span>
                      <span className="text-xs font-medium text-primary">{ing.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}

        <div className="pb-24" />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background-dark/90 backdrop-blur-xl border-t border-emerald-900/30 px-8 pb-8 pt-4 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center gap-1 text-primary cursor-pointer">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <span className="text-[10px] font-bold">Plan</span>
          </div>
          <div onClick={onGoScan} className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer hover:text-white transition-colors">
            <div className="relative">
              <span className="material-symbols-outlined">photo_camera</span>
              {ingredientCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-background-dark text-[8px] font-bold size-3.5 rounded-full flex items-center justify-center">
                  {ingredientCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Scan</span>
          </div>
          <div onClick={onGoGrocery} className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer hover:text-white transition-colors">
            <span className="material-symbols-outlined">shopping_basket</span>
            <span className="text-[10px] font-medium">Grocery</span>
          </div>
          <div onClick={onGoProfile} className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer hover:text-white transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">Profile</span>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default WeeklyPlannerScreen;
