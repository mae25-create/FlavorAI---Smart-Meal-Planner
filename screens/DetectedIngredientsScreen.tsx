
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedItem } from '../types';

interface Props {
  onNext: () => void;
  onBack: () => void;
  ingredients: DetectedItem[];
  setIngredients: (items: DetectedItem[]) => void;
}

const DEMO_INGREDIENTS: DetectedItem[] = [
  { id: 'demo-1', name: 'Eggs', amount: '6 pcs', category: 'Proteins', confirmed: true, status: 'fresh', img: '' },
  { id: 'demo-2', name: 'Broccoli', amount: '1 head', category: 'Vegetables', confirmed: true, status: 'expiring', img: '' },
  { id: 'demo-3', name: 'Cherry Tomatoes', amount: '1 cup', category: 'Vegetables', confirmed: true, status: 'fresh', img: '' },
  { id: 'demo-4', name: 'White Bread', amount: '1 loaf', category: 'Pantry', confirmed: true, status: 'fresh', img: '' },
  { id: 'demo-5', name: 'Butter', amount: '200g', category: 'Dairy', confirmed: true, status: 'fresh', img: '' },
  { id: 'demo-6', name: 'Salsa Verde', amount: '1 jar', category: 'Pantry', confirmed: true, status: 'fresh', img: '' },
  { id: 'demo-7', name: 'Greek Yogurt', amount: '500g', category: 'Dairy', confirmed: true, status: 'expiring', img: '' },
  { id: 'demo-8', name: 'Organic Milk', amount: '1 carton', category: 'Dairy', confirmed: true, status: 'fresh', img: '' },
  { id: 'demo-9', name: 'Cucumber', amount: '1 pc', category: 'Vegetables', confirmed: true, status: 'fresh', img: '' },
  { id: 'demo-10', name: 'Cheddar Cheese', amount: '150g', category: 'Dairy', confirmed: true, status: 'fresh', img: '' },
];

const DetectedIngredientsScreen: React.FC<Props> = ({ onNext, onBack, ingredients, setIngredients }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(ingredients.length > 0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'fresh' | 'expiring'>('All');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const loadDemoIngredients = () => {
    setIngredients(DEMO_INGREDIENTS);
    setHasScanned(true);
    setIsDemoMode(true);
    setScanError(null);
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setHasScanned(false);
    setScanError(null);
    setIsDemoMode(false);
    setIngredients([]);

    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      // Simulate scanning delay then load demo data
      setTimeout(() => {
        loadDemoIngredients();
        setIsScanning(false);
        setScanError('No Gemini API key found — showing demo results. Add GEMINI_API_KEY to .env to enable real AI analysis.');
      }, 2000);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: "Identify all the food ingredients visible in this fridge or kitchen scene. For each item, provide: name, an estimated amount (e.g., '1 bag', '500g', 'half full'), a category (one of: Proteins, Vegetables, Dairy, Pantry, Fruits, or Others), and a status (either 'fresh' or 'expiring' based on visual cues like wilted leaves or proximity to use-by dates if visible). Return the data in a clean JSON format.",
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING },
                category: { type: Type.STRING },
                status: { type: Type.STRING },
              },
              required: ["name", "amount", "category", "status"],
            },
          },
        },
      });

      const rawText = response.text ?? '[]';
      const result: any[] = JSON.parse(rawText);

      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('No ingredients detected in the image.');
      }

      const mappedIngredients: DetectedItem[] = result.map((item: any, index: number) => ({
        id: `detected-${Date.now()}-${index}`,
        name: item.name,
        amount: item.amount,
        category: item.category,
        confirmed: true,
        status: item.status === 'expiring' ? 'expiring' : 'fresh',
        img: '',
      }));

      setIngredients(mappedIngredients);
      setHasScanned(true);
    } catch (error: any) {
      console.error("Vision Analysis Error:", error);
      const message = error?.message?.includes('API_KEY')
        ? 'Invalid API key. Please check your GEMINI_API_KEY in .env'
        : (error?.message || 'Analysis failed. Showing demo results.');
      setScanError(message);
      loadDemoIngredients();
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setPreviewImage(URL.createObjectURL(file));
      analyzeImage(base64, file.type);
    }
  };

  const toggleConfirm = (id: string) => {
    setIngredients(ingredients.map(item => item.id === id ? { ...item, confirmed: !item.confirmed } : item));
  };

  const allConfirmed = ingredients.length > 0 && ingredients.every(i => i.confirmed);
  const toggleAll = () => {
    setIngredients(ingredients.map(item => ({ ...item, confirmed: !allConfirmed })));
  };

  const categories = ['All', ...Array.from(new Set(ingredients.map(i => i.category)))];
  
  const filteredIngredients = ingredients.filter(i => {
    const categoryMatch = selectedCategory === 'All' || i.category === selectedCategory;
    const statusMatch = statusFilter === 'All' || i.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  const groupedIngredients = filteredIngredients.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, DetectedItem[]>);

  return (
    <div className="flex-1 flex flex-col bg-background-dark animate-in zoom-in duration-500">
      <header className="sticky top-0 z-50 glass-overlay border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <h1 className="text-lg font-bold tracking-tight">AI Vision Analysis</h1>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">photo_camera</span>
          <span className="text-sm font-semibold">{hasScanned || ingredients.length > 0 ? 'Take' : 'Scan'}</span>
        </button>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
      </header>

      <main className="pb-32">
        {/* Initial Hero Area */}
        {!hasScanned && !previewImage && ingredients.length === 0 && (
          <section className="px-4 pt-4">
            <div 
              onClick={() => !isScanning && fileInputRef.current?.click()}
              className={`relative w-full aspect-[4/5] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isScanning ? 'border-primary bg-primary/5' : 'border-emerald-900/40 bg-emerald-950/10 hover:border-primary/50'}`}
            >
               {isScanning ? (
                <>
                  <div className="absolute inset-0 overflow-hidden rounded-3xl">
                     <div className="absolute inset-x-0 scan-line z-10"></div>
                     <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                  </div>
                  <div className="relative z-20 flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-6xl text-primary animate-bounce">auto_awesome</span>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-white mb-1">AI Processing...</h2>
                      <p className="text-slate-400 text-sm">Analyzing visual contents</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-4xl text-primary">add_a_photo</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Upload Photos</h2>
                  <p className="text-slate-400 text-sm text-center max-w-[250px]">Capture your ingredients to unlock personalized recipe suggestions</p>
                </>
              )}
            </div>
          </section>
        )}

        {/* Results Area */}
        {(hasScanned || ingredients.length > 0 || previewImage) && (
          <>
            <section className="px-4 pt-4">
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl bg-zinc-800">
                {previewImage ? (
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url('${previewImage}')` }}
                  ></div>
                ) : (
                   <div 
                    onClick={() => !isScanning && fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 cursor-pointer hover:bg-zinc-900 transition-colors border-2 border-dashed border-white/10 rounded-2xl m-4"
                   >
                     <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                       <span className="material-symbols-outlined text-primary">add_a_photo</span>
                     </div>
                     <span className="text-sm font-bold text-white">Upload Photos</span>
                     <p className="text-[10px] text-slate-500 mt-1">Capture your fridge contents</p>
                   </div>
                )}
                
                {isScanning && (
                   <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm">
                      <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
                        <span className="text-sm font-bold mt-2">Updating...</span>
                      </div>
                   </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
                {!isScanning && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{ingredients.length} items identified</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Error / Demo mode banner */}
            {scanError && (
              <div className="mx-4 mt-4 flex items-start gap-3 bg-orange-950/30 border border-orange-500/30 rounded-2xl p-3">
                <span className="material-symbols-outlined text-orange-400 shrink-0 mt-0.5">info</span>
                <div className="flex-1">
                  <p className="text-xs text-orange-300 leading-relaxed">{scanError}</p>
                  {isDemoMode && (
                    <p className="text-[10px] text-orange-400/70 mt-1 font-bold uppercase tracking-wider">Showing Demo Results</p>
                  )}
                </div>
                <button onClick={() => setScanError(null)} className="text-orange-400/60 hover:text-orange-400 transition-colors shrink-0">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {isDemoMode && !scanError && (
              <div className="mx-4 mt-4 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                <span className="text-xs text-primary font-bold">Demo Mode — Add GEMINI_API_KEY to .env for real AI analysis</span>
              </div>
            )}

            <section className="mt-6 px-4 space-y-4">
              <div className="overflow-x-auto hide-scrollbar">
                <div className="flex gap-3 pb-1">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-2 h-9 px-4 rounded-full font-bold whitespace-nowrap transition-all text-xs ${selectedCategory === cat ? 'bg-primary text-black' : 'bg-white/5 border border-white/10 text-white'}`}
                    >
                      {cat === 'All' && <span className="material-symbols-outlined text-[16px]">grid_view</span>}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Filter:</span>
                  <div className="flex gap-2">
                    {['All', 'fresh', 'expiring'].map(opt => (
                      <button 
                        key={opt}
                        onClick={() => setStatusFilter(opt as any)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${statusFilter === opt ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 text-slate-400'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={toggleAll}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
                >
                  {allConfirmed ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </section>

            <section className="mt-6 px-4 space-y-8">
              {Object.entries(groupedIngredients).length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-4 border-2 border-dashed border-white/5 rounded-3xl">
                  <span className="material-symbols-outlined text-4xl text-slate-700">search_off</span>
                  <p className="text-slate-500 font-bold">No ingredients found for this filter.</p>
                  <button onClick={() => { setSelectedCategory('All'); setStatusFilter('All'); }} className="text-primary text-sm font-bold underline">Reset Filters</button>
                </div>
              ) : (
                Object.entries(groupedIngredients).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                      <div className="w-1 h-3 bg-primary rounded-full"></div>
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {(items as DetectedItem[]).map(item => (
                        <div
                          key={item.id}
                          onClick={() => toggleConfirm(item.id)}
                          className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-all cursor-pointer relative overflow-hidden ${item.confirmed ? 'bg-white/[0.03] border-emerald-900/30' : 'bg-red-950/20 border-red-500/30 opacity-75'}`}
                        >
                          {!item.confirmed && (
                            <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-bold transition-all truncate ${item.confirmed ? 'text-white' : 'text-slate-400 line-through decoration-red-500/50'}`}>{item.name}</h4>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${item.confirmed ? (item.status === 'expiring' ? 'bg-orange-400/10 text-orange-400' : 'bg-primary/10 text-primary') : 'bg-slate-800 text-slate-500'}`}>
                                {item.confirmed ? item.status : 'Excluded'}
                              </span>
                            </div>
                            <p className={`text-xs mt-0.5 transition-all ${item.confirmed ? 'text-slate-400' : 'text-slate-500 line-through decoration-red-500/30'}`}>{item.amount}</p>
                          </div>

                          <button className={`size-8 rounded-lg flex items-center justify-center transition-all z-10 shrink-0 ${item.confirmed ? 'bg-primary/20 text-primary' : 'bg-red-500/10 text-red-400'}`}>
                            <span className="material-symbols-outlined text-sm fill-1">
                              {item.confirmed ? 'check_box' : 'disabled_by_default'}
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              
              <button className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-emerald-900/30 rounded-2xl text-slate-500 hover:text-slate-300 hover:border-primary/40 transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="font-bold text-sm">Add Missing Item</span>
              </button>
            </section>
          </>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 p-4 pb-8 bg-gradient-to-t from-background-dark via-background-dark to-transparent max-w-md mx-auto z-40">
        <button 
          onClick={onNext}
          disabled={ingredients.filter(i => i.confirmed).length === 0}
          className={`w-full h-14 rounded-2xl flex items-center justify-between px-6 transition-all ${ingredients.filter(i => i.confirmed).length === 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-primary text-black shadow-[0_0_30px_rgba(19,236,19,0.3)] hover:scale-[1.02] active:scale-[0.98]'}`}
        >
          <span className="font-extrabold text-lg">Generate Meal Plan</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold opacity-70">
              {ingredients.filter(i => i.confirmed).length} Ready
            </span>
            <span className="material-symbols-outlined font-bold">arrow_forward</span>
          </div>
        </button>
        <p className="text-center text-[11px] text-slate-500 mt-3 font-medium">Real-time Vision Analysis Powered by Gemini</p>
      </div>
    </div>
  );
};

export default DetectedIngredientsScreen;
