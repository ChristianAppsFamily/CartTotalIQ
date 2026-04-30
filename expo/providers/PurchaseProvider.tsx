import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  finishTransaction,
  fetchProducts,
  getAvailablePurchases,
  initConnection,
  Product,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'expo-iap';
import createContextHook from '@nkzw/create-context-hook';

const ADS_REMOVED_KEY = 'ads_removed';
const REMOVE_ADS_PRODUCT_ID = process.env.EXPO_PUBLIC_REMOVE_ADS_PRODUCT_ID ?? 'com.christianappempire.carttotaliq.removeads';

function usePurchaseContext() {
  const queryClient = useQueryClient();
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);

  const adsRemovedQuery = useQuery({
    queryKey: ['ads_removed'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ADS_REMOVED_KEY);
      return stored === 'true';
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (adsRemovedQuery.data !== undefined) {
      setAdsRemoved(adsRemovedQuery.data);
    }
  }, [adsRemovedQuery.data]);

  const productsQuery = useQuery({
    queryKey: ['iap_products'],
    queryFn: async () => {
      try {
        if (!isStoreReady || Platform.OS === 'web') return [];
        return await fetchProducts({ skus: [REMOVE_ADS_PRODUCT_ID], type: 'in-app' });
      } catch (e) {
        console.log('[IAP] Error fetching products:', e);
        return [];
      }
    },
    enabled: isStoreReady && Platform.OS !== 'web' && !adsRemoved,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const ownershipQuery = useQuery({
    queryKey: ['iap_owned_remove_ads'],
    queryFn: async () => {
      try {
        if (!isStoreReady || Platform.OS === 'web') return false;
        const purchases = await getAvailablePurchases();
        const owned = purchases.some(p => p.productId === REMOVE_ADS_PRODUCT_ID);
        if (owned) {
          await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
          setAdsRemoved(true);
          queryClient.setQueryData(['ads_removed'], true);
        }
        return owned;
      } catch (e) {
        console.log('[IAP] Error checking owned purchases:', e);
        return false;
      }
    },
    enabled: isStoreReady && Platform.OS !== 'web',
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (Platform.OS === 'web') {
        throw new Error('In-app purchases are unavailable on web.');
      }
      await requestPurchase({
        request: {
          ios: { sku: REMOVE_ADS_PRODUCT_ID },
          android: { skus: [REMOVE_ADS_PRODUCT_ID] },
        },
        type: 'in-app',
      });
      return true;
    },
    onError: (error) => {
      console.log('[IAP] Purchase error:', error);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (Platform.OS === 'web') return false;
      await restorePurchases();
      const purchases = await getAvailablePurchases();
      const owned = purchases.some(p => p.productId === REMOVE_ADS_PRODUCT_ID);
      if (owned) {
        await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
        setAdsRemoved(true);
        queryClient.setQueryData(['ads_removed'], true);
      }
      return owned;
    },
    onSuccess: (hasRemoveAds) => {
      console.log('[IAP] Restore complete, remove_ads:', hasRemoveAds);
    },
    onError: (error) => {
      console.log('[IAP] Restore error:', error);
    },
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const setup = async () => {
      try {
        await initConnection();
        setIsStoreReady(true);
      } catch (err) {
        console.log('[IAP] initConnection error:', err);
      }
    };

    void setup();

    const purchaseUpdateSub = purchaseUpdatedListener(async (purchase) => {
      try {
        if (purchase.productId === REMOVE_ADS_PRODUCT_ID) {
          await finishTransaction({ purchase, isConsumable: false });
          await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
          setAdsRemoved(true);
          queryClient.setQueryData(['ads_removed'], true);
        }
      } catch (err) {
        console.log('[IAP] finishTransaction error:', err);
      }
    });
    const purchaseErrorSub = purchaseErrorListener((error) => {
      console.log('[IAP] purchaseErrorListener:', error);
    });

    return () => {
      purchaseUpdateSub.remove();
      purchaseErrorSub.remove();
    };
  }, [queryClient]);

  const getRemoveAdsPackage = useCallback((): Product | null => {
    if (!productsQuery.data?.length) return null;
    return productsQuery.data[0] as Product;
  }, [productsQuery.data]);

  return {
    adsRemoved,
    isLoading: adsRemovedQuery.isLoading,
    offerings: productsQuery.data,
    offeringsLoading: productsQuery.isLoading || ownershipQuery.isLoading,
    getRemoveAdsPackage,
    purchaseRemoveAds: () => purchaseMutation.mutate(),
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
    restorePurchases: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,
  };
}

export const [PurchaseProvider, usePurchases] = createContextHook(usePurchaseContext);
