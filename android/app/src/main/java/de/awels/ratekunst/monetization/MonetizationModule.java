package de.awels.ratekunst.monetization;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import androidx.annotation.NonNull;
import com.android.billingclient.api.*;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.ads.*;
import com.google.android.gms.ads.interstitial.*;
import com.google.android.ump.*;
import de.awels.ratekunst.BuildConfig;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;

/** Android-only bridge; Google Play owns the permanent, non-consumable entitlement. */
public final class MonetizationModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener {
  static final String PRODUCT = "remove_ads";
  private final Handler main = new Handler(Looper.getMainLooper());
  private final SharedPreferences preferences;
  private final ConsentInformation consent;
  private final BillingClient billing;
  private final Set<BannerView> banners = new HashSet<>();
  private boolean removed, purchaseChecked, gameActive, initialized, initializing, consentBusy;
  private boolean consentGathered, connecting;
  private final List<Promise> connectionWaiters = new ArrayList<>();
  private boolean interstitialLoading, interstitialShowing, destroyed;
  private String ageGroup, price = "";
  private InterstitialAd interstitial;
  private Promise purchasePromise;
  private int consentRevision;

  public MonetizationModule(ReactApplicationContext context) {
    super(context);
    preferences = context.getSharedPreferences("ratekunst_monetization", 0);
    ageGroup = preferences.getString("ageGroup", "");
    removed = verify(preferences.getString("receipt", ""), preferences.getString("signature", ""));
    consent = UserMessagingPlatform.getConsentInformation(context);
    billing = BillingClient.newBuilder(context)
        .setListener((result, purchases) -> main.post(() -> onPurchasesUpdated(result, purchases)))
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection().build();
    context.addLifecycleEventListener(this);
  }

  @NonNull @Override public String getName() { return "RateKunstMonetization"; }
  @ReactMethod public void addListener(String name) {}
  @ReactMethod public void removeListeners(double count) {}

  private WritableMap status() {
    WritableMap value = Arguments.createMap();
    value.putBoolean("adsRemoved", removed);
    value.putBoolean("purchaseChecked", purchaseChecked);
    value.putBoolean("adsReady", canLoadAds());
    value.putBoolean("purchaseAvailable", !BuildConfig.PLAY_BILLING_PUBLIC_KEY.isEmpty() && !price.isEmpty());
    value.putString("price", price);
    value.putString("ageGroup", ageGroup);
    value.putBoolean("privacyOptionsRequired", consent.getPrivacyOptionsRequirementStatus()
        == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED);
    return value;
  }

  private void publish() {
    if (!destroyed && getReactApplicationContext().hasActiveCatalystInstance()) {
      getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("RateKunstMonetizationChanged", status());
    }
  }

  @ReactMethod public void initialize(Promise promise) {
    main.post(() -> {
      promise.resolve(status());
      connect(null);
    });
  }

  private void connect(Promise promise) {
    if (billing.isReady()) { queryOwned(promise); return; }
    if (promise != null) connectionWaiters.add(promise);
    if (connecting) return;
    connecting = true;
    billing.startConnection(new BillingClientStateListener() {
      @Override public void onBillingSetupFinished(@NonNull BillingResult result) {
        main.post(() -> {
          connecting = false;
          List<Promise> waiters = new ArrayList<>(connectionWaiters);
          connectionWaiters.clear();
          if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
            if (waiters.isEmpty()) queryOwned(null);
            else for (Promise waiter : waiters) queryOwned(waiter);
            queryProduct(null);
          } else {
            for (Promise waiter : waiters) waiter.reject("STORE_UNAVAILABLE", result.getDebugMessage());
          }
        });
      }
      @Override public void onBillingServiceDisconnected() {}
    });
  }

  private void queryOwned(Promise promise) {
    billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder()
        .setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> main.post(() -> {
      if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
        if (promise != null) promise.reject("STORE_UNAVAILABLE", result.getDebugMessage());
        return; // Preserve verified offline entitlement; never mistake an error for a refund.
      }
      boolean owned = false;
      boolean uncertain = false;
      for (Purchase purchase : purchases) {
        if (purchase.getProducts().contains(PRODUCT)
            && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
          if (verify(purchase.getOriginalJson(), purchase.getSignature())) {
            owned = true;
            savePurchase(purchase);
          } else {
            uncertain = true; // Do not show ads over an unverified owned purchase.
          }
        }
      }
      if (uncertain) {
        purchaseChecked = false;
      }
      if (owned && purchasePromise != null) {
        purchasePromise.resolve(status());
        purchasePromise = null;
      }
      if (!uncertain) {
        removed = owned;
        purchaseChecked = true;
        if (!owned) preferences.edit().remove("receipt").remove("signature").apply();
      }
      refreshBanners();
      publish();
      if (!removed && !uncertain) gatherConsent();
      if (promise != null) {
        if (uncertain) promise.reject("VERIFICATION_FAILED", "Purchase verification is not configured or failed.");
        else promise.resolve(status());
      }
    }));
  }

  private boolean verify(String data, String signature) {
    if (data.isEmpty() || signature.isEmpty() || BuildConfig.PLAY_BILLING_PUBLIC_KEY.isEmpty()) return false;
    try {
      Signature verifier = Signature.getInstance("SHA1withRSA");
      verifier.initVerify(KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(
          Base64.decode(BuildConfig.PLAY_BILLING_PUBLIC_KEY, Base64.DEFAULT))));
      verifier.update(data.getBytes(StandardCharsets.UTF_8));
      if (!verifier.verify(Base64.decode(signature, Base64.DEFAULT))) return false;
      Purchase purchase = new Purchase(data, signature);
      return purchase.getProducts().contains(PRODUCT)
          && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED
          && new org.json.JSONObject(data).optString("packageName").equals(BuildConfig.APPLICATION_ID);
    } catch (Exception error) { return false; }
  }

  private void savePurchase(Purchase purchase) {
    removed = true;
    purchaseChecked = true;
    preferences.edit().putString("receipt", purchase.getOriginalJson())
        .putString("signature", purchase.getSignature()).apply();
    interstitial = null;
    refreshBanners();
    publish();
    if (!purchase.isAcknowledged()) {
      billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder()
          .setPurchaseToken(purchase.getPurchaseToken()).build(), result -> {
        // Failed acknowledgements are retried by queryOwned on the next foreground/restore.
      });
    }
  }

  private void queryProduct(Promise launchPromise) {
    billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(
        Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
            .setProductId(PRODUCT).setProductType(BillingClient.ProductType.INAPP).build())).build(),
        (result, products) -> main.post(() -> {
          if (result.getResponseCode() != BillingClient.BillingResponseCode.OK
              || products.getProductDetailsList().isEmpty()) {
            if (launchPromise != null) finishPurchaseError("STORE_UNAVAILABLE", "Product is unavailable.");
            return;
          }
          ProductDetails details = products.getProductDetailsList().get(0);
          List<ProductDetails.OneTimePurchaseOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
          if (offers == null || offers.isEmpty()) {
            if (launchPromise != null) finishPurchaseError("STORE_UNAVAILABLE", "Purchase option is unavailable.");
            return;
          }
          ProductDetails.OneTimePurchaseOfferDetails offer = offers.get(0);
          price = offer.getFormattedPrice();
          publish();
          if (launchPromise == null) return;
          Activity activity = getCurrentActivity();
          if (activity == null || activity.isFinishing()) {
            finishPurchaseError("NO_ACTIVITY", "No foreground activity."); return;
          }
          BillingResult launched = billing.launchBillingFlow(activity, BillingFlowParams.newBuilder()
              .setProductDetailsParamsList(Collections.singletonList(BillingFlowParams.ProductDetailsParams.newBuilder()
                  .setProductDetails(details).setOfferToken(offer.getOfferToken()).build())).build());
          if (launched.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            Promise pending = purchasePromise; purchasePromise = null; queryOwned(pending);
          } else if (launched.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            finishPurchaseError("STORE_UNAVAILABLE", launched.getDebugMessage());
          }
        }));
  }

  @ReactMethod public void purchase(Promise promise) {
    main.post(() -> {
      if (removed) { promise.resolve(status()); return; }
      if (purchasePromise != null) { promise.reject("PURCHASE_BUSY", "Purchase already in progress."); return; }
      if (!billing.isReady() || BuildConfig.PLAY_BILLING_PUBLIC_KEY.isEmpty()) {
        promise.reject("STORE_UNAVAILABLE", "Billing is unavailable or not configured."); return;
      }
      purchasePromise = promise;
      queryProduct(promise); // Fetch fresh pricing/offer tokens for every purchase.
    });
  }

  private void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
    if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
      Promise pending = purchasePromise; purchasePromise = null; queryOwned(pending); return;
    }
    if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
      finishPurchaseError("USER_CANCELED", "Purchase cancelled."); return;
    }
    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
      finishPurchaseError("STORE_UNAVAILABLE", result.getDebugMessage()); return;
    }
    for (Purchase purchase : purchases) {
      if (!purchase.getProducts().contains(PRODUCT)) continue;
      if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
        finishPurchaseError("PURCHASE_PENDING", "Payment is pending."); return;
      }
      if (!verify(purchase.getOriginalJson(), purchase.getSignature())) {
        finishPurchaseError("VERIFICATION_FAILED", "Purchase verification failed."); return;
      }
      savePurchase(purchase);
      if (purchasePromise != null) { purchasePromise.resolve(status()); purchasePromise = null; }
    }
  }

  private void finishPurchaseError(String code, String message) {
    if (purchasePromise != null) { purchasePromise.reject(code, message); purchasePromise = null; }
  }

  @ReactMethod public void restore(Promise promise) { main.post(() -> connect(promise)); }

  @ReactMethod public void setAgeGroup(String group, Promise promise) {
    main.post(() -> {
      if (!Arrays.asList("under16", "teen", "adult").contains(group)) {
        promise.reject("INVALID_AGE", "Unknown age group."); return;
      }
      ageGroup = group;
      preferences.edit().putString("ageGroup", group).apply();
      consentRevision++;
      consentBusy = false;
      consentGathered = false;
      interstitial = null;
      refreshBanners();
      publish();
      gatherConsent();
      promise.resolve(status());
    });
  }

  private void gatherConsent() {
    if (destroyed || removed || !purchaseChecked || ageGroup.isEmpty() || consentBusy || consentGathered || gameActive) return;
    Activity activity = getCurrentActivity();
    if (activity == null || activity.isFinishing()) return;
    consentBusy = true;
    final int revision = ++consentRevision;
    MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
        .setMaxAdContentRating(BuildConfig.ADMOB_MAX_AD_CONTENT_RATING)
        .setAgeRestrictedTreatment(ageGroup.equals("adult") ? AgeRestrictedTreatment.UNSPECIFIED
            : ageGroup.equals("teen") ? AgeRestrictedTreatment.TEEN : AgeRestrictedTreatment.CHILD).build());
    consent.requestConsentInfoUpdate(activity, new ConsentRequestParameters.Builder()
        .setTagForUnderAgeOfConsent(ageGroup.equals("under16")).build(), () -> {
      if (revision != consentRevision || destroyed || removed) return;
      UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity, error -> main.post(() -> finishConsent(revision)));
    }, error -> main.post(() -> finishConsent(revision)));
  }

  private void finishConsent(int revision) {
    if (revision != consentRevision || destroyed) return;
    consentBusy = false;
    consentGathered = true;
    if (removed || !consent.canRequestAds()) { publish(); return; }
    if (initialized) { refreshBanners(); loadInterstitial(); publish(); return; }
    if (initializing) return;
    initializing = true;
    MobileAds.initialize(getReactApplicationContext(), result -> main.post(() -> {
      initializing = false;
      initialized = true;
      refreshBanners();
      loadInterstitial();
      publish();
    }));
  }

  @ReactMethod public void privacyOptions(Promise promise) {
    main.post(() -> {
      Activity activity = getCurrentActivity();
      if (activity == null || gameActive || removed) { promise.resolve(status()); return; }
      interstitial = null;
      UserMessagingPlatform.showPrivacyOptionsForm(activity, error -> main.post(() -> {
        refreshBanners(); loadInterstitial(); publish();
        if (error != null) promise.reject("CONSENT_FAILED", error.getMessage());
        else promise.resolve(status());
      }));
    });
  }

  boolean canLoadAds() {
    return !destroyed && initialized && purchaseChecked && !removed && !ageGroup.isEmpty()
        && consentGathered && !consentBusy && consent.canRequestAds();
  }
  boolean canShowBanner() { return canLoadAds() && !gameActive && !interstitialShowing; }
  String bannerId() { return BuildConfig.ADMOB_BANNER_ID; }
  void attach(BannerView view) { banners.add(view); view.refresh(); }
  void detach(BannerView view) { banners.remove(view); view.destroyAd(); }
  private void refreshBanners() { for (BannerView view : new ArrayList<>(banners)) view.refresh(); }

  @ReactMethod public void setGameActive(boolean active) {
    main.post(() -> {
      gameActive = active;
      refreshBanners();
      if (!active) { gatherConsent(); loadInterstitial(); }
    });
  }

  private void loadInterstitial() {
    if (!canLoadAds() || interstitial != null || interstitialLoading || interstitialShowing) return;
    interstitialLoading = true;
    int revision = consentRevision;
    InterstitialAd.load(getReactApplicationContext(), BuildConfig.ADMOB_INTERSTITIAL_ID,
        new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
          @Override public void onAdLoaded(@NonNull InterstitialAd ad) {
            interstitialLoading = false;
            if (revision == consentRevision && canLoadAds()) interstitial = ad;
          }
          @Override public void onAdFailedToLoad(@NonNull LoadAdError error) { interstitialLoading = false; }
        });
  }

  @ReactMethod public void showInterstitial(Promise promise) {
    main.post(() -> {
      Activity activity = getCurrentActivity();
      if (!canLoadAds() || gameActive || interstitialShowing || interstitial == null
          || activity == null || activity.isFinishing() || !activity.hasWindowFocus()) {
        promise.resolve(false); loadInterstitial(); return;
      }
      InterstitialAd ad = interstitial;
      interstitial = null;
      interstitialShowing = true;
      refreshBanners();
      ad.setFullScreenContentCallback(new FullScreenContentCallback() {
        private void finished(boolean shown) {
          interstitialShowing = false;
          refreshBanners(); loadInterstitial(); promise.resolve(shown);
        }
        @Override public void onAdDismissedFullScreenContent() { finished(true); }
        @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) { finished(false); }
      });
      ad.show(activity);
    });
  }

  @Override public void onHostResume() {
    main.post(() -> { if (!destroyed) { connect(null); for (BannerView view : banners) view.resumeAd(); } });
  }
  @Override public void onHostPause() { for (BannerView view : banners) view.pauseAd(); }
  @Override public void onHostDestroy() { for (BannerView view : banners) view.destroyAd(); }
  @Override public void invalidate() {
    destroyed = true;
    getReactApplicationContext().removeLifecycleEventListener(this);
    main.post(() -> {
      billing.endConnection();
      for (BannerView view : banners) view.destroyAd();
      banners.clear();
      interstitial = null;
      finishPurchaseError("APP_CLOSED", "App closed.");
    });
    super.invalidate();
  }
}
