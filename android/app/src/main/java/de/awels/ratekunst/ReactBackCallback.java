package de.awels.ratekunst;

import androidx.activity.OnBackPressedCallback;

/** Routes modern Android back events into RN 0.72's legacy JS back handler. */
final class ReactBackCallback extends OnBackPressedCallback {
  private final Runnable reactBack;

  ReactBackCallback(Runnable reactBack) {
    super(true);
    this.reactBack = reactBack;
  }

  @Override public void handleOnBackPressed() {
    withoutCallback(reactBack);
  }

  void withoutCallback(Runnable action) {
    // The legacy fallback also uses this dispatcher. Disable this bridge while
    // falling through so it cannot call itself recursively at the root screen.
    boolean wasEnabled = isEnabled();
    setEnabled(false);
    try { action.run(); }
    finally { setEnabled(wasEnabled); }
  }
}
