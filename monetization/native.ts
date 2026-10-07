import {NativeModules, Platform} from 'react-native';

export type AgeGroup = 'under16' | 'teen' | 'adult';
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
};
export type NativeMonetization = {
  initialize: () => Promise<MonetizationStatus>;
  purchase: () => Promise<MonetizationStatus>;
  restore: () => Promise<MonetizationStatus>;
  setAgeGroup: (group: AgeGroup) => Promise<MonetizationStatus>;
  privacyOptions: () => Promise<MonetizationStatus>;
  refreshProducts: () => Promise<MonetizationStatus>;
  setGameActive: (active: boolean) => void;
  showInterstitial: () => Promise<boolean>;
  addListener: (event: string) => void;
  removeListeners: (count: number) => void;
};

export const nativeMonetization: NativeMonetization | undefined =
  Platform.OS === 'android' ? NativeModules.RateKunstMonetization : undefined;
