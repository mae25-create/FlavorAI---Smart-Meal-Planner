
export enum Screen {
  PREFERENCES = 'PREFERENCES',
  SETTINGS = 'SETTINGS',
  DETECTION = 'DETECTION',
  PLANNER = 'PLANNER',
  DETAILS = 'DETAILS',
  SWAP = 'SWAP',
  GROCERY = 'GROCERY',
  CART = 'CART'
}

export interface GeneratedMeal {
  type: string;
  icon: string;
  time: string;
  title: string;
  prepMins: number;
  ingredients: Array<{ name: string; qty: string }>;
}

export interface PlanSettings {
  days: number;
  activeMeals: string[];
}

export interface DayPlan {
  dayLabel: string;
  shortLabel: string;
  dateNum: string;
  meals: GeneratedMeal[];
}

export interface DetectedItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  confirmed: boolean;
  status: 'fresh' | 'expiring';
  img: string;
}
