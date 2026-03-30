
import React, { useState } from 'react';
import { Screen, DetectedItem, GeneratedMeal, PlanSettings } from './types';
import PreferencesScreen from './screens/PreferencesScreen';
import MealPlanSettingsScreen from './screens/MealPlanSettingsScreen';
import DetectedIngredientsScreen from './screens/DetectedIngredientsScreen';
import WeeklyPlannerScreen from './screens/WeeklyPlannerScreen';
import RecipeDetailsScreen from './screens/RecipeDetailsScreen';
import SwapMealScreen from './screens/SwapMealScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import CartScreen from './screens/CartScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.PREFERENCES);
  const [history, setHistory] = useState<Screen[]>([]);

  const [selectedMeal, setSelectedMeal] = useState<GeneratedMeal | null>(null);
  const [planSettings, setPlanSettings] = useState<PlanSettings>({ days: 5, activeMeals: ['Breakfast', 'Lunch', 'Dinner'] });

  // Global State for Ingredients
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedItem[]>([
    { 
      id: '1', 
      name: 'Fresh Shrimp', 
      amount: '500g', 
      category: 'Proteins', 
      confirmed: true, 
      status: 'fresh', 
      img: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=200' 
    },
    { 
      id: '4', 
      name: 'Lemon', 
      amount: '3 pcs', 
      category: 'Produce', 
      confirmed: true, 
      status: 'expiring', 
      img: 'https://images.unsplash.com/photo-1582722653844-d0fa6814e724?auto=format&fit=crop&q=80&w=200' 
    },
    { 
      id: '6', 
      name: 'Parsley', 
      amount: '1 bunch', 
      category: 'Produce', 
      confirmed: true, 
      status: 'expiring', 
      img: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&q=80&w=200' 
    }
  ]);

  const navigateTo = (screen: Screen) => {
    setHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prevScreen = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentScreen(prevScreen);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.PREFERENCES:
        return <PreferencesScreen onNext={() => navigateTo(Screen.SETTINGS)} onBack={goBack} />;
      case Screen.SETTINGS:
        return <MealPlanSettingsScreen onNext={() => navigateTo(Screen.DETECTION)} onBack={goBack} onSettingsChange={setPlanSettings} />;
      case Screen.DETECTION:
        return (
          <DetectedIngredientsScreen 
            onNext={() => navigateTo(Screen.PLANNER)} 
            onBack={goBack} 
            ingredients={detectedIngredients}
            setIngredients={setDetectedIngredients}
          />
        );
      case Screen.PLANNER:
        return (
          <WeeklyPlannerScreen
            onSelectRecipe={(meal) => { setSelectedMeal(meal); navigateTo(Screen.DETAILS); }}
            onGoGrocery={() => navigateTo(Screen.GROCERY)}
            onGoScan={() => navigateTo(Screen.DETECTION)}
            onGoProfile={() => navigateTo(Screen.PREFERENCES)}
            ingredientCount={detectedIngredients.length}
            ingredients={detectedIngredients}
            planSettings={planSettings}
          />
        );
      case Screen.DETAILS:
        return <RecipeDetailsScreen onBack={goBack} onSwap={() => navigateTo(Screen.SWAP)} meal={selectedMeal} />;
      case Screen.SWAP:
        return <SwapMealScreen
          onBack={goBack}
          onConfirm={(meal) => { setSelectedMeal(meal); navigateTo(Screen.PLANNER); }}
          meal={selectedMeal}
          ingredients={detectedIngredients}
        />;
      case Screen.GROCERY:
        return <ShoppingListScreen onBack={goBack} onGoPlan={() => navigateTo(Screen.PLANNER)} onGoCart={() => navigateTo(Screen.CART)} />;
      case Screen.CART:
        return <CartScreen onBack={goBack} onCheckout={() => navigateTo(Screen.PLANNER)} />;
      default:
        return <PreferencesScreen onNext={() => navigateTo(Screen.SETTINGS)} onBack={goBack} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background-dark text-white relative flex flex-col overflow-x-hidden">
      {renderScreen()}
    </div>
  );
};

export default App;
