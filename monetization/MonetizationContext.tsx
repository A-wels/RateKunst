import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {NativeEventEmitter} from 'react-native';

import {
  AgeGroup,
  MonetizationStatus,
  nativeMonetization as native,
} from './native';
export type {AgeGroup, MonetizationStatus} from './native';

const initialStatus: MonetizationStatus = {
  adsRemoved: false,
  purchaseChecked: false,
  adsReady: false,
  purchaseAvailable: false,
  price: '',
  ageGroup: '',
  privacyOptionsRequired: false,
};
const ROUNDS_KEY = '@ratekunst/completed-rounds';
type MonetizationValue = MonetizationStatus & {
  available: boolean;
  gameActive: boolean;
  busy: boolean;
  setGameActive: (active: boolean) => void;
  completeRound: () => void;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  setAgeGroup: (group: AgeGroup) => Promise<void>;
  privacyOptions: () => Promise<void>;
  retryAds: () => Promise<void>;
};

const MonetizationContext = React.createContext<MonetizationValue>({
  ...initialStatus,
  available: false,
  gameActive: false,
  busy: false,
  setGameActive: () => {},
  completeRound: () => {},
  purchase: async () => {},
  restore: async () => {},
  setAgeGroup: async () => {},
  privacyOptions: async () => {},
  retryAds: async () => {},
});

export const MonetizationProvider = ({children}: React.PropsWithChildren) => {
  const [status, setStatus] = React.useState(initialStatus);
  const [gameActive, setGameActiveState] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const statusRef = React.useRef(status);
  statusRef.current = status;
  const activeGame = React.useRef(false);
  const gameEpoch = React.useRef(0);
  const pendingBreak = React.useRef(false);
  const writeQueue = React.useRef<Promise<void>>(Promise.resolve());
  const showing = React.useRef(false);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    if (!native) {
      return;
    }
    let eventReceived = false;
    const subscription = new NativeEventEmitter(native).addListener(
      'RateKunstMonetizationChanged',
      (next: MonetizationStatus) => {
        eventReceived = true;
        if (mounted.current) {
          statusRef.current = next;
          setStatus(next);
        }
      },
    );
    native
      .initialize()
      .then(next => {
        if (mounted.current && !eventReceived) {
          statusRef.current = next;
          setStatus(next);
        }
      })
      .catch(error => console.warn('Could not initialize monetization', error));
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, []);

  const showAtBreak = React.useCallback(() => {
    if (
      !pendingBreak.current ||
      activeGame.current ||
      showing.current ||
      !native
    ) {
      return;
    }
    pendingBreak.current = false;
    if (statusRef.current.adsRemoved || !statusRef.current.adsReady) {
      return;
    }
    // Attempt only at this completed-round transition. Never show a delayed ad
    // when inventory loads later or when a new game starts.
    showing.current = true;
    native
      .showInterstitial()
      .catch(error => console.warn('Could not show interstitial', error))
      .finally(() => {
        showing.current = false;
      });
  }, []);

  const setGameActive = React.useCallback(
    (active: boolean) => {
      activeGame.current = active;
      setGameActiveState(active);
      native?.setGameActive(active);
      if (active) {
        gameEpoch.current++;
        pendingBreak.current = false;
      } else {
        showAtBreak();
      }
    },
    [showAtBreak],
  );

  const completeRound = React.useCallback(() => {
    if (!native || statusRef.current.adsRemoved) {
      return;
    }
    const completedEpoch = gameEpoch.current;
    writeQueue.current = writeQueue.current
      .then(async () => {
        const saved = Number(await AsyncStorage.getItem(ROUNDS_KEY));
        const completed =
          (Number.isSafeInteger(saved) && saved >= 0 ? saved : 0) + 1;
        await AsyncStorage.setItem(ROUNDS_KEY, String(completed));
        if (
          completed % 2 === 0 &&
          gameEpoch.current === completedEpoch &&
          mounted.current &&
          !statusRef.current.adsRemoved
        ) {
          pendingBreak.current = true;
          showAtBreak();
        }
      })
      .catch(error =>
        console.warn('Could not save completed round count', error),
      );
  }, [showAtBreak]);

  const runAction = React.useCallback(
    async (action: () => Promise<MonetizationStatus>) => {
      setBusy(true);
      try {
        const next = await action();
        if (mounted.current) {
          statusRef.current = next;
          setStatus(next);
        }
      } finally {
        if (mounted.current) {
          setBusy(false);
        }
      }
    },
    [],
  );

  const value: MonetizationValue = {
    ...status,
    available: !!native,
    gameActive,
    busy,
    setGameActive,
    completeRound,
    purchase: () =>
      native ? runAction(() => native!.purchase()) : Promise.resolve(),
    restore: () =>
      native ? runAction(() => native!.restore()) : Promise.resolve(),
    setAgeGroup: group =>
      native ? runAction(() => native!.setAgeGroup(group)) : Promise.resolve(),
    privacyOptions: () =>
      native ? runAction(() => native!.privacyOptions()) : Promise.resolve(),
    retryAds: () =>
      native ? runAction(() => native!.retryAds()) : Promise.resolve(),
  };
  return (
    <MonetizationContext.Provider value={value}>
      {children}
    </MonetizationContext.Provider>
  );
};

export const useMonetization = () => React.useContext(MonetizationContext);
