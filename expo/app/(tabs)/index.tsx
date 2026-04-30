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
import { Camera, Plus, ShoppingBag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { useAds } from '@/providers/AdsProvider';
import TotalHeader from '@/components/TotalHeader';
import BudgetBar from '@/components/BudgetBar';
import CartItemCard from '@/components/CartItemCard';
import AdBanner from '@/components/AdBanner';

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
    editItem,
  } = useCart();
  const { showInterstitialIfLoaded, adsEnabled } = useAds();

  const fabScale = useRef(new Animated.Value(1)).current;
  const interstitialTapCounter = useRef(0);

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
    if (adsEnabled) {
      interstitialTapCounter.current += 1;
      if (interstitialTapCounter.current % 3 === 0) {
        void showInterstitialIfLoaded();
      }
    }
    router.push('/scan');
  };

  const handleManualPress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/add-manual');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
            onEdit={editItem}
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
      <AdBanner />
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
    paddingBottom: 120,
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
    bottom: 32,
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
});
