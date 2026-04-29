import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

// Dynamically import expo-iap to avoid web issues
let ExpoIap: typeof import('expo-iap') | null = null;

const ADS_REMOVED_KEY = 'ads_removed';
const REMOVE_ADS_PRODUCT_ID = 'remove_ads_399';

interface PurchaseContextType {
  adsRemoved: boolean;
  isLoading: boolean;
  productPrice: string;
  getRemoveAdsPackage: () => { priceString: string } | null;
  purchaseRemoveAds: () => Promise<void>;
  isPurchasing: boolean;
  purchaseError: Error | null;
  restorePurchases: () => Promise<void>;
  isRestoring: boolean;
  restoreError: Error | null;
}

function usePurchaseContext(): PurchaseContextType {
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [productPrice, setProductPrice] = useState('$3.99');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [purchaseError, setPurchaseError] = useState<Error | null>(null);
  const [restoreError, setRestoreError] = useState<Error | null>(null);

  // Initialize IAP and load saved state
  useEffect(() => {
    async function init() {
      try {
        // Load saved ads removed state
        const stored = await AsyncStorage.getItem(ADS_REMOVED_KEY);
        if (stored === 'true') {
          setAdsRemoved(true);
        }

        // Initialize IAP on native platforms
        if (Platform.OS !== 'web') {
          ExpoIap = await import('expo-iap');
          await ExpoIap.initConnection();
          console.log('[IAP] Connected');

          // Load product info
          const products = await ExpoIap.fetchProducts({
            type: 'in-app',
            skus: [REMOVE_ADS_PRODUCT_ID],
          });
          if (products && products.length > 0) {
            const product = products[0];
            // ProductAndroid has displayPrice, ProductIOS has localizedPrice
            const productAny = product as unknown as Record<string, unknown>;
            const price = productAny.displayPrice 
              || productAny.localizedPrice 
              || productAny.price 
              || '$3.99';
            setProductPrice(String(price));
          }

          // Check for existing purchases
          await checkPurchases();
        }
      } catch (error) {
        console.log('[IAP] Init error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    return () => {
      if (ExpoIap) {
        ExpoIap.endConnection();
      }
    };
  }, []);

  // Check for existing purchases
  const checkPurchases = async (): Promise<void> => {
    if (Platform.OS === 'web' || !ExpoIap) return;

    try {
      const purchases = await ExpoIap.getAvailablePurchases();
      const hasRemoveAds = purchases.some(
        (purchase) => purchase.productId === REMOVE_ADS_PRODUCT_ID
      );

      if (hasRemoveAds) {
        await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
        setAdsRemoved(true);
        console.log('[IAP] Found existing purchase');
      }
    } catch (error) {
      console.log('[IAP] Check purchases error:', error);
    }
  };

  // Get Remove Ads package info
  const getRemoveAdsPackage = useCallback(() => {
    return {
      priceString: productPrice,
    };
  }, [productPrice]);

  // Purchase Remove Ads
  const purchaseRemoveAds = useCallback(async () => {
    if (Platform.OS === 'web' || !ExpoIap) {
      setPurchaseError(new Error('In-app purchases not available'));
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const purchaseResult = await ExpoIap.requestPurchase({
        type: 'in-app',
        request: {
          apple: { sku: REMOVE_ADS_PRODUCT_ID },
          google: { skus: [REMOVE_ADS_PRODUCT_ID] },
        },
      });

      if (purchaseResult) {
        const purchases = Array.isArray(purchaseResult) ? purchaseResult : [purchaseResult];
        if (purchases.length > 0) {
          const purchase = purchases[0];
          if (purchase.productId === REMOVE_ADS_PRODUCT_ID) {
            await AsyncStorage.setItem(ADS_REMOVED_KEY, 'true');
            setAdsRemoved(true);
            await ExpoIap.finishTransaction({ purchase, isConsumable: false });
            console.log('[IAP] Purchase successful');
          }
        }
      }
    } catch (error) {
      console.log('[IAP] Purchase error:', error);
      setPurchaseError(error instanceof Error ? error : new Error('Purchase failed'));
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (Platform.OS === 'web' || !ExpoIap) {
      setRestoreError(new Error('In-app purchases not available'));
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      await checkPurchases();
      console.log('[IAP] Restore complete');
    } catch (error) {
      console.log('[IAP] Restore error:', error);
      setRestoreError(error instanceof Error ? error : new Error('Restore failed'));
    } finally {
      setIsRestoring(false);
    }
  }, []);

  return {
    adsRemoved,
    isLoading,
    productPrice,
    getRemoveAdsPackage,
    purchaseRemoveAds,
    isPurchasing,
    purchaseError,
    restorePurchases,
    isRestoring,
    restoreError,
  };
}

export const [PurchaseProvider, usePurchases] = createContextHook(usePurchaseContext);
