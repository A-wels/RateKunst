package de.awels.ratekunst.monetization;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Base64;
import androidx.annotation.NonNull;
import com.android.billingclient.api.*;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.module.annotations.ReactModule;
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
@ReactModule(name = MonetizationModule.NAME)
public final class MonetizationModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener {
  public static final String NAME = "RateKunstMonetization";
  static final String PRODUCT = "remove_ads";
  static final String PURCHASE_OPTION = "standard";
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
  private boolean productLoading;
  private String productError = "";
  private InterstitialAd interstitial;
  private Promise purchasePromise;
  private int consentRevision;
  private int gameBreakRevision;
  private String billingError = "", consentError = "", bannerError = "", interstitialError = "";
  private String bannerState = "idle", interstitialState = "idle", bannerSize = "";
  private String interstitialShowError = "", interstitialSkipReason = "";

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

  @NonNull @Override public String getName() { return NAME; }
  @ReactMethod public void addListener(String name) {}
  @ReactMethod public void removeListeners(double count) {}

  private WritableMap status() {
    WritableMap value = Arguments.createMap();
    value.putBoolean("adsRemoved", removed);
    value.putBoolean("purchaseChecked", purchaseChecked);
    value.putBoolean("adsReady", canLoadAds());
    value.putBoolean("purchaseAvailable", !BuildConfig.PLAY_BILLING_PUBLIC_KEY.isEmpty() && !price.isEmpty());
    value.putString("price", price);
    value.putBoolean("productLoading", productLoading);
    value.putString("productError", productError);
    value.putString("ageGroup", ageGroup);
    value.putBoolean("privacyOptionsRequired", consent.getPrivacyOptionsRequirementStatus()
        == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED);
    WritableMap diagnostics = Arguments.createMap();
    diagnostics.putString("version", BuildConfig.VERSION_NAME + " (" + BuildConfig.VERSION_CODE + ")");
    diagnostics.putString("bannerId", BuildConfig.ADMOB_BANNER_ID);
    diagnostics.putString("interstitialId", BuildConfig.ADMOB_INTERSTITIAL_ID);
    diagnostics.putString("adContentRating", maxAdContentRating(ageGroup, BuildConfig.ADMOB_MAX_AD_CONTENT_RATING));
    diagnostics.putBoolean("ageProtected", needsAgeProtection(ageGroup));
    diagnostics.putBoolean("consentBusy", consentBusy);
    diagnostics.putInt("consentStatus", consent.getConsentStatus());
    diagnostics.putBoolean("consentFormAvailable", consent.isConsentFormAvailable());
    diagnostics.putString("billingError", billingError);
    diagnostics.putString("productId", PRODUCT);
    diagnostics.putString("purchaseOptionId", PURCHASE_OPTION);
    diagnostics.putString("productError", productError);
    diagnostics.putString("consentError", consentError);
    diagnostics.putString("bannerState", bannerState);
    diagnostics.putString("bannerSize", bannerSize);
    diagnostics.putString("bannerError", bannerError);
    diagnostics.putString("interstitialState", interstitialState);
    diagnostics.putString("interstitialError", interstitialError);
    diagnostics.putString("interstitialShowError", interstitialShowError);
    diagnostics.putString("interstitialSkipReason", interstitialSkipReason);
    value.putMap("diagnostics", diagnostics);
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
    if (billing.isReady()) { queryOwned(promise); queryProduct(null); return; }
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
            billingError = "";
            if (waiters.isEmpty()) queryOwned(null);
            else for (Promise waiter : waiters) queryOwned(waiter);
            queryProduct(null);
          } else {
            billingError = "Connection " + result.getResponseCode() + ": " + result.getDebugMessage();
            publish();
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
        billingError = "Ownership " + result.getResponseCode() + ": " + result.getDebugMessage();
        publish();
        if (promise != null) promise.reject("STORE_UNAVAILABLE", result.getDebugMessage());
        return; // Preserve verified offline entitlement; never mistake an error for a refund.
      }
      boolean owned = false;
      billingError = "";
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
        billingError = "Purchase signature verification failed.";
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

  // Prefer the configured regular buy option; never select a different named
  // option simply because Google returned it first. A legacy unnamed default
  // offer is supported only when it is the sole returned, non-promotional offer.
  static int standardOfferIndex(List<String> optionIds, List<String> offerIds) {
    int standard = -1;
    for (int i = 0; i < optionIds.size(); i++) {
      if (!PURCHASE_OPTION.equals(optionIds.get(i))) continue;
      if (offerIds.get(i) == null || offerIds.get(i).isEmpty()) return i;
      if (standard < 0) standard = i;
    }
    if (standard >= 0) return standard;
    if (optionIds.size() == 1 && (optionIds.get(0) == null || optionIds.get(0).isEmpty())
        && (offerIds.get(0) == null || offerIds.get(0).isEmpty())) return 0;
    return -1;
  }

  @ReactMethod public void refreshProducts(Promise promise) {
    main.post(() -> {
      if (removed) { promise.resolve(status()); return; }
      if (!billing.isReady()) { connect(promise); return; }
      queryProduct(null, promise);
    });
  }

  private void queryProduct(Promise launchPromise) { queryProduct(launchPromise, null); }

  private void productFailure(String message, Promise launchPromise, Promise refreshPromise) {
    price = "";
    productError = message;
    publish();
    if (launchPromise != null) finishPurchaseError("STORE_UNAVAILABLE", message);
    if (refreshPromise != null) refreshPromise.resolve(status());
  }

  private void queryProduct(Promise launchPromise, Promise refreshPromise) {
    if (productLoading || (launchPromise == null && purchasePromise != null)) {
      if (refreshPromise != null) refreshPromise.resolve(status());
      if (launchPromise != null) finishPurchaseError("PURCHASE_BUSY", "Product query in progress.");
      return;
    }
    productLoading = true;
    productError = "";
    publish();
    billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(
        Collections.singletonList(QueryProductDetailsParams.Product.newBuilder()
            .setProductId(PRODUCT).setProductType(BillingClient.ProductType.INAPP).build())).build(),
        (result, products) -> main.post(() -> {
          productLoading = false;
          if (destroyed) return;
          if (result.getResponseCode() != BillingClient.BillingResponseCode.OK
              || products.getProductDetailsList().isEmpty()) {
            StringBuilder message = new StringBuilder("Product query ")
                .append(result.getResponseCode()).append(": ").append(result.getDebugMessage());
            for (UnfetchedProduct product : products.getUnfetchedProductList()) {
              message.append("; ").append(product.getProductId())
                  .append(" status=").append(product.getStatusCode());
            }
            productFailure(message.toString(), launchPromise, refreshPromise);
            return;
          }
          ProductDetails details = null;
          for (ProductDetails candidate : products.getProductDetailsList()) {
            if (PRODUCT.equals(candidate.getProductId())) { details = candidate; break; }
          }
          if (details == null) {
            productFailure("Google Play did not return " + PRODUCT + ".", launchPromise, refreshPromise);
            return;
          }
          List<ProductDetails.OneTimePurchaseOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
          if (offers == null || offers.isEmpty()) {
            ProductDetails.OneTimePurchaseOfferDetails legacy = details.getOneTimePurchaseOfferDetails();
            offers = legacy == null ? Collections.emptyList() : Collections.singletonList(legacy);
          }
          List<ProductDetails.OneTimePurchaseOfferDetails> buyOffers = new ArrayList<>();
          List<String> optionIds = new ArrayList<>(), offerIds = new ArrayList<>();
          for (ProductDetails.OneTimePurchaseOfferDetails offer : offers) {
            if (offer.getRentalDetails() != null) continue;
            buyOffers.add(offer);
            optionIds.add(offer.getPurchaseOptionId());
            offerIds.add(offer.getOfferId());
          }
          int selected = standardOfferIndex(optionIds, offerIds);
          if (selected < 0) {
            productFailure("No eligible buy option " + PURCHASE_OPTION + " for " + PRODUCT
                + "; returned options=" + optionIds, launchPromise, refreshPromise);
            return;
          }
          ProductDetails.OneTimePurchaseOfferDetails offer = buyOffers.get(selected);
          price = offer.getFormattedPrice();
          publish();
          if (refreshPromise != null) refreshPromise.resolve(status());
          if (launchPromise == null) return;
          Activity activity = getCurrentActivity();
          if (activity == null || activity.isFinishing()) {
            finishPurchaseError("NO_ACTIVITY", "No foreground activity."); return;
          }
          BillingFlowParams.ProductDetailsParams.Builder selectedOffer =
              BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details);
          if (offer.getOfferToken() != null && !offer.getOfferToken().isEmpty()) {
            selectedOffer.setOfferToken(offer.getOfferToken());
          }
          BillingResult launched = billing.launchBillingFlow(activity, BillingFlowParams.newBuilder()
              .setProductDetailsParamsList(Collections.singletonList(selectedOffer.build())).build());
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

  @ReactMethod public void retryAds(Promise promise) {
    main.post(() -> {
      if (destroyed || removed || gameActive || consentBusy || initializing || connecting) {
        promise.resolve(status()); return;
      }
      consentGathered = false;
      consentRevision++;
      interstitial = null;
      bannerState = "idle";
      bannerError = "";
      bannerSize = "";
      interstitialError = "";
      for (BannerView view : new ArrayList<>(banners)) view.destroyAd();
      publish();
      // Recheck ownership and UMP. Never reset a saved consent decision or
      // enable ads by bypassing either gate merely to retry an ad request.
      connect(promise);
    });
  }

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

  static boolean needsAgeProtection(String group) {
    // Unknown age receives the same conservative treatment as the youngest group.
    return !"adult".equals(group) && !"teen".equals(group);
  }

  static String maxAdContentRating(String group, String configuredRating) {
    return needsAgeProtection(group) ? RequestConfiguration.MAX_AD_CONTENT_RATING_G : configuredRating;
  }

  private void gatherConsent() {
    if (destroyed || removed || !purchaseChecked || consentBusy || consentGathered || gameActive) return;
    Activity activity = getCurrentActivity();
    if (activity == null || activity.isFinishing()) return;
    consentBusy = true;
    consentError = "";
    publish();
    final int revision = ++consentRevision;
    MobileAds.setRequestConfiguration(new RequestConfiguration.Builder()
        .setMaxAdContentRating(maxAdContentRating(ageGroup, BuildConfig.ADMOB_MAX_AD_CONTENT_RATING))
        .setAgeRestrictedTreatment(ageGroup.equals("adult") ? AgeRestrictedTreatment.UNSPECIFIED
            : ageGroup.equals("teen") ? AgeRestrictedTreatment.TEEN : AgeRestrictedTreatment.CHILD).build());
    consent.requestConsentInfoUpdate(activity, new ConsentRequestParameters.Builder()
        .setTagForUnderAgeOfConsent(needsAgeProtection(ageGroup)).build(), () -> {
      if (revision != consentRevision || destroyed || removed) return;
      UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity,
          error -> main.post(() -> finishConsent(revision, error)));
    }, error -> main.post(() -> finishConsent(revision, error)));
  }

  private void finishConsent(int revision, FormError error) {
    if (revision != consentRevision || destroyed) return;
    consentBusy = false;
    consentError = error == null ? "" : error.getErrorCode() + ": " + error.getMessage();
    // A valid previous UMP decision may still allow ads after a network error.
    // Otherwise allow a later foreground/manual attempt instead of latching
    // an unsuccessful first consent request for the entire app session.
    consentGathered = error == null || consent.canRequestAds();
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
        consentError = error == null ? "" : error.getErrorCode() + ": " + error.getMessage();
        refreshBanners(); loadInterstitial(); publish();
        if (error != null) promise.reject("CONSENT_FAILED", error.getMessage());
        else promise.resolve(status());
      }));
    });
  }

  boolean canLoadAds() {
    return !destroyed && initialized && purchaseChecked && !removed
        && consentGathered && !consentBusy && consent.canRequestAds();
  }
  boolean canShowBanner() { return canLoadAds() && !gameActive && !interstitialShowing; }
  String bannerId() { return BuildConfig.ADMOB_BANNER_ID; }
  static String adError(AdError error) {
    return error.getDomain() + " / " + error.getCode() + ": " + error.getMessage();
  }
  void bannerResult(String state, String error) {
    bannerState = state; bannerError = error; publish();
  }
  void bannerSize(int width, int height) {
    String size = width + " × " + height + " px";
    if (!size.equals(bannerSize)) { bannerSize = size; publish(); }
  }
  void attach(BannerView view) { banners.add(view); view.refresh(); }
  void detach(BannerView view) { banners.remove(view); view.destroyAd(); }
  private void refreshBanners() { for (BannerView view : new ArrayList<>(banners)) view.refresh(); }

  @ReactMethod public void setGameActive(boolean active) {
    main.post(() -> {
      if (active) gameBreakRevision++;
      gameActive = active;
      refreshBanners();
      if (!active) gatherConsent();
      // Retry a failed preload at game start as well as at the menu. Loading
      // during a game is allowed; display is still restricted to game breaks.
      loadInterstitial();
    });
  }

  private void loadInterstitial() {
    if (!canLoadAds() || interstitial != null || interstitialLoading || interstitialShowing) return;
    interstitialLoading = true;
    interstitialState = "loading";
    interstitialError = "";
    publish();
    int revision = consentRevision;
    InterstitialAd.load(getReactApplicationContext(), BuildConfig.ADMOB_INTERSTITIAL_ID,
        new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
          @Override public void onAdLoaded(@NonNull InterstitialAd ad) {
            interstitialLoading = false;
            if (revision == consentRevision && canLoadAds()) {
              interstitial = ad; interstitialState = "loaded"; publish();
            } else loadInterstitial();
          }
          @Override public void onAdFailedToLoad(@NonNull LoadAdError error) {
            interstitialLoading = false;
            if (revision == consentRevision) {
              interstitialState = "failed"; interstitialError = adError(error); publish();
            } else loadInterstitial();
          }
        });
  }

  @ReactMethod public void showInterstitial(Promise promise) {
    main.post(() -> {
      interstitialShowError = "";
      interstitialSkipReason = "";
      showInterstitialAtBreak(promise, new InterstitialBreak(gameBreakRevision,
          consentRevision, SystemClock.uptimeMillis() + 1000));
    });
  }

  private void showInterstitialAtBreak(Promise promise, InterstitialBreak gameBreak) {
    Activity activity = getCurrentActivity();
    boolean eligible = canLoadAds() && !gameActive && !interstitialShowing && interstitial != null
        && activity != null && !activity.isFinishing() && !activity.isDestroyed();
    InterstitialBreak.Decision decision = gameBreak.decide(SystemClock.uptimeMillis(),
        gameBreakRevision, consentRevision, eligible, activity != null && activity.hasWindowFocus());
    if (decision == InterstitialBreak.Decision.WAIT) {
      // The winner alert's button callback can run before Android restores
      // focus. Wait only for that dismissal, with a deadline and cancellation.
      main.postDelayed(() -> showInterstitialAtBreak(promise, gameBreak), 50);
      return;
    }
    if (decision == InterstitialBreak.Decision.SKIP) {
      interstitialSkipReason = !eligible ? "No eligible loaded ad at the completed-game break."
          : "Game break cancelled or window focus was not restored within one second.";
      publish();
      promise.resolve(false); loadInterstitial(); return;
    }
    InterstitialAd ad = interstitial;
    interstitial = null;
    interstitialShowing = true;
    refreshBanners();
    ad.setFullScreenContentCallback(new FullScreenContentCallback() {
      private void finished(boolean shown) {
        interstitialShowing = false;
        interstitialState = "idle";
        refreshBanners(); loadInterstitial(); promise.resolve(shown);
      }
      @Override public void onAdShowedFullScreenContent() { publish(); }
      @Override public void onAdDismissedFullScreenContent() { finished(true); }
      @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error) {
        interstitialShowError = adError(error);
        publish();
        finished(false);
      }
    });
    ad.show(activity);
  }

  @Override public void onHostResume() {
    main.post(() -> { if (!destroyed) { connect(null); for (BannerView view : banners) view.resumeAd(); } });
  }
  @Override public void onHostPause() {
    gameBreakRevision++;
    for (BannerView view : banners) view.pauseAd();
  }
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
