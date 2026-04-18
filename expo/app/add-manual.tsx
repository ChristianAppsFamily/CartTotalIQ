import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { usePurchases } from '@/providers/PurchaseProvider';
import { trackInteractionAndShowAd } from '@/utils/ads';

const EMOJI_OPTIONS = ['🛒', '🍎', '🥖', '🥩', '🧀', '🥛', '🧃', '🍕', '🍫', '🧹', '🧴', '👕', '💊', '🕯️', '🌸', '📦', '🔧', '🎮', '📱', '🎁'];

const CATEGORY_OPTIONS = ['Groceries', 'Produce', 'Dairy', 'Meat & Seafood', 'Bakery', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Clothing', 'Electronics', 'Home Décor', 'Health', 'Toys & Games', 'Other'];

export default function AddManualScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const { adsRemoved } = usePurchases();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Other');
  const [emoji, setEmoji] = useState('🛒');

  const handleAdd = async () => {
    const priceVal = parseFloat(price);
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter an item name.');
      return;
    }
    if (isNaN(priceVal) || priceVal <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    addItem({
      name: name.trim(),
      price: priceVal,
      category,
      emoji,
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Show interstitial ad when adding item if ads not removed
    if (!adsRemoved) {
      await trackInteractionAndShowAd();
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Add Item' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Organic Bananas"
            placeholderTextColor={Colors.muted}
            testID="manual-name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceRow}>
            <Text style={styles.dollar}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={Colors.muted}
              keyboardType="decimal-pad"
              testID="manual-price"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, emoji === e && styles.emojiSelected]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.categoryChip, category === c && styles.categorySelected]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.categoryText, category === c && styles.categoryTextSelected]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, (!name.trim() || !price) && styles.addBtnDisabled]}
          onPress={handleAdd}
          testID="manual-add-confirm"
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  dollar: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingVertical: 14,
  },
  emojiScroll: {
    marginHorizontal: -4,
  },
  emojiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  emojiSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.iconBgPurple,
  },
  emojiText: {
    fontSize: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categorySelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.secondaryText,
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
