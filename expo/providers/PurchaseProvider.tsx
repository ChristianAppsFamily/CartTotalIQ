import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import createContextHook from '@nkzw/create-context-hook';

const ADS_REMOVED_KEY = 'ads_removed';

function getRCToken() {
  if (__DEV__ || Platform.OS === 'web') return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

const rcToken = getRCToken();
if (rcToken) {
  Purchases.configure({ apiKey: rcToken });
  console.log('[RC] RevenueCat configured');
}

function usePurchaseContext() {
  const queryClient = useQueryClient();
  const [adsRemoved, setAdsRemoved] = useState(false);

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

  const _entitlementQuery = useQuery({
    queryKey: ['rc_entitlements'],
    queryFn: async () => {
      try {
        const info: CustomerInfo = await Purchases.getCustomerInfo();
        const hasRemoveAds = info.entitlements.active['remove_ads'] !== undefined;
        console.log('[RC] Entitlements checked, remove_ads:', hasRemoveAds);
        if (hasRemoveAds) {
          await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
          setAdsRemoved(true);
        }
        return hasRemoveAds;
      } catch (e) {
        console.log('[RC] Error checking entitlements:', e);
        return false;
      }
    },
    enabled: !!rcToken,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const offeringsQuery = useQuery({
    queryKey: ['rc_offerings'],
    queryFn: async () => {
      try {
        const offerings = await Purchases.getOfferings();
        console.log('[RC] Offerings fetched:', offerings.current?.availablePackages?.length ?? 0);
        return offerings;
      } catch (e) {
        console.log('[RC] Error fetching offerings:', e);
        return null;
      }
    },
    enabled: !!rcToken,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      console.log('[RC] Purchasing package:', pkg.identifier);
      const result = await Purchases.purchasePackage(pkg);
      return result;
    },
    onSuccess: async (result) => {
      const hasRemoveAds = result.customerInfo.entitlements.active['remove_ads'] !== undefined;
      if (hasRemoveAds) {
        await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
        setAdsRemoved(true);
        void queryClient.invalidateQueries({ queryKey: ['ads_removed'] });
        void queryClient.invalidateQueries({ queryKey: ['rc_entitlements'] });
      }
      console.log('[RC] Purchase successful, remove_ads:', hasRemoveAds);
    },
    onError: (error: Error) => {
      console.log('[RC] Purchase error:', error.message);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[RC] Restoring purchases...');
      const info = await Purchases.restorePurchases();
      return info;
    },
    onSuccess: async (info) => {
      const hasRemoveAds = info.entitlements.active['remove_ads'] !== undefined;
      if (hasRemoveAds) {
        await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
        setAdsRemoved(true);
        void queryClient.invalidateQueries({ queryKey: ['ads_removed'] });
        void queryClient.invalidateQueries({ queryKey: ['rc_entitlements'] });
      }
      console.log('[RC] Restore complete, remove_ads:', hasRemoveAds);
    },
    onError: (error: Error) => {
      console.log('[RC] Restore error:', error.message);
    },
  });

  const getRemoveAdsPackage = useCallback((): PurchasesPackage | null => {
    const offerings = offeringsQuery.data;
    if (!offerings?.current?.availablePackages) return null;
    return offerings.current.availablePackages[0] ?? null;
  }, [offeringsQuery.data]);

  return {
    adsRemoved,
    isLoading: adsRemovedQuery.isLoading,
    offerings: offeringsQuery.data,
    offeringsLoading: offeringsQuery.isLoading,
    getRemoveAdsPackage,
    purchaseRemoveAds: purchaseMutation.mutate,
    isPurchasing: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
    restorePurchases: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
    restoreError: restoreMutation.error,
  };
}

export const [PurchaseProvider, usePurchases] = createContextHook(usePurchaseContext);
