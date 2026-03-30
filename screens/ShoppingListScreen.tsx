
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onGoPlan: () => void;
  onGoCart: () => void;
}

const ShoppingListScreen: React.FC<Props> = ({ onBack, onGoPlan, onGoCart }) => {
  const [items, setItems] = useState([
    { id: 1, name: 'Sriracha Sauce', neededFor: 'Spicy Salmon Bowls', amount: '1 bottle', checked: true, category: 'Pantry' },
    { id: 2, name: 'Heavy Cream', neededFor: 'Creamy Garlic Pasta', amount: '500ml', checked: true, category: 'Dairy' },
    { id: 3, name: 'Fresh Thai Basil', neededFor: 'Thai Green Curry', amount: '1 bunch', checked: true, category: 'Produce' },
    { id: 4, name: 'Extra Virgin Olive Oil', neededFor: 'AI unsure if enough is left', amount: '1 unit', checked: false, category: 'Pantry', low: true }
  ]);

  const toggleItem = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in fade-in duration-300">
      {/* iOS Status Bar Simulated */}
      <div className="h-12 w-full flex items-center justify-between px-6 sticky top-0 z-50 bg-background-dark">
        <span className="text-sm font-bold">9:41</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-lg">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-lg">wifi</span>
          <span className="material-symbols-outlined text-lg rotate-90">battery_full</span>
        </div>
      </div>

      <header className="px-4 pb-2">
        <div className="flex items-center justify-between h-14">
          <button onClick={onGoPlan} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Missing Ingredients</h1>
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
        <div className="mt-2 mb-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">AI Scan Results</p>
          <h2 className="text-xl font-bold leading-tight">Weekly Plan: High Protein</h2>
          <p className="text-sm text-[#9db99d] mt-1">Found 8/12 items in your fridge</p>
        </div>
      </header>

      {/* Categories Tab */}
      <nav className="sticky top-[104px] z-40 bg-background-dark/95 backdrop-blur-md border-b border-[#3b543b]">
        <div className="flex overflow-x-auto hide-scrollbar px-4 gap-6">
          <div className="flex flex-col items-center justify-center border-b-2 border-primary py-3 shrink-0 cursor-pointer">
            <p className="text-sm font-bold text-primary">All (4)</p>
          </div>
          {['Pantry', 'Produce', 'Dairy', 'Spices'].map(cat => (
            <div key={cat} className="flex flex-col items-center justify-center border-b-2 border-transparent py-3 shrink-0 text-[#9db99d] cursor-pointer hover:text-white transition-colors">
              <p className="text-sm font-bold">{cat}</p>
            </div>
          ))}
        </div>
      </nav>

      <main className="px-4 pb-48 overflow-y-auto custom-scrollbar">
        <div className="mt-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Missing Staples
            </h3>
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-bold">AUTO-DETECTED</span>
          </div>
          <div className="space-y-3">
            {items.map(item => (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-4 bg-white/5 p-4 rounded-xl border transition-all cursor-pointer ${item.low ? 'border-dashed border-primary/40' : 'border-[#3b543b]/30'}`}
              >
                <div className="flex items-center justify-center">
                  <div className={`h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center ${item.checked ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                    {item.checked && <span className="material-symbols-outlined text-black text-sm font-bold">check</span>}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-base ${item.checked ? 'line-through opacity-50' : 'opacity-100'}`}>{item.name}</p>
                        {item.low && (
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">info</span> Low?
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9db99d] mt-0.5 italic">{item.neededFor}</p>
                    </div>
                    <p className="font-semibold text-sm">{item.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative mt-4">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <span className="material-symbols-outlined">add</span>
          </span>
          <input className="w-full bg-white/5 border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/50 text-white" placeholder="Add custom ingredient..." type="text"/>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background-dark/80 backdrop-blur-xl border-t border-[#3b543b]/50 z-50 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex flex-col">
            <span className="text-xs text-[#9db99d] uppercase font-bold tracking-tighter">Deliver via</span>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-sm">shopping_bag</span>
              <span className="font-bold text-sm">Instacart</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#9db99d] uppercase font-bold tracking-tighter">Estimated Total</span>
            <p className="text-lg font-bold">~$14.20</p>
          </div>
        </div>
        <button onClick={onGoCart} className="w-full bg-primary hover:bg-primary/90 text-[#102210] font-extrabold py-4 rounded-xl shadow-[0_8px_24px_rgba(19,236,19,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95">
          <span className="material-symbols-outlined font-bold">shopping_cart_checkout</span>
          Add {checkedCount} Items to Cart
        </button>
        <div className="w-32 h-1.5 bg-white/20 rounded-full mx-auto mt-6"></div>
      </footer>
    </div>
  );
};

export default ShoppingListScreen;
