import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {Appearance, useColorScheme} from 'react-native';
import {darkColors, lightColors, ThemeColors} from '../constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_KEY = '@ratekunst/theme';

type ThemeValue = {
  preference: ThemePreference;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  setPreference: (preference: ThemePreference) => void;
};

// A light fallback also lets isolated controls render outside the app provider.
const ThemeContext = React.createContext<ThemeValue>({
  preference: 'system',
  mode: 'light',
  colors: lightColors,
  setPreference: () => {},
});

export const ThemeProvider = ({children}: React.PropsWithChildren) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    React.useState<ThemePreference>('system');
  const chosen = React.useRef(false);
  const saveQueue = React.useRef<Promise<void>>(Promise.resolve());

  React.useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_KEY)
      .then(saved => {
        if (
          active &&
          !chosen.current &&
          (saved === 'system' || saved === 'light' || saved === 'dark')
        ) {
          setPreferenceState(saved);
        }
      })
      .catch(error => console.warn('Could not load theme', error));
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    // Native alerts and keyboard appearance follow the same preference.
    // null restores real OS tracking after a manual override.
    Appearance.setColorScheme(preference === 'system' ? null : preference);
  }, [preference]);

  const setPreference = React.useCallback((next: ThemePreference) => {
    chosen.current = true;
    setPreferenceState(next);
    saveQueue.current = saveQueue.current
      .then(() => AsyncStorage.setItem(THEME_KEY, next))
      .catch(error => console.warn('Could not persist theme', error));
  }, []);

  const mode =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;
  const value = React.useMemo(
    () => ({
      preference,
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
      setPreference,
    }),
    [preference, mode, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);

export const useThemedStyles = <T,>(
  createStyles: (colors: ThemeColors) => T,
) => {
  const {colors} = useTheme();
  return React.useMemo(() => createStyles(colors), [colors, createStyles]);
};
