import React from 'react';
import {Platform, ScrollView, ScrollViewProps} from 'react-native';
import {useInputRecoveryGeneration} from '../hooks/useInputRecovery';

// RN 0.72 keeps touch/momentum capture state inside each ScrollView. Recreate
// that container after interrupted Android input, keeping parent-owned content
// and the last scroll offset. Do not remount the screen or navigator.
const RecoverableScrollView = React.forwardRef<ScrollView, ScrollViewProps>(
  (props, ref) => {
    const generation = useInputRecoveryGeneration();
    const offset = React.useRef(props.contentOffset ?? {x: 0, y: 0});
    if (Platform.OS !== 'android') {
      return <ScrollView {...props} ref={ref} />;
    }
    return (
      <ScrollView
        {...props}
        key={generation}
        ref={ref}
        contentOffset={offset.current}
        scrollEventThrottle={props.scrollEventThrottle ?? 32}
        onScroll={event => {
          offset.current = event.nativeEvent.contentOffset;
          props.onScroll?.(event);
        }}
      />
    );
  },
);
RecoverableScrollView.displayName = 'RecoverableScrollView';

export default RecoverableScrollView;
