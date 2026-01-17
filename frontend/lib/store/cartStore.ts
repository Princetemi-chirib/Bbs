import { create } from 'zustand';

export interface OrderItem {
  id: number;
  title: string;
  description: string;
  adultPrice: number;
  kidsPrice: number | null;
  category: 'general' | 'recovery';
  beforeImage: string;
  afterImage: string;
  key: string;
  ageGroup: 'adult' | 'kids' | 'fixed';
  displayAge: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: OrderItem[];
  addItem: (item: OrderItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'bbs-cart-storage';

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.key === item.key);
      let newItems;
      if (existingItem) {
        newItems = state.items.map((i) =>
          i.key === item.key
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...state.items, item];
      }
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      }
      return { items: newItems };
    });
  },
  removeItem: (key) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.key !== key);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      }
      return { items: newItems };
    });
  },
  updateQuantity: (key, quantity) => {
    set((state) => {
      const newItems =
        quantity <= 0
          ? state.items.filter((item) => item.key !== key)
          : state.items.map((item) =>
              item.key === key ? { ...item, quantity } : item
            );
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      }
      return { items: newItems };
    });
  },
  clearCart: () => {
    set({ items: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
  getTotal: () => {
    const items = get().items;
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  getItemCount: () => {
    const items = get().items;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const items = JSON.parse(stored) as OrderItem[];
          set({ items });
        } catch (error) {
          console.error('Error loading cart from storage:', error);
        }
      }
    }
  },
  saveToStorage: () => {
    if (typeof window !== 'undefined') {
      const items = get().items;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  },
}));
