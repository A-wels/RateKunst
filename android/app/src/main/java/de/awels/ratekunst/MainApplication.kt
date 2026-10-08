package de.awels.ratekunst

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import de.awels.ratekunst.monetization.MonetizationPackage

class MainApplication : Application(), ReactApplication {
  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(applicationContext, PackageList(this).packages.apply {
      add(MonetizationPackage())
      add(DisplayPackage())
    })
  }

  override fun onCreate() {
    super.onCreate()
    // The short-lived restart process never loads React or advertising libraries.
    if (!AdFreeRestartActivity.isRestartProcess(this)) loadReactNative(this)
  }
}
