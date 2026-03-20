export interface CartItem {
  id: string;
  name: string;
  category: string;
  emoji: string;
  price: number;
  addedAt: number;
}

export interface AppSettings {
  zipCode: string;
  taxRate: number;
  budgetCeiling: number | null;
  hasCompletedOnboarding: boolean;
  storeName: string;
}

export interface ShoppingTrip {
  id: string;
  storeName: string;
  date: number;
  items: CartItem[];
  taxRate: number;
}

export interface AIResult {
  price: number;
  name: string;
  category: string;
  emoji: string;
}
