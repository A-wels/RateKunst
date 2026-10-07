package de.awels.ratekunst.monetization;

import static org.junit.Assert.*;

import com.facebook.react.module.annotations.ReactModule;
import org.junit.Test;

public final class MonetizationModuleTest {
  @Test public void bannerModuleHasTheRegistrationRequiredByClassBasedLookup() {
    // NativeModuleRegistry.getModule(Class) throws before a banner can be created
    // if this runtime annotation is absent. Compiling a bundle does not catch it.
    ReactModule registration = MonetizationModule.class.getAnnotation(ReactModule.class);
    assertNotNull("BannerView must be able to resolve the monetization module", registration);
    assertEquals("RateKunstMonetization", registration.name());
    assertEquals(MonetizationModule.NAME, registration.name());
  }

  @Test public void unknownAgeStillAllowsGeneralAudienceAdConfiguration() {
    assertEquals("G", MonetizationModule.maxAdContentRating("", "MA"));
    assertTrue(MonetizationModule.needsAgeProtection(""));
    assertEquals("G", MonetizationModule.maxAdContentRating(null, "T"));
  }

  @Test public void youngestGroupRemainsGeneralAudienceOnly() {
    assertEquals("G", MonetizationModule.maxAdContentRating("under16", "MA"));
    assertTrue(MonetizationModule.needsAgeProtection("under16"));
  }

  @Test public void declaredOlderAgeUsesTheConfiguredAppRating() {
    assertEquals("T", MonetizationModule.maxAdContentRating("teen", "T"));
    assertFalse(MonetizationModule.needsAgeProtection("teen"));
    assertEquals("G", MonetizationModule.maxAdContentRating("adult", "G"));
    assertEquals("MA", MonetizationModule.maxAdContentRating("adult", "MA"));
    assertFalse(MonetizationModule.needsAgeProtection("adult"));
  }
}
