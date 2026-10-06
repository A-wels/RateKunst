import React from 'react';
import {AppState, Platform, UIManager} from 'react-native';

// The legacy renderer's native responder can keep intercepting the content
// after a gesture is interrupted. Release that intercept on return. This does
// not remount screens or change form/game state.
export const useInputRecovery = () => {
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
};
