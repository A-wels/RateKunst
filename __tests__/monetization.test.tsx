import React from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, jest} from '@jest/globals';
import {
  MonetizationProvider,
  useMonetization,
} from '../monetization/MonetizationContext';
import {MonetizationStatus, nativeMonetization} from '../monetization/native';
import {LocalizationProvider} from '../i18n/LocalizationContext';
import AdBanner from '../components/AdBanner';
import AdAgePrompt from '../components/AdAgePrompt';
import GameScreen from '../pages/screens/GameScreen';

jest.mock('../monetization/native', () => ({
  nativeMonetization: {
    initialize: jest.fn(),
    purchase: jest.fn(),
    restore: jest.fn(),
    setAgeGroup: jest.fn(),
    privacyOptions: jest.fn(),
    setGameActive: jest.fn(),
    showInterstitial: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));
const native = jest.mocked(nativeMonetization!);
const ready: MonetizationStatus = {
  adsRemoved: false,
  purchaseChecked: true,
  adsReady: true,
  purchaseAvailable: true,
  price: '1,99 €',
  ageGroup: 'adult',
  privacyOptionsRequired: false,
};
let tree: renderer.ReactTestRenderer | undefined;
let monetization: ReturnType<typeof useMonetization>;
const Probe = () => {
  monetization = useMonetization();
  return (
    <>
      <AdBanner />
      <AdAgePrompt defer={false} />
    </>
  );
};
let restorePlatform: () => void;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  native.initialize.mockResolvedValue(ready);
  native.purchase.mockResolvedValue({
    ...ready,
    adsRemoved: true,
    adsReady: false,
  });
  native.restore.mockResolvedValue({
    ...ready,
    adsRemoved: true,
    adsReady: false,
  });
  native.showInterstitial.mockResolvedValue(true);
  restorePlatform = jest.replaceProperty(Platform, 'OS', 'android').restore;
});
afterEach(() => {
  act(() => tree?.unmount());
  tree = undefined;
  restorePlatform();
});
const mount = async () => {
  await act(async () => {
    tree = renderer.create(
      <LocalizationProvider>
        <MonetizationProvider>
          <Probe />
        </MonetizationProvider>
      </LocalizationProvider>,
    );
  });
};
const complete = async () => {
  const shownBefore = native.showInterstitial.mock.calls.length;
  await act(async () => {
    monetization.setGameActive(true);
    monetization.completeRound();
  });
  expect(native.showInterstitial).toHaveBeenCalledTimes(shownBefore);
  await act(async () => monetization.setGameActive(false));
};

it('shows a footer outside games, hides it during gameplay and removes it after purchase', async () => {
  await mount();
  const advertised = () =>
    tree!.root
      .findAllByType(Text)
      .some(node => node.props.children === 'Werbung');
  expect(advertised()).toBe(true);
  act(() => monetization.setGameActive(true));
  expect(advertised()).toBe(false);
  act(() => monetization.setGameActive(false));
  expect(advertised()).toBe(true);
  await act(async () => monetization.purchase());
  expect(advertised()).toBe(false);
  expect(monetization.adsRemoved).toBe(true);
});

it('attempts an interstitial after the second completed round and persists the counter', async () => {
  await mount();
  await complete();
  expect(native.showInterstitial).not.toHaveBeenCalled();
  await complete();
  expect(native.showInterstitial).toHaveBeenCalledTimes(1);
  expect(await AsyncStorage.getItem('@ratekunst/completed-rounds')).toBe('2');
  act(() => tree!.unmount());
  await mount();
  await complete();
  expect(native.showInterstitial).toHaveBeenCalledTimes(1);
  await complete();
  expect(native.showInterstitial).toHaveBeenCalledTimes(2);
});

it('does not count abandoned games and never shows a late ad after inventory becomes ready', async () => {
  native.initialize.mockResolvedValue({...ready, adsReady: false});
  await mount();
  act(() => {
    monetization.setGameActive(true);
    monetization.setGameActive(false);
  });
  expect(await AsyncStorage.getItem('@ratekunst/completed-rounds')).toBeNull();
  await complete();
  await complete();
  expect(native.showInterstitial).not.toHaveBeenCalled();
  act(() => DeviceEventEmitter.emit('RateKunstMonetizationChanged', ready));
  act(() => {
    monetization.setGameActive(true);
    monetization.setGameActive(false);
  });
  expect(native.showInterstitial).not.toHaveBeenCalled();
});

it('skips a completed-round ad if another game starts before the saved count finishes writing', async () => {
  await AsyncStorage.setItem('@ratekunst/completed-rounds', '1');
  await mount();
  await act(async () => {
    monetization.setGameActive(true);
    monetization.completeRound();
    monetization.setGameActive(false);
    monetization.setGameActive(true);
  });
  await act(async () => monetization.setGameActive(false));
  expect(native.showInterstitial).not.toHaveBeenCalled();
});

it('restores permanent ad removal and does not award it for a failed or pending purchase', async () => {
  await mount();
  native.purchase.mockRejectedValueOnce({code: 'PURCHASE_PENDING'});
  await act(async () => {
    await expect(monetization.purchase()).rejects.toEqual({
      code: 'PURCHASE_PENDING',
    });
  });
  expect(monetization.adsRemoved).toBe(false);
  await act(async () => monetization.restore());
  expect(monetization.adsRemoved).toBe(true);
  await complete();
  expect(native.showInterstitial).not.toHaveBeenCalled();
});

it('records a win once when returning to the menu and ignores subsequent score taps', async () => {
  jest.useFakeTimers();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const navigation = {popToTop: jest.fn()};
  try {
    await act(async () => {
      tree = renderer.create(
        <LocalizationProvider>
          <MonetizationProvider>
            <Probe />
            <GameScreen
              navigation={navigation}
              route={{
                params: {
                  names: ['Alex'],
                  packIds: ['standard'],
                  language: 'de',
                  pointsToWin: 1,
                },
              }}
            />
          </MonetizationProvider>
        </LocalizationProvider>,
      );
    });
    // The existing countdown advances once per awaited delay.
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
    }
    const score = tree!.root
      .findAllByType(Pressable)
      .find(node => node.props.accessibilityLabel?.startsWith('Alex,'))!;
    act(() => score.props.onPress());
    act(() => score.props.onPress());
    expect(alert).toHaveBeenCalledTimes(1);
    const onReturn = alert.mock.calls[0][2]![0].onPress!;
    await act(async () => {
      onReturn();
      onReturn();
    });
    expect(await AsyncStorage.getItem('@ratekunst/completed-rounds')).toBe('1');
  } finally {
    alert.mockRestore();
    jest.useRealTimers();
  }
});

it('defers the age prompt until purchase ownership is checked', async () => {
  native.initialize.mockResolvedValue({
    ...ready,
    purchaseChecked: false,
    adsReady: false,
    ageGroup: '',
  });
  await mount();
  const ageChoices = () =>
    tree!.root
      .findAllByType(Pressable)
      .filter(node => node.props.accessibilityLabel === 'Unter 16');
  expect(ageChoices()).toHaveLength(0);
  act(() =>
    DeviceEventEmitter.emit('RateKunstMonetizationChanged', {
      ...ready,
      adsReady: false,
      ageGroup: '',
    }),
  );
  expect(ageChoices()).toHaveLength(1);
});
