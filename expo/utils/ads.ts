import {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  AdsConsent,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// Ad Unit IDs
const BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3002325591150738/8472312000',
  android: 'ca-app-pub-3002325591150738/8472312000',
  default: 'ca-app-pub-3002325591150738/8472312000',
});

const INTERSTITIAL_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3002325591150738/2937287588',
  android: 'ca-app-pub-3002325591150738/2937287588',
  default: 'ca-app-pub-3002325591150738/2937287588',
});

// Interaction counter for interstitial
let interactionCount = 0;
const INTERSTITIAL_FREQUENCY = 3;

// Interstitial ad instance
let interstitialAd: InterstitialAd | null = null;

// Initialize AdMob with consent
export const initializeAds = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    // Request tracking transparency (iOS 14.5+)
    if (Platform.OS === 'ios') {
      const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
      const { status } = await requestTrackingPermissionsAsync();
      console.log('Tracking permission status:', status);
    }

    // Request GDPR consent for EEA users
    const consentInfo = await AdsConsent.requestInfoUpdate();
    
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      const { status: consentStatus } = await AdsConsent.loadAndShowConsentFormIfRequired();
      console.log('Consent status after form:', consentStatus);
    }

    // Load interstitial ad
    loadInterstitialAd();
  } catch (error) {
    console.log('Error initializing ads:', error);
  }
};

// Load interstitial ad
export const loadInterstitialAd = (): void => {
  if (Platform.OS === 'web' || !INTERSTITIAL_AD_UNIT_ID) return;

  try {
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded');
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial ad error:', error);
    });

    interstitialAd.load();
  } catch (error) {
    console.log('Error loading interstitial:', error);
  }
};

// Track interaction and show interstitial if needed
export const trackInteractionAndShowAd = async (): Promise<void> => {
  if (Platform.OS === 'web') return;

  interactionCount++;
  console.log('Interaction count:', interactionCount);

  if (interactionCount >= INTERSTITIAL_FREQUENCY) {
    interactionCount = 0;
    await showInterstitialAd();
  }
};

// Show interstitial ad
export const showInterstitialAd = async (): Promise<void> => {
  if (Platform.OS === 'web' || !interstitialAd) return;

  try {
    if (interstitialAd.loaded) {
      await interstitialAd.show();
      // Load next ad after showing
      setTimeout(() => loadInterstitialAd(), 1000);
    } else {
      console.log('Interstitial not loaded yet');
    }
  } catch (error) {
    console.log('Error showing interstitial:', error);
  }
};

// Reset interaction count
export const resetInteractionCount = (): void => {
  interactionCount = 0;
};

// Export banner ad component
export { BannerAd, BannerAdSize };
