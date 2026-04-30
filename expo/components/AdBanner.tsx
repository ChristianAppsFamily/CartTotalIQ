import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAds } from '@/providers/AdsProvider';

export default function AdBanner() {
  const { adsEnabled, bannerAdUnitId, canRequestPersonalizedAds } = useAds();

  if (!adsEnabled || Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: !canRequestPersonalizedAds }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
});
