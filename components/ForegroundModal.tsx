import React from 'react';
import {AppState, Modal, ModalProps} from 'react-native';

// RN 0.72 Android modals own a separate Dialog window. Release that window
// while backgrounded, and create a fresh one on resume. State belongs to the
// caller (tutorial step, search and selection), not to the native window.
const ForegroundModal = ({visible, ...props}: ModalProps) => {
  const [foreground, setForeground] = React.useState(
    AppState.currentState == null || AppState.currentState === 'active',
  );
  const [generation, setGeneration] = React.useState(0);

  React.useEffect(() => {
    let active =
      AppState.currentState == null || AppState.currentState === 'active';
    const subscription = AppState.addEventListener('change', state => {
      const nextActive = state === 'active';
      if (nextActive && !active) {
        // Also remount when rapid lifecycle events are batched together.
        setGeneration(current => current + 1);
      }
      active = nextActive;
      setForeground(nextActive);
    });
    return () => subscription.remove();
  }, []);

  if (!visible || !foreground) {
    return null;
  }

  return <Modal {...props} key={generation} visible />;
};

export default ForegroundModal;
