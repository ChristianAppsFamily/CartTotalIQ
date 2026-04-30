import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { CartItem, AppSettings } from '@/types/cart';
import { getTaxRateForZip } from '@/constants/taxRates';

const ITEMS_KEY = 'cart_items';
const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  zipCode: '',
  taxRate: 0.07,
  budgetCeiling: null,
  hasCompletedOnboarding: false,
  storeName: '',
};

function useCartContext() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const syncItemsRef = useRef<((newItems: CartItem[]) => void) | null>(null);
  const syncSettingsRef = useRef<((newSettings: AppSettings) => void) | null>(null);

  const itemsQuery = useQuery({
    queryKey: ['cart_items'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ITEMS_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const settingsQuery = useQuery({
    queryKey: ['app_settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as AppSettings) } : DEFAULT_SETTINGS;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (itemsQuery.data) {
      setItems(itemsQuery.data);
    }
  }, [itemsQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const syncItemsMutation = useMutation({
    mutationFn: async (newItems: CartItem[]) => {
      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(newItems));
      return newItems;
    },
    onSuccess: (newItems) => {
      queryClient.setQueryData(['cart_items'], newItems);
    },
  });

  const syncSettingsMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(['app_settings'], newSettings);
    },
  });

  syncItemsRef.current = (newItems: CartItem[]) => syncItemsMutation.mutate(newItems);
  syncSettingsRef.current = (newSettings: AppSettings) => syncSettingsMutation.mutate(newSettings);

  const addItem = useCallback((item: Omit<CartItem, 'id' | 'addedAt'>) => {
    const newItem: CartItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      addedAt: Date.now(),
    };
    setItems(prev => {
      const updated = [newItem, ...prev];
      syncItemsRef.current?.(updated);
      return updated;
    });
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      syncItemsRef.current?.(updated);
      return updated;
    });
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const editItem = useCallback((id: string, updates: Partial<CartItem>) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...updates } : i);
      syncItemsRef.current?.(updated);
      return updated;
    });
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
    syncItemsRef.current?.([]);
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      if (partial.zipCode && partial.zipCode.length === 5) {
        updated.taxRate = getTaxRateForZip(partial.zipCode);
      }
      syncSettingsRef.current?.(updated);
      return updated;
    });
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return subtotal * settings.taxRate;
  }, [subtotal, settings.taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const budgetProgress = useMemo(() => {
    if (!settings.budgetCeiling || settings.budgetCeiling <= 0) return 0;
    return Math.min(total / settings.budgetCeiling, 1.2);
  }, [total, settings.budgetCeiling]);

  const isLoading = itemsQuery.isLoading || settingsQuery.isLoading;

  return useMemo(() => ({
    items,
    settings,
    subtotal,
    taxAmount,
    total,
    budgetProgress,
    isLoading,
    addItem,
    removeItem,
    editItem,
    clearItems,
    updateSettings,
  }), [items, settings, subtotal, taxAmount, total, budgetProgress, isLoading, addItem, removeItem, editItem, clearItems, updateSettings]);
}

export const [CartProvider, useCart] = createContextHook(useCartContext);
