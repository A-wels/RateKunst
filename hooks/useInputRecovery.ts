import React from 'react';
import {AppState, Platform, UIManager} from 'react-native';

const InputRecoveryContext = React.createContext(0);

// Release native interception and give scroll containers a new gesture stream.
// Their parent screens retain form, navigation and game state.
export const useInputRecovery = () => {
  const [generation, setGeneration] = React.useState(0);
  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    let interrupted = false;
    const markInterrupted = () => {
      interrupted = true;
    };
    const recover = () => {
      if (!interrupted) {
        return;
      }
      interrupted = false;
      // Exported by RN 0.72's legacy UIManager, but omitted from its TS types.
      const manager = UIManager as typeof UIManager & {
        clearJSResponder?: () => void;
      };
      manager.clearJSResponder?.();
      setGeneration(current => current + 1);
    };
    const subscriptions = [
      AppState.addEventListener('blur', markInterrupted),
      AppState.addEventListener('focus', recover),
      AppState.addEventListener('change', state => {
        if (state === 'active') {
          recover();
        } else {
          markInterrupted();
        }
      }),
    ];
    return () => subscriptions.forEach(subscription => subscription.remove());
  }, []);
  return generation;
};

export const InputRecoveryProvider = ({children}: React.PropsWithChildren) =>
  React.createElement(
    InputRecoveryContext.Provider,
    {value: useInputRecovery()},
    children,
  );

export const useInputRecoveryGeneration = () =>
  React.useContext(InputRecoveryContext);
