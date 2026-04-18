import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, DollarSign, Trash2, ChevronRight, Store, ShieldCheck, RotateCcw, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import { getStateForZip } from '@/constants/taxRates';

export default function SettingsScreen() {
  const { settings, updateSettings, clearItems, items } = useCart();
  const {
    adsRemoved,
    getRemoveAdsPackage,
    purchaseRemoveAds,
    isPurchasing,
    restorePurchases,
    isRestoring,
  } = usePurchases();
  const [zipInput, setZipInput] = useState(settings.zipCode);
  const [budgetInput, setBudgetInput] = useState(
    settings.budgetCeiling ? settings.budgetCeiling.toString() : ''
  );
  const [storeInput, setStoreInput] = useState(settings.storeName);

  const handleRemoveAds = () => {
    const pkg = getRemoveAdsPackage();
    if (!pkg) {
      Alert.alert('Unavailable', 'Remove Ads purchase is not available right now. Please try again later.');
      return;
    }
    purchaseRemoveAds(pkg);
  };

  const handleRestore = () => {
    restorePurchases(undefined, {
      onSuccess: (info) => {
        const hasIt = info.entitlements.active['remove_ads'] !== undefined;
        if (hasIt) {
          Alert.alert('Restored', 'Your Remove Ads purchase has been restored!');
        } else {
          Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
        }
      },
      onError: () => {
        Alert.alert('Error', 'Failed to restore purchases. Please try again.');
      },
    });
  };

  const handleSaveZip = () => {
    if (zipInput.length !== 5 || !/^\d{5}$/.test(zipInput)) {
      Alert.alert('Invalid ZIP', 'Please enter a valid 5-digit ZIP code.');
      return;
    }
    updateSettings({ zipCode: zipInput });
    const state = getStateForZip(zipInput);
    Alert.alert('Updated', `Tax rate updated for ${state} (${zipInput})`);
  };

  const handleSaveBudget = () => {
    const val = parseFloat(budgetInput);
    if (budgetInput === '' || budgetInput === '0') {
      updateSettings({ budgetCeiling: null });
      Alert.alert('Budget Removed', 'No budget ceiling is set.');
      return;
    }
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid dollar amount.');
      return;
    }
    updateSettings({ budgetCeiling: val });
    Alert.alert('Budget Set', `Your budget ceiling is now $${val.toFixed(2)}`);
  };

  const handleSaveStore = () => {
    updateSettings({ storeName: storeInput.trim() });
  };

  const handleClearItems = () => {
    Alert.alert(
      'Clear All Items',
      `Remove all ${items.length} items from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearItems();
            Alert.alert('Done', 'All items have been cleared.');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Settings</Text>
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Tax</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircle}>
                <MapPin size={18} color={Colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>ZIP Code</Text>
                <TextInput
                  style={styles.input}
                  value={zipInput}
                  onChangeText={setZipInput}
                  placeholder="Enter ZIP code"
                  placeholderTextColor={Colors.muted}
                  keyboardType="number-pad"
                  maxLength={5}
                  testID="zip-input"
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveZip} testID="save-zip">
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.taxInfo}>
              <Text style={styles.taxInfoText}>
                Current rate: {(settings.taxRate * 100).toFixed(2)}%
                {settings.zipCode ? ` · ${getStateForZip(settings.zipCode)}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Name</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.iconBgPink }]}>
                <Store size={18} color={Colors.accentHot} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Current Store</Text>
                <TextInput
                  style={styles.input}
                  value={storeInput}
                  onChangeText={setStoreInput}
                  onBlur={handleSaveStore}
                  placeholder="e.g. Target, Walmart"
                  placeholderTextColor={Colors.muted}
                  testID="store-input"
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStore} testID="save-store">
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Ceiling</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.iconBgPink }]}>
                <DollarSign size={18} color={Colors.accent} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Maximum Spend</Text>
                <TextInput
                  style={styles.input}
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="0.00 (no limit)"
                  placeholderTextColor={Colors.muted}
                  keyboardType="decimal-pad"
                  testID="budget-input"
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBudget} testID="save-budget">
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
            {settings.budgetCeiling ? (
              <View style={styles.taxInfo}>
                <Text style={styles.taxInfoText}>
                  Budget: ${settings.budgetCeiling.toFixed(2)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {!adsRemoved ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium</Text>
            <TouchableOpacity
              style={[styles.card, styles.premiumCard]}
              onPress={handleRemoveAds}
              disabled={isPurchasing}
              activeOpacity={0.7}
              testID="remove-ads"
            >
              <View style={styles.cardRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Sparkles size={18} color="#F59E0B" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Remove Ads</Text>
                  <Text style={styles.cardSub}>One-time purchase · $4.99</Text>
                </View>
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <ChevronRight size={18} color={Colors.muted} />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.card, { marginTop: 10 }]}
              onPress={handleRestore}
              disabled={isRestoring}
              activeOpacity={0.7}
              testID="restore-purchases"
            >
              <View style={styles.cardRow}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.iconBgPurple }]}>
                  <RotateCcw size={18} color={Colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Restore Purchase</Text>
                  <Text style={styles.cardSub}>Reinstalled? Recover your purchase</Text>
                </View>
                {isRestoring ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <ChevronRight size={18} color={Colors.muted} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium</Text>
            <View style={[styles.card, styles.successCard]}>
              <View style={styles.cardRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                  <ShieldCheck size={18} color="#059669" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardLabel, { color: '#059669' }]}>Ads Removed</Text>
                  <Text style={styles.cardSub}>Thank you for your support!</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity
            style={[styles.card, styles.dangerCard]}
            onPress={handleClearItems}
            testID="clear-items"
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={18} color="#EF4444" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, { color: '#EF4444' }]}>Clear All Items</Text>
                <Text style={styles.cardSub}>{items.length} items in cart</Text>
              </View>
              <ChevronRight size={18} color={Colors.muted} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>CartTotalIQ v1.0</Text>
          <Text style={styles.footerSub}>Know before you go.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.background,
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerCard: {
    borderColor: '#FECACA',
  },
  premiumCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  successCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.iconBgPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    padding: 0,
    fontWeight: '500' as const,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  taxInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  taxInfoText: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '500' as const,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '600' as const,
  },
  footerSub: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
    fontStyle: 'italic' as const,
  },
});
