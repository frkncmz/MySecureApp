import { Platform } from 'react-native';
import mobileAds, {
  InterstitialAd,
  AdEventType,
  TestIds,
  AdsConsent,
} from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

// Production Interstitial Ad IDs — Replace with your LoveLog ad unit IDs
const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : (Platform.select({
      ios: 'ca-app-pub-1090418584700729/1745906093',
      android: 'ca-app-pub-1090418584700729/3814043532',
    }) as string);

// Production Banner Ad IDs
export const BANNER_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : (Platform.select({
      ios: 'ca-app-pub-1090418584700729/9456875159',
      android: 'ca-app-pub-1090418584700729/6888449347',
    }) as string);

let interstitial: InterstitialAd | null = null;
let isAdLoaded = false;
let isAdLoading = false;
let unsubscribers: (() => void)[] = [];

/**
 * Clean up event listeners from the current ad instance.
 */
function cleanupListeners(): void {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
}

/**
 * Load an interstitial ad. Should be called early so it's ready when needed.
 */
function loadInterstitial(): void {
  if (isAdLoading || isAdLoaded) return;

  // Clean up previous instance listeners
  cleanupListeners();

  isAdLoading = true;
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);

  const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isAdLoaded = true;
    isAdLoading = false;
    console.log('[AdService] Interstitial loaded');
  });

  const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
    isAdLoaded = false;
    isAdLoading = false;
    console.warn('[AdService] Interstitial failed to load:', error);
    // Retry after a delay
    setTimeout(() => loadInterstitial(), 30000);
  });

  const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isAdLoaded = false;
    // Pre-load the next ad after this one closes
    setTimeout(() => loadInterstitial(), 2000);
  });

  unsubscribers = [unsubLoaded, unsubError, unsubClosed];

  interstitial.load();
}

/**
 * Initialize ad service. Call after user consent is gathered.
 */
export async function initializeAds(): Promise<void> {
  try {
    console.log('[AdService] Requesting consent status...');

    // 1. Google UMP Consent
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
      const { status } = await AdsConsent.loadAndShowConsentFormIfRequired();
      console.log('[AdService] Consent form completed. Status:', status);
    }

    // 2. Apple App Tracking Transparency Consent (iOS only)
    if (Platform.OS === 'ios') {
      const { status } = await requestTrackingPermissionsAsync();
      console.log('[AdService] Apple ATT permission status:', status);
    }

    // 3. Initialize Mobile Ads SDK and Load first interstitial
    await mobileAds().initialize();
    loadInterstitial();
    console.log('[AdService] SDK Initialized & Interstitial loaded');
  } catch (error) {
    console.warn('[AdService] Ad initialization failed:', error);
  }
}

/**
 * Show an interstitial ad. Call after meaningful actions.
 * Returns a Promise that resolves when the ad is closed (or immediately if no ad is ready).
 */
export function showInterstitialAd(): Promise<void> {
  return new Promise((resolve) => {
    if (!isAdLoaded || !interstitial) {
      console.log('[AdService] No ad ready, skipping');
      loadInterstitial();
      resolve();
      return;
    }

    // Listen for the ad closing before resolving
    const unsubClose = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubClose();
      resolve();
    });

    try {
      isAdLoaded = false;
      interstitial.show();
    } catch (error) {
      console.warn('[AdService] Show error:', error);
      unsubClose();
      loadInterstitial();
      resolve();
    }
  });
}
