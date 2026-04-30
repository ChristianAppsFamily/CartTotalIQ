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
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  DollarSign,
  Trash2,
  ChevronRight,
  Store,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Pencil,
  Mail,
  FileText,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import { getStateForZip } from '@/constants/taxRates';

// Replace this URL with your final GitHub Pages URL if owner/repo/path changes.
const PRIVACY_POLICY_URL = 'https://christianappsfamily.github.io/rork-carttotaliq/privacy-policy.html';

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

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<'zip' | 'store' | 'budget' | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const openEditModal = (field: 'zip' | 'store' | 'budget') => {
    setEditField(field);
    if (field === 'zip') setEditValue(settings.zipCode);
    else if (field === 'store') setEditValue(settings.storeName);
    else if (field === 'budget') setEditValue(settings.budgetCeiling ? settings.budgetCeiling.toString() : '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (editField === 'zip') {
      if (editValue.length !== 5 || !/^\d{5}$/.test(editValue)) {
        Alert.alert('Invalid ZIP', 'Please enter a valid 5-digit ZIP code.');
        return;
      }
      updateSettings({ zipCode: editValue });
      const state = getStateForZip(editValue);
      Alert.alert('Updated', `Tax rate updated for ${state} (${editValue})`);
    } else if (editField === 'store') {
      updateSettings({ storeName: editValue.trim() });
      Alert.alert('Updated', 'Store name saved.');
    } else if (editField === 'budget') {
      if (editValue === '' || editValue === '0') {
        updateSettings({ budgetCeiling: null });
        Alert.alert('Budget Removed', 'No budget ceiling is set.');
      } else {
        const val = parseFloat(editValue);
        if (isNaN(val) || val < 0) {
          Alert.alert('Invalid Budget', 'Please enter a valid dollar amount.');
          return;
        }
        updateSettings({ budgetCeiling: val });
        Alert.alert('Budget Set', `Your budget ceiling is now $${val.toFixed(2)}`);
      }
    }
    setEditModalVisible(false);
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

  const handleContactSupport = async () => {
    const email = 'ChristianAppEmpire@gmail.com';
    const subject = 'CartTotalIQ Support';
    const body = 'Hello CartTotalIQ Team,\n\nI need help with...\n\n';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Email', `Please contact us at ${email}`);
      }
    } catch {
      Alert.alert('Email', `Please contact us at ${email}`);
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      const canOpen = await Linking.canOpenURL(PRIVACY_POLICY_URL);
      if (canOpen) {
        await Linking.openURL(PRIVACY_POLICY_URL);
      } else {
        Alert.alert('Privacy Policy', `Unable to open privacy policy. Visit: ${PRIVACY_POLICY_URL}`);
      }
    } catch {
      Alert.alert('Privacy Policy', `Unable to open privacy policy. Visit: ${PRIVACY_POLICY_URL}`);
    }
  };

  const getEditModalTitle = () => {
    switch (editField) {
      case 'zip': return 'Edit ZIP Code';
      case 'store': return 'Edit Store Name';
      case 'budget': return 'Edit Budget Ceiling';
      default: return 'Edit';
    }
  };

  const getEditModalPlaceholder = () => {
    switch (editField) {
      case 'zip': return 'Enter ZIP code';
      case 'store': return 'e.g. Target, Walmart';
      case 'budget': return '0.00 (no limit)';
      default: return '';
    }
  };

  const getEditKeyboardType = () => {
    switch (editField) {
      case 'zip': return 'number-pad';
      case 'budget': return 'decimal-pad';
      default: return 'default';
    }
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
        {/* Location & Tax */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Tax</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircle}>
                <MapPin size={18} color={Colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>ZIP Code</Text>
                <Text style={styles.cardValue}>{settings.zipCode || 'Not set'}</Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal('zip')}
                testID="edit-zip"
              >
                <Pencil size={16} color={Colors.primary} />
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

        {/* Store Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Name</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.iconBgPink }]}>
                <Store size={18} color={Colors.accentHot} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Current Store</Text>
                <Text style={styles.cardValue}>{settings.storeName || 'Not set'}</Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal('store')}
                testID="edit-store"
              >
                <Pencil size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Budget Ceiling */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Ceiling</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.iconBgPink }]}>
                <DollarSign size={18} color={Colors.accent} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Maximum Spend</Text>
                <Text style={styles.cardValue}>
                  {settings.budgetCeiling ? `$${settings.budgetCeiling.toFixed(2)}` : 'No limit'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal('budget')}
                testID="edit-budget"
              >
                <Pencil size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Premium */}
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

        {/* Data */}
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

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={handleContactSupport}
            activeOpacity={0.7}
            testID="contact-support"
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Mail size={18} color="#3B82F6" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Contact Support</Text>
                <Text style={styles.cardSub}>ChristianAppEmpire@gmail.com</Text>
              </View>
              <ChevronRight size={18} color={Colors.muted} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, { marginTop: 10 }]}
            onPress={handleOpenPrivacyPolicy}
            activeOpacity={0.7}
            testID="privacy-policy"
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                <FileText size={18} color="#4F46E5" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Privacy Policy</Text>
                <Text style={styles.cardSub}>View how CartTotalIQ handles data</Text>
              </View>
              <ChevronRight size={18} color={Colors.muted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerAppName}>CartTotalIQ</Text>
          <Text style={styles.footerCompany}>Developed By</Text>
          <Text style={styles.footerCompanyName}>Christian App Empire LLC</Text>
          <Text style={styles.footerCopyright}>Copyright © 2026. All Rights Reserved.</Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getEditModalTitle()}</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={getEditModalPlaceholder()}
              placeholderTextColor={Colors.muted}
              keyboardType={getEditKeyboardType()}
              maxLength={editField === 'zip' ? 5 : undefined}
              autoFocus
            />

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cardValue: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '500' as const,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.iconBgPurple,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerAppName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  footerCompany: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  footerCompanyName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: Colors.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
    marginBottom: 20,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
