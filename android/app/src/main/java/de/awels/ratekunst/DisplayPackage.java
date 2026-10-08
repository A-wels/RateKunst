package de.awels.ratekunst;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import androidx.annotation.NonNull;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.uimanager.ViewManager;
import java.util.Collections;
import java.util.List;

/** Route-owned orientation for the Android JavaScript stack. */
public final class DisplayPackage implements ReactPackage {
  @NonNull @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext context) {
    return Collections.singletonList(new DisplayModule(context));
  }

  @NonNull @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext context) {
    return Collections.emptyList();
  }

  private static final class DisplayModule extends ReactContextBaseJavaModule
      implements LifecycleEventListener {
    private boolean gameActive;

    DisplayModule(ReactApplicationContext context) {
      super(context);
      context.addLifecycleEventListener(this);
    }

    @NonNull @Override public String getName() { return "RateKunstDisplay"; }

    @ReactMethod public void setGameActive(boolean active) {
      UiThreadUtil.runOnUiThread(() -> {
        gameActive = active;
        applyOrientation();
      });
    }

    private void applyOrientation() {
      Activity activity = getReactApplicationContext().getCurrentActivity();
      if (activity == null || activity.isFinishing() || activity.isDestroyed()) return;
      int orientation = gameActive ? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
          : ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED;
      if (activity.getRequestedOrientation() != orientation) {
        activity.setRequestedOrientation(orientation);
      }
    }

    @Override public void onHostResume() { UiThreadUtil.runOnUiThread(this::applyOrientation); }
    @Override public void onHostPause() {}
    @Override public void onHostDestroy() {}
    @Override public void invalidate() {
      getReactApplicationContext().removeLifecycleEventListener(this);
      super.invalidate();
    }
  }
}
