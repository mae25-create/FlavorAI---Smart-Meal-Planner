
import React, { useState } from 'react';
import SafeImage from '../components/SafeImage';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const PreferencesScreen: React.FC<Props> = ({ onNext, onBack }) => {
  const [flavors, setFlavors] = useState<string[]>(['Spicy', 'Sweet']);
  const [diets, setDiets] = useState<string[]>(['Keto']);
  const [skill, setSkill] = useState<string>('Intermediate');

  const toggleFlavor = (f: string) => {
    setFlavors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const toggleDiet = (d: string) => {
    setDiets(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in fade-in slide-in-from-right duration-300">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div onClick={onBack} className="text-white flex size-12 shrink-0 items-center justify-start cursor-pointer">
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Preferences</h2>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex gap-6 justify-between">
            <p className="text-slate-300 text-base font-medium leading-normal">Step 3 of 5</p>
            <p className="text-primary text-sm font-bold leading-normal">60%</p>
          </div>
          <div className="rounded-full bg-emerald-900/30 h-2 w-full overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-32 custom-scrollbar">
        <header className="pt-6 pb-4">
          <h1 className="text-white tracking-tight text-3xl font-bold leading-tight">Tell us what you love</h1>
          <p className="text-slate-400 text-base font-normal leading-normal mt-2">Our AI uses these to curate your perfect menu from your fridge photos.</p>
        </header>

        {/* Flavor Profiles */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">restaurant_menu</span>
            <h3 className="text-white text-lg font-bold">Flavor Profiles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Spicy', 'Savory', 'Sweet', 'Tangy', 'Umami', 'Bitter'].map(f => {
              const active = flavors.includes(f);
              return (
                <button 
                  key={f}
                  onClick={() => toggleFlavor(f)}
                  className={`px-4 py-2 rounded-full border-2 transition-all duration-200 ${active ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-slate-800 text-slate-300 font-medium'} text-sm flex items-center gap-1`}
                >
                  {f} {active && <span className="material-symbols-outlined text-sm">check_circle</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dietary Preferences */}
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">eco</span>
            <h3 className="text-white text-lg font-bold">Dietary Needs</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Vegan', 'Keto', 'Gluten-Free', 'Paleo', 'Vegetarian', 'Low-Carb'].map(d => {
              const active = diets.includes(d);
              return (
                <button 
                  key={d}
                  onClick={() => toggleDiet(d)}
                  className={`px-4 py-2 rounded-full border-2 transition-all duration-200 ${active ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-slate-800 text-slate-300 font-medium'} text-sm flex items-center gap-1`}
                >
                  {d} {active && <span className="material-symbols-outlined text-sm">check_circle</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Skill Level */}
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">skillet</span>
            <h3 className="text-white text-lg font-bold">Kitchen Skill Level</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { id: 'Beginner', desc: 'Simple 20-min recipes', img: 'https://picsum.photos/id/42/400/200' },
              { id: 'Intermediate', desc: 'Standard home cooking', img: 'https://picsum.photos/id/163/400/200' },
              { id: 'Pro Chef', desc: 'Technique-heavy & gourmet', img: 'https://picsum.photos/id/493/400/200' }
            ].map(s => {
              const active = skill === s.id;
              return (
                <div 
                  key={s.id}
                  onClick={() => setSkill(s.id)}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer h-24 flex items-center ${active ? 'border-primary bg-primary/5' : 'border-slate-800'}`}
                >
                  <SafeImage alt={s.id} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${active ? 'opacity-60' : 'opacity-40'}`} src={s.img} fallbackIcon="skillet" />
                  <div className={`absolute inset-0 bg-gradient-to-r ${active ? 'from-background-dark/95 to-primary/10' : 'from-background-dark/90 to-transparent'}`}></div>
                  <div className="relative z-10 px-6 flex justify-between items-center w-full">
                    <div>
                      <h4 className="font-bold text-white">{s.id}</h4>
                      <p className="text-xs text-slate-300">{s.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'bg-primary border-primary' : 'border-slate-400'}`}>
                      {active && <span className="material-symbols-outlined text-[16px] text-background-dark font-bold">check</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Allergies */}
        <section className="mt-10 mb-10">
          <h3 className="text-white text-lg font-bold mb-4">Any Allergies?</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input className="w-full pl-12 pr-4 py-3 bg-emerald-900/10 border-2 border-slate-800 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors text-white" placeholder="Peanuts, Shellfish, Soy..." type="text"/>
          </div>
        </section>
      </main>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-12 max-w-md mx-auto">
        <button 
          onClick={onNext}
          className="w-full bg-primary text-background-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform active:scale-95"
        >
          Continue
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default PreferencesScreen;
