import React from 'react';
import SafeImage from '../components/SafeImage';

interface Props {
  onBack: () => void;
  onCheckout: () => void;
}

const CartScreen: React.FC<Props> = ({ onBack, onCheckout }) => {
  const cartItems = [
    { id: 1, name: 'Sriracha Sauce', amount: '1 bottle', price: 4.50, img: 'https://images.unsplash.com/photo-1596647953835-23c2c1a842f1?auto=format&fit=crop&q=80&w=100' },
    { id: 2, name: 'Heavy Cream', amount: '500ml', price: 3.20, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=100' },
    { id: 3, name: 'Fresh Thai Basil', amount: '1 bunch', price: 2.50, img: 'https://images.unsplash.com/photo-1628191010210-a59de33e5941?auto=format&fit=crop&q=80&w=100' },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const deliveryFee = 3.99;
  const total = subtotal + deliveryFee;

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in slide-in-from-right duration-300">
      {/* iOS Status Bar Simulated */}
      <div className="h-12 w-full flex items-center justify-between px-6 sticky top-0 z-50 bg-background-dark">
        <span className="text-sm font-bold">9:41</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-lg">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-lg">wifi</span>
          <span className="material-symbols-outlined text-lg rotate-90">battery_full</span>
        </div>
      </div>

      <header className="px-4 pb-4 sticky top-12 z-40 bg-background-dark/95 backdrop-blur-md border-b border-[#3b543b]">
        <div className="flex items-center justify-between h-14">
          <button onClick={onBack} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Your Cart</h1>
          <button className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors text-primary">
            <span className="material-symbols-outlined">delete_outline</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 bg-emerald-900/20 p-4 rounded-2xl border border-emerald-900/30 mb-6">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Delivery from Instacart</h3>
            <p className="text-xs text-slate-400">Arrives in 45-60 mins</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="font-bold text-lg">Items ({cartItems.length})</h2>
          {cartItems.map(item => (
            <div key={item.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-2xl border border-[#3b543b]/30">
              <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-white/10">
                <SafeImage src={item.img} alt={item.name} className="h-full w-full object-cover" fallbackIcon="shopping_bag" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-white">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{item.amount}</p>
                <p className="font-bold text-primary mt-1">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3 bg-background-dark rounded-full px-2 py-1 border border-[#3b543b]/50">
                <button className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="text-sm font-bold w-4 text-center">1</span>
                <button className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 p-5 rounded-2xl border border-[#3b543b]/30 space-y-3 mb-24">
          <h3 className="font-bold text-base mb-2">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Delivery Fee</span>
            <span className="font-medium">${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Service Fee</span>
            <span className="font-medium">$2.00</span>
          </div>
          <div className="h-px w-full bg-[#3b543b]/50 my-2"></div>
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Total</span>
            <span className="text-primary">${(total + 2).toFixed(2)}</span>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background-dark/90 backdrop-blur-xl border-t border-[#3b543b]/50 z-50 max-w-md mx-auto">
        <button onClick={onCheckout} className="w-full bg-primary hover:bg-primary/90 text-[#102210] font-extrabold py-4 rounded-xl shadow-[0_8px_24px_rgba(19,236,19,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95">
          <span className="material-symbols-outlined font-bold">lock</span>
          Checkout ${(total + 2).toFixed(2)}
        </button>
        <div className="w-32 h-1.5 bg-white/20 rounded-full mx-auto mt-6"></div>
      </footer>
    </div>
  );
};

export default CartScreen;
