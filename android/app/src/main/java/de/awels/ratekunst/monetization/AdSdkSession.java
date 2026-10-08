package de.awels.ratekunst.monetization;

/** Owns the irreversible boundary between a live ads session and ad-free use. */
final class AdSdkSession {
  private boolean touched;
  private boolean disabled;

  boolean begin(boolean purchaseChecked, boolean owned) {
    if (!purchaseChecked || owned || disabled) return false;
    touched = true;
    return true;
  }

  boolean disable() {
    disabled = true;
    return touched;
  }

  void revoke() { disabled = false; }
  boolean isDisabled() { return disabled; }
}
