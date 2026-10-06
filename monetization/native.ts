import {NativeModules, Platform} from 'react-native';

export type AgeGroup = 'under16' | 'teen' | 'adult';
export type MonetizationDiagnostics = {
  version: string;
  bannerId: string;
  interstitialId?: string;
  adContentRating: string;
  ageProtected: boolean;
  consentBusy: boolean;
  consentStatus: number;
  consentFormAvailable: boolean;
  billingError: string;
  productId?: string;
  purchaseOptionId?: string;
  productError?: string;
  consentError: string;
  bannerState: 'idle' | 'loading' | 'loaded' | 'failed';
  bannerSize: string;
  bannerError: string;
  interstitialState: 'idle' | 'loading' | 'loaded' | 'failed';
  interstitialError: string;
  interstitialShowError?: string;
  interstitialSkipReason?: string;
};
export type MonetizationStatus = {
  adsRemoved: boolean;
  purchaseChecked: boolean;
  adsReady: boolean;
  purchaseAvailable: boolean;
  price: string;
  productLoading?: boolean;
  productError?: string;
  ageGroup: AgeGroup | '';
  privacyOptionsRequired: boolean;
  diagnostics?: MonetizationDiagnostics;
};
export type NativeMonetization = {
  initialize: () => Promise<MonetizationStatus>;
  purchase: () => Promise<MonetizationStatus>;
  restore: () => Promise<MonetizationStatus>;
  setAgeGroup: (group: AgeGroup) => Promise<MonetizationStatus>;
  privacyOptions: () => Promise<MonetizationStatus>;
  retryAds: () => Promise<MonetizationStatus>;
  refreshProducts: () => Promise<MonetizationStatus>;
  setGameActive: (active: boolean) => void;
  showInterstitial: () => Promise<boolean>;
  addListener: (event: string) => void;
  removeListeners: (count: number) => void;
};

export const nativeMonetization: NativeMonetization | undefined =
  Platform.OS === 'android' ? NativeModules.RateKunstMonetization : undefined;
