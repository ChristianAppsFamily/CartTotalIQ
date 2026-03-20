import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Colors from '@/constants/colors';

interface BudgetBarProps {
  progress: number;
  budget: number;
  total: number;
}

export default function BudgetBar({ progress, budget, total }: BudgetBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: Math.min(progress, 1),
      useNativeDriver: false,
      tension: 40,
      friction: 12,
    }).start();
  }, [progress, animatedWidth]);

  const getBarColor = () => {
    if (progress >= 0.9) return Colors.accentHot;
    if (progress >= 0.7) return Colors.budgetWarning;
    return Colors.accent;
  };

  const getLabel = () => {
    if (progress >= 1) return 'Over budget!';
    if (progress >= 0.9) return 'Almost there!';
    if (progress >= 0.7) return 'Getting close';
    return `$${(budget - total).toFixed(2)} left`;
  };

  const barColor = getBarColor();
  const remaining = budget - total;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Budget</Text>
        <Text style={[styles.remaining, remaining < 0 && styles.overBudget]}>
          {getLabel()}
        </Text>
      </View>
      <View style={styles.trackOuter}>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: barColor,
                width: animatedWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>${total.toFixed(2)}</Text>
        <Text style={styles.footerText}>${budget.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  remaining: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  overBudget: {
    color: Colors.accentHot,
  },
  trackOuter: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  track: {
    height: 10,
    backgroundColor: Colors.iconBgPurple,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerText: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '500' as const,
  },
});
