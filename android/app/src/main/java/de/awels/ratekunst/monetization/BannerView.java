package de.awels.ratekunst.monetization;

import android.view.Gravity;
import android.widget.FrameLayout;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.android.gms.ads.*;

/** Fixed-size bottom banner: no overlays, expansion, or clickable app controls nearby. */
public final class BannerView extends FrameLayout {
  private final MonetizationModule module;
  private AdView ad;

  public BannerView(ThemedReactContext context) {
    super(context);
    module = context.getNativeModule(MonetizationModule.class);
  }

  @Override protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (module != null) module.attach(this);
  }
  @Override protected void onDetachedFromWindow() {
    if (module != null) module.detach(this);
    super.onDetachedFromWindow();
  }
  @Override public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    refresh();
  }
  void refresh() {
    if (module == null || !module.canShowBanner() || !hasWindowFocus()) { destroyAd(); return; }
    if (ad != null) return;
    ad = new AdView(getContext());
    ad.setAdSize(AdSize.BANNER);
    ad.setAdUnitId(module.bannerId());
    addView(ad, new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER));
    ad.loadAd(new AdRequest.Builder().build());
  }
  void destroyAd() {
    if (ad != null) { removeView(ad); ad.destroy(); ad = null; }
  }
  void pauseAd() { if (ad != null) ad.pause(); }
  void resumeAd() { if (ad != null) ad.resume(); }
}
