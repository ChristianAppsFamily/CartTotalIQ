import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { X, Camera, ImageIcon, Tag, Package, Check } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';

const AIResultSchema = z.object({
  price: z.number(),
  name: z.string(),
  category: z.string(),
  emoji: z.string(),
});

export default function ScanScreen() {
  const router = useRouter();
  const { addItem } = useCart();
  const [priceTagImage, setPriceTagImage] = useState<string | null>(null);
  const [_itemImage, setItemImage] = useState<string | null>(null);
  const [step, setStep] = useState<'price' | 'item' | 'review'>('price');
  const [result, setResult] = useState<{ price: number; name: string; category: string; emoji: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const scanMutation = useMutation({
    mutationFn: async ({ priceImage, productImage }: { priceImage: string; productImage: string | null }) => {
      const messages: Array<{ role: 'user'; content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> }> = [];

      const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];

      if (productImage) {
        content.push({
          type: 'text',
          text: 'I have two images. The first is a price tag/shelf label, and the second is the actual product. Extract the price from the price tag. From the product image, determine the product name, category, and a single relevant emoji. Return JSON with: price (number), name (string), category (string), emoji (single emoji string).',
        });
        content.push({ type: 'image', image: priceImage });
        content.push({ type: 'image', image: productImage });
      } else {
        content.push({
          type: 'text',
          text: 'This is a photo of a price tag or shelf label. Extract the price. Try to guess the product name from any text visible on the label. If you can determine the product, provide a name, category, and emoji. If not, use "Unknown Item" as the name, "General" as the category, and "🏷️" as the emoji. Return JSON with: price (number), name (string), category (string), emoji (single emoji string).',
        });
        content.push({ type: 'image', image: priceImage });
      }

      messages.push({ role: 'user', content });

      const aiResult = await generateObject({
        messages,
        schema: AIResultSchema,
      });

      return aiResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setEditName(data.name);
      setEditPrice(data.price.toFixed(2));
      setStep('review');
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      console.log('AI scan error:', error);
      Alert.alert('Scan Failed', 'Could not read the price tag. Please try again or add the item manually.');
    },
  });

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let pickerResult: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Camera access is needed to scan price tags.');
          return null;
        }
        pickerResult = await ImagePicker.launchCameraAsync({
          base64: true,
          quality: 0.7,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Photo library access is needed.');
          return null;
        }
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          base64: true,
          quality: 0.7,
        });
      }

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        const base64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        return base64;
      }
      return null;
    } catch (err) {
      console.log('Image picker error:', err);
      return null;
    }
  };

  const handleCapturePriceTag = async (source: 'camera' | 'library') => {
    const img = await pickImage(source);
    if (img) {
      setPriceTagImage(img);
      setStep('item');
    }
  };

  const handleCaptureItem = async (source: 'camera' | 'library') => {
    const img = await pickImage(source);
    if (img) {
      setItemImage(img);
      scanMutation.mutate({ priceImage: priceTagImage!, productImage: img });
    }
  };

  const handleSkipItem = () => {
    scanMutation.mutate({ priceImage: priceTagImage!, productImage: null });
  };

  const handleConfirm = () => {
    if (!result) return;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }
    addItem({
      name: editName || result.name,
      category: result.category,
      emoji: result.emoji,
      price,
    });
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} testID="close-scan">
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>
            {step === 'price' ? 'Scan Price Tag' : step === 'item' ? 'Scan Product' : 'Review Item'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'price' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconBg}>
              <Tag size={36} color={Colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Take a photo of the price tag</Text>
            <Text style={styles.stepSubtitle}>
              Point your camera at a shelf label, sticker, or handwritten tag
            </Text>

            {priceTagImage ? (
              <Image source={{ uri: priceTagImage }} style={styles.preview} contentFit="cover" />
            ) : null}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleCapturePriceTag('camera')}
                testID="capture-price-camera"
              >
                <Camera size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => handleCapturePriceTag('library')}
                testID="capture-price-library"
              >
                <ImageIcon size={20} color={Colors.primary} />
                <Text style={styles.secondaryBtnText}>From Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'item' && (
          <View style={styles.stepContainer}>
            {scanMutation.isPending ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Analyzing price tag...</Text>
              </View>
            ) : (
              <>
                <View style={[styles.stepIconBg, { backgroundColor: Colors.iconBgPink }]}>
                  <Package size={36} color={Colors.accentHot} />
                </View>
                <Text style={styles.stepTitle}>Scan the product (optional)</Text>
                <Text style={styles.stepSubtitle}>
                  Take a photo of the item for AI to auto-name and categorize it
                </Text>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => handleCaptureItem('camera')}
                    testID="capture-item-camera"
                  >
                    <Camera size={20} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => handleCaptureItem('library')}
                    testID="capture-item-library"
                  >
                    <ImageIcon size={20} color={Colors.primary} />
                    <Text style={styles.secondaryBtnText}>From Library</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.skipBtn} onPress={handleSkipItem} testID="skip-item">
                  <Text style={styles.skipText}>Skip — just use the price</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {step === 'review' && result && (
          <View style={styles.stepContainer}>
            <View style={styles.reviewCard}>
              <View style={styles.reviewEmoji}>
                <Text style={styles.reviewEmojiText}>{result.emoji}</Text>
              </View>
              <View style={styles.reviewField}>
                <Text style={styles.reviewLabel}>Name</Text>
                <TextInput
                  style={styles.reviewInput}
                  value={editName}
                  onChangeText={setEditName}
                  testID="review-name"
                />
              </View>
              <View style={styles.reviewField}>
                <Text style={styles.reviewLabel}>Category</Text>
                <Text style={styles.reviewCategory}>{result.category}</Text>
              </View>
              <View style={styles.reviewField}>
                <Text style={styles.reviewLabel}>Price</Text>
                <View style={styles.priceInputRow}>
                  <Text style={styles.dollar}>$</Text>
                  <TextInput
                    style={styles.reviewPriceInput}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="decimal-pad"
                    testID="review-price"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} testID="confirm-item">
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                setStep('price');
                setPriceTagImage(null);
                setItemImage(null);
                setResult(null);
              }}
              testID="scan-another"
            >
              <Text style={styles.skipText}>Scan another item</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  stepIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.iconBgPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  skipBtn: {
    marginTop: 20,
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '600' as const,
  },
  loadingState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondaryText,
    fontWeight: '500' as const,
  },
  reviewCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 24,
  },
  reviewEmoji: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.iconBgPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewEmojiText: {
    fontSize: 32,
  },
  reviewField: {
    width: '100%',
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  reviewInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  reviewCategory: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
    paddingVertical: 4,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  dollar: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginRight: 4,
  },
  reviewPriceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingVertical: 12,
  },
  confirmBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
