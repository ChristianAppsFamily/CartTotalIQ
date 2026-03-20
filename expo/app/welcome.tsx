import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MapPin, ShoppingCart, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/providers/CartProvider';
import { getStateForZip, getTaxRateForZip } from '@/constants/taxRates';

export default function WelcomeScreen() {
  const router = useRouter();
  const { updateSettings } = useCart();
  const [zip, setZip] = useState('');
  const [budget, setBudget] = useState('');
  const [store, setStore] = useState('');
  const buttonScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleContinue = () => {
    if (zip.length !== 5 || !/^\d{5}$/.test(zip)) {
      Alert.alert('Enter ZIP Code', 'Please enter a valid 5-digit ZIP code to calculate tax.');
      return;
    }

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, tension: 40, friction: 6 }),
    ]).start();

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const taxRate = getTaxRateForZip(zip);
    const budgetVal = parseFloat(budget);

    updateSettings({
      zipCode: zip,
      taxRate,
      budgetCeiling: !isNaN(budgetVal) && budgetVal > 0 ? budgetVal : null,
      hasCompletedOnboarding: true,
      storeName: store.trim(),
    });

    router.replace('/(tabs)');
  };

  const state = zip.length === 5 ? getStateForZip(zip) : '';
  const taxPreview = zip.length === 5 ? (getTaxRateForZip(zip) * 100).toFixed(2) : '';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3B1F78', '#2A1557', '#1E0F40']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <ShoppingCart size={32} color={Colors.accent} />
            </View>
            <Text style={styles.title}>CartTotalIQ</Text>
            <Text style={styles.tagline}>Know before you go.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.formTitle}>Let's get started</Text>
          <Text style={styles.formSubtitle}>
            Enter your ZIP code so we can calculate sales tax automatically.
          </Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MapPin size={14} color={Colors.secondaryText} />
              <Text style={styles.labelText}>ZIP Code</Text>
            </View>
            <TextInput
              style={styles.input}
              value={zip}
              onChangeText={setZip}
              placeholder="e.g. 90210"
              placeholderTextColor={Colors.muted}
              keyboardType="number-pad"
              maxLength={5}
              testID="welcome-zip"
            />
            {state ? (
              <Text style={styles.taxPreview}>
                {state} · {taxPreview}% sales tax
              </Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.labelText, { marginLeft: 0 }]}>Store Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={store}
              onChangeText={setStore}
              placeholder="e.g. Target, Costco"
              placeholderTextColor={Colors.muted}
              testID="welcome-store"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.labelText, { marginLeft: 0 }]}>Budget Ceiling (optional)</Text>
            <TextInput
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
              placeholder="$0.00 (no limit)"
              placeholderTextColor={Colors.muted}
              keyboardType="decimal-pad"
              testID="welcome-budget"
            />
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, zip.length < 5 && styles.continueButtonDisabled]}
              onPress={handleContinue}
              testID="welcome-continue"
              activeOpacity={0.8}
            >
              <Text style={styles.continueText}>Start Shopping</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
  },
  formWrapper: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 20,
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.secondaryText,
    marginLeft: 6,
    marginBottom: 8,
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
  taxPreview: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 8,
    marginLeft: 4,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
