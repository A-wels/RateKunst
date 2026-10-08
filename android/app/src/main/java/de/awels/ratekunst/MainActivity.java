package de.awels.ratekunst;

import android.os.Bundle;
import android.view.MotionEvent;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

public class MainActivity extends ReactActivity {

  private MotionEvent pendingTouch;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // react-native-screens must rebuild its fragments from React state rather
    // than restore native fragments with stale React view references.
    super.onCreate(null);
  }

  @Override
  public boolean dispatchTouchEvent(MotionEvent event) {
    clearPendingTouch();
    int action = event.getActionMasked();
    if (action != MotionEvent.ACTION_UP && action != MotionEvent.ACTION_CANCEL) {
      pendingTouch = MotionEvent.obtain(event);
    }
    return super.dispatchTouchEvent(event);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    if (!hasFocus) {
      cancelInterruptedTouch();
    }
    super.onWindowFocusChanged(hasFocus);
  }

  @Override
  protected void onPause() {
    // Send CANCEL before React is paused, so Pressability and the native touch
    // dispatcher both release a gesture interrupted by Home, lock or a dialog.
    cancelInterruptedTouch();
    super.onPause();
  }

  private void cancelInterruptedTouch() {
    if (pendingTouch == null) {
      return;
    }
    MotionEvent cancel = pendingTouch;
    pendingTouch = null;
    cancel.setAction(MotionEvent.ACTION_CANCEL);
    try {
      super.dispatchTouchEvent(cancel);
    } finally {
      cancel.recycle();
    }
  }

  private void clearPendingTouch() {
    if (pendingTouch != null) {
      pendingTouch.recycle();
      pendingTouch = null;
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "RateKunst";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(this, getMainComponentName());
  }
}
