package de.awels.ratekunst.monetization;

import androidx.annotation.NonNull;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.*;
import com.facebook.react.uimanager.*;
import java.util.*;

public final class MonetizationPackage implements ReactPackage {
  @NonNull @Override public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext context) {
    return Collections.singletonList(new MonetizationModule(context));
  }
  @NonNull @Override public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext context) {
    return Collections.singletonList(new SimpleViewManager<BannerView>() {
      @NonNull @Override public String getName() { return "RateKunstBanner"; }
      @NonNull @Override protected BannerView createViewInstance(@NonNull ThemedReactContext viewContext) {
        return new BannerView(viewContext);
      }
      @Override public void onDropViewInstance(@NonNull BannerView view) {
        view.destroyAd();
        super.onDropViewInstance(view);
      }
    });
  }
}
