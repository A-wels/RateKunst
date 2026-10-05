import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TUTORIAL_SEEN_KEY = '@ratekunst/tutorial-seen';

export const useTutorial = () => {
  const [visible, setVisible] = React.useState(false);
  const interacted = React.useRef(false);

  React.useEffect(() => {
    let active = true;
    AsyncStorage.getItem(TUTORIAL_SEEN_KEY)
      .then(seen => {
        if (active && !interacted.current && seen !== '1') {
          setVisible(true);
        }
      })
      .catch(error => console.warn('Could not load tutorial state', error));
    return () => {
      active = false;
    };
  }, []);

  const open = () => {
    interacted.current = true;
    setVisible(true);
  };
  const close = () => {
    interacted.current = true;
    setVisible(false);
    AsyncStorage.setItem(TUTORIAL_SEEN_KEY, '1').catch(error =>
      console.warn('Could not save tutorial state', error),
    );
  };

  return {visible, open, close};
};
