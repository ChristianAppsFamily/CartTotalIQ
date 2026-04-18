import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Plus, ShoppingBag, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import TotalHeader from '@/components/TotalHeader';
import BudgetBar from '@/components/BudgetBar';
import CartItemCard from '@/components/CartItemCard';
import { BannerAd, BannerAdSize } from '@/utils/ads';

const BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3002325591150738/8472312000',
  android: 'ca-app-pub-3002325591150738/8472312000',
  default: 'ca-app-pub-3002325591150738/8472312000',
});

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    settings,
    subtotal,
    taxAmount,
    total,
    budgetProgress,
    isLoading,
    removeItem,
  } = useCart();
  const { adsRemoved, getRemoveAdsPackage, purchaseRemoveAds, isPurchasing, restorePurchases, isRestoring } = usePurchases();

  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLoading && !settings.hasCompletedOnboarding) {
      router.replace('/welcome');
    }
  }, [isLoading, settings.hasCompletedOnboarding, router]);

  const handleScanPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, tension: 40, friction: 6 }),
    ]).start();
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/scan');
  };

  const handleManualPress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/add-manual');
  };

  const handleRemoveAdsPress = () => {
    const pkg = getRemoveAdsPackage();
    if (pkg) {
      purchaseRemoveAds(pkg);
    }
  };

  const handleRestorePress = () => {
    restorePurchases();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const showBannerAd = Platform.OS !== 'web' && !adsRemoved && BANNER_AD_UNIT_ID;
  const removeAdsPackage = getRemoveAdsPackage();

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#3B1F78' }}>
              <TotalHeader
                total={total}
                subtotal={subtotal}
                taxAmount={taxAmount}
                taxRate={settings.taxRate}
                itemCount={items.length}
                budgetProgress={budgetProgress}
                storeName={settings.storeName}
              />
            </SafeAreaView>
            {settings.budgetCeiling && settings.budgetCeiling > 0 ? (
              <View style={styles.budgetSection}>
                <BudgetBar
                  progress={budgetProgress}
                  budget={settings.budgetCeiling}
                  total={total}
                />
              </View>
            ) : null}
            
            {/* Remove Ads Banner */}
            {!adsRemoved && removeAdsPackage && (
              <View style={styles.removeAdsBanner}>
                <View style={styles.removeAdsContent}>
                  <Crown size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.removeAdsTitle}>Go Ad-Free</Text>
                    <Text style={styles.removeAdsSubtitle}>Remove all ads for a cleaner experience</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeAdsButton}
                    onPress={handleRemoveAdsPress}
                    disabled={isPurchasing}
                  >
                    <Text style={styles.removeAdsButtonText}>
                      {isPurchasing ? '...' : removeAdsPackage.product.priceString}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={handleRestorePress}
                  disabled={isRestoring}
                >
                  <Text style={styles.restoreButtonText}>
                    {isRestoring ? 'Restoring...' : 'Restore Purchase'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {items.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>Your Items</Text>
                <Text style={styles.listHeaderCount}>{items.length} items</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <CartItemCard
            item={item}
            index={index}
            taxRate={settings.taxRate}
            onRemove={removeItem}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <ShoppingBag size={40} color={Colors.secondaryText} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Scan a price tag or add items manually to get started
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={handleManualPress}
          testID="manual-add-button"
          activeOpacity={0.8}
        >
          <Plus size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleScanPress}
            testID="scan-button"
            activeOpacity={0.8}
          >
            <Camera size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>Scan</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Banner Ad at Bottom */}
      {showBannerAd && (
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={BANNER_AD_UNIT_ID!}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondaryText,
  },
  budgetSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  removeAdsBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeAdsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeAdsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  removeAdsSubtitle: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  removeAdsButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  removeAdsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  restoreButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  restoreButtonText: {
    fontSize: 13,
    color: Colors.secondaryText,
    textDecorationLine: 'underline',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  listHeaderText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  listHeaderCount: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '500' as const,
  },
  listContent: {
    paddingBottom: 180,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.iconBgPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
