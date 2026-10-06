package de.awels.ratekunst.monetization;

import android.view.Gravity;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import com.facebook.react.uimanager.ThemedReactContext;
import com.google.android.gms.ads.*;

/** Fixed-size bottom banner: no overlays, expansion, or clickable app controls nearby. */
public final class BannerView extends FrameLayout {
  private final MonetizationModule module;
  private AdView ad;
  // ReactViewGroup intentionally swallows requestLayout(). AdMob adds/updates
  // its Android children asynchronously, outside React Native's Yoga layout.
  private final Runnable layoutAd = this::layoutAdChildren;
  private void layoutAdChildren() {
    if (ad == null || getWidth() <= 0 || getHeight() <= 0) return;
    measure(MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
    layout(getLeft(), getTop(), getRight(), getBottom());
    if (module != null) module.bannerSize(ad.getWidth(), ad.getHeight());
  }

  public BannerView(ThemedReactContext context) {
    super(context);
    module = context.getNativeModule(MonetizationModule.class);
  }

  @Override protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (module != null) module.attach(this);
  }
  @Override protected void onDetachedFromWindow() {
    removeCallbacks(layoutAd);
    if (module != null) module.detach(this);
    super.onDetachedFromWindow();
  }
  @Override public void requestLayout() {
    super.requestLayout();
    // requestLayout can be called by the superclass constructor before fields
    // are initialized. Coalesce later requests from the ad's own child tree.
    if (layoutAd != null) { removeCallbacks(layoutAd); post(layoutAd); }
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
    final AdView loadingAd = ad;
    ad.setAdListener(new AdListener() {
      @Override public void onAdLoaded() {
        if (ad != loadingAd) return;
        module.bannerResult("loaded", "");
        requestLayout();
      }
      @Override public void onAdFailedToLoad(@NonNull LoadAdError error) {
        if (ad == loadingAd) module.bannerResult("failed", MonetizationModule.adError(error));
      }
    });
    addView(ad, new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.CENTER));
    module.bannerResult("loading", "");
    ad.loadAd(new AdRequest.Builder().build());
  }
  void destroyAd() {
    removeCallbacks(layoutAd);
    if (ad != null) { removeView(ad); ad.destroy(); ad = null; }
  }
  void pauseAd() { if (ad != null) ad.pause(); }
  void resumeAd() { if (ad != null) ad.resume(); }
}
