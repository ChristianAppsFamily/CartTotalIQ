import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface TotalHeaderProps {
  total: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  itemCount: number;
  budgetProgress: number;
  storeName?: string;
}

export default function TotalHeader({
  total,
  subtotal,
  taxAmount,
  taxRate,
  itemCount,
  budgetProgress,
  storeName,
}: TotalHeaderProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevTotal = useRef(total);

  useEffect(() => {
    if (total !== prevTotal.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 6,
        }),
      ]).start();
      prevTotal.current = total;
    }
  }, [total, scaleAnim]);

  const getTotalColor = () => {
    if (budgetProgress >= 0.9) return Colors.accentHot;
    if (budgetProgress >= 0.7) return '#A855F7';
    return Colors.accent;
  };

  return (
    <LinearGradient
      colors={['#3B1F78', '#2A1557', '#1E0F40']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {storeName ? (
        <View style={styles.storeTag}>
          <Text style={styles.storeText}>{storeName}</Text>
        </View>
      ) : null}
      <Text style={styles.label}>Running Total</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text style={[styles.total, { color: getTotalColor() }]}>
          ${total.toFixed(2)}
        </Text>
      </Animated.View>
      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Subtotal</Text>
          <Text style={styles.breakdownValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Tax ({(taxRate * 100).toFixed(1)}%)</Text>
          <Text style={styles.breakdownValue}>${taxAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Items</Text>
          <Text style={styles.breakdownValue}>{itemCount}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  storeTag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  storeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  total: {
    fontSize: 52,
    fontWeight: '800' as const,
    letterSpacing: -2,
    marginBottom: 16,
  },
  breakdown: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  breakdownValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
