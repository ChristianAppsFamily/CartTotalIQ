import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { usePurchases } from '@/providers/PurchaseProvider';

const IOS_BANNER_AD_UNIT_ID = 'ca-app-pub-3002325591150738/1087306830';
const IOS_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3002325591150738/7756567672';
const ANDROID_BANNER_AD_UNIT_ID = 'ca-app-pub-3002325591150738/2783743913';
const ANDROID_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-3002325591150738/4580964756';

function useAdsContext() {
  const { adsRemoved } = usePurchases();
  const [initialized, setInitialized] = useState(false);
  const [canRequestPersonalizedAds, setCanRequestPersonalizedAds] = useState(false);
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);
  const interstitialRef = useRef<InterstitialAd | null>(null);

  const isSupportedPlatform = Platform.OS === 'ios' || Platform.OS === 'android';
  const bannerAdUnitId = useMemo(
    () => (Platform.OS === 'ios' ? IOS_BANNER_AD_UNIT_ID : ANDROID_BANNER_AD_UNIT_ID),
    []
  );
  const interstitialAdUnitId = useMemo(
    () => (Platform.OS === 'ios' ? IOS_INTERSTITIAL_AD_UNIT_ID : ANDROID_INTERSTITIAL_AD_UNIT_ID),
    []
  );

  const requestTrackingPermission = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setCanRequestPersonalizedAds(true);
      return true;
    }

    const current = await getTrackingPermissionsAsync();
    let status = current.status;
    if (status === PermissionStatus.UNDETERMINED) {
      const requested = await requestTrackingPermissionsAsync();
      status = requested.status;
    }

    const granted = status === PermissionStatus.GRANTED;
    setCanRequestPersonalizedAds(granted);
    return granted;
  }, []);

  const loadInterstitial = useCallback(() => {
    if (!isSupportedPlatform || adsRemoved || !interstitialAdUnitId) return;

    const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
      requestNonPersonalizedAdsOnly: !canRequestPersonalizedAds,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setIsInterstitialLoaded(true);
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setIsInterstitialLoaded(false);
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      setIsInterstitialLoaded(false);
    });
    interstitial.load();
    interstitialRef.current = interstitial;
  }, [adsRemoved, canRequestPersonalizedAds, interstitialAdUnitId, isSupportedPlatform]);

  useEffect(() => {
    if (!isSupportedPlatform || initialized) return;

    const init = async () => {
      // ATT must be evaluated before deciding whether to send personalized requests.
      const personalizedAllowed = await requestTrackingPermission();
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
      await mobileAds().initialize();
      setCanRequestPersonalizedAds(personalizedAllowed);
      setInitialized(true);
    };

    void init();
  }, [initialized, isSupportedPlatform, requestTrackingPermission]);

  useEffect(() => {
    if (!initialized) return;
    loadInterstitial();
  }, [initialized, loadInterstitial]);

  const showInterstitialIfLoaded = useCallback(async () => {
    if (!initialized || adsRemoved) return;

    const interstitial = interstitialRef.current;
    if (!interstitial) return;

    if (isInterstitialLoaded) {
      await interstitial.show();
      loadInterstitial();
    }
  }, [adsRemoved, initialized, isInterstitialLoaded, loadInterstitial]);

  return {
    initialized,
    adsEnabled: initialized && isSupportedPlatform && !adsRemoved && !!bannerAdUnitId,
    canRequestPersonalizedAds,
    bannerAdUnitId,
    showInterstitialIfLoaded,
  };
}

export const [AdsProvider, useAds] = createContextHook(useAdsContext);
