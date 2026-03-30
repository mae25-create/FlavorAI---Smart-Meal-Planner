
import React, { useState } from 'react';
import { PlanSettings } from '../types';

interface Props {
  onNext: () => void;
  onBack: () => void;
  onSettingsChange: (s: PlanSettings) => void;
}

const MealPlanSettingsScreen: React.FC<Props> = ({ onNext, onBack, onSettingsChange }) => {
  const [days, setDays] = useState(5);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const [activeMeals, setActiveMeals] = useState<string[]>(['Breakfast', 'Lunch', 'Dinner']);

  const toggleMealType = (type: string) => {
    setActiveMeals(prev => prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]);
  };

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in fade-in slide-in-from-right duration-300">
      <header className="flex items-center justify-between p-4 pt-6">
        <button onClick={onBack} className="text-white flex items-center justify-center size-10 rounded-full hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight">Meal Plan Settings</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold leading-tight mb-2">Customize your schedule</h2>
          <p className="text-slate-400 text-base">Set your plan duration and daily frequency to generate recipes from your fridge photos.</p>
        </div>

        {/* Number of Days */}
        <div className="bg-emerald-950/20 rounded-xl p-5 mb-4 border border-emerald-900/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
              </div>
              <span className="font-bold text-lg">Number of Days</span>
            </div>
            <span className="text-primary font-bold text-xl">{days}</span>
          </div>
          <div className="relative flex w-full flex-col items-center gap-4">
            <input 
              type="range" 
              min="1" max="7" 
              value={days} 
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full h-1.5 bg-emerald-900/40 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between w-full text-xs font-medium text-emerald-800 uppercase tracking-widest px-1">
              <span>1 Day</span>
              <span>7 Days</span>
            </div>
          </div>
        </div>

        {/* Meals per Day */}
        <div className="bg-emerald-950/20 rounded-xl p-5 mb-6 border border-emerald-900/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary">restaurant</span>
              </div>
              <span className="font-bold text-lg">Meals per Day</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-background-dark rounded-xl p-2 border border-emerald-900/30">
            <button 
              onClick={() => setMealsPerDay(Math.max(1, mealsPerDay - 1))}
              className="size-12 flex items-center justify-center rounded-lg bg-emerald-900/50 text-white shadow-sm hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">{mealsPerDay}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Meals</span>
            </div>
            <button 
              onClick={() => setMealsPerDay(mealsPerDay + 1)}
              className="size-12 flex items-center justify-center rounded-lg bg-primary text-black shadow-sm hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {mealTypes.map(m => {
              const active = activeMeals.includes(m);
              return (
                <button 
                  key={m}
                  onClick={() => toggleMealType(m)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${active ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 text-slate-400 border-transparent'}`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Card */}
        <div className="relative overflow-hidden bg-primary text-black rounded-xl p-6 shadow-xl shadow-primary/10 mb-8">
          <div className="absolute top-0 right-0 opacity-20 transform translate-x-1/4 -translate-y-1/4 scale-150">
            <span className="material-symbols-outlined text-9xl">auto_awesome</span>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] mb-1 opacity-70">Estimated Generation</span>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-black">{days * mealsPerDay}</span>
              <span className="text-xl font-bold">Recipes</span>
            </div>
            <p className="text-sm font-medium leading-tight max-w-[200px] opacity-80">
              Our AI will analyze your fridge photos to curate {days * mealsPerDay} personalized meals.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-emerald-900/30 bg-background-dark pb-8">
        <button 
          onClick={() => { onSettingsChange({ days, activeMeals }); onNext(); }}
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">bolt</span>
          Generate My Plan
        </button>
        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">Powered by Visual AI Engine</p>
      </footer>
    </div>
  );
};

export default MealPlanSettingsScreen;
