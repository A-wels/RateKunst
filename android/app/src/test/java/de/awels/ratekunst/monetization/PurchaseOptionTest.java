package de.awels.ratekunst.monetization;

import static org.junit.Assert.*;
import java.util.Arrays;
import java.util.Collections;
import org.junit.Test;

public final class PurchaseOptionTest {
  @Test public void standardIsSelectedEvenWhenAnotherOptionIsReturnedFirst() {
    assertEquals(1, MonetizationModule.standardOfferIndex(
        Arrays.asList("other", "standard"), Arrays.asList(null, null)));
  }

  @Test public void regularStandardOfferIsPreferredOverItsDiscountOffer() {
    assertEquals(1, MonetizationModule.standardOfferIndex(
        Arrays.asList("standard", "standard"), Arrays.asList("discount", "")));
  }

  @Test public void anEligibleStandardPromotionCanBeUsedWhenNoRegularOfferIsReturned() {
    assertEquals(0, MonetizationModule.standardOfferIndex(
        Collections.singletonList("standard"), Collections.singletonList("discount")));
  }

  @Test public void missingStandardDoesNotFallBackToAnotherNamedOption() {
    assertEquals(-1, MonetizationModule.standardOfferIndex(
        Collections.singletonList("other"), Collections.singletonList(null)));
    assertEquals(-1, MonetizationModule.standardOfferIndex(
        Collections.emptyList(), Collections.emptyList()));
  }

  @Test public void onlyASingleUnnamedLegacyDefaultIsAccepted() {
    assertEquals(0, MonetizationModule.standardOfferIndex(
        Collections.singletonList(null), Collections.singletonList(null)));
    assertEquals(-1, MonetizationModule.standardOfferIndex(
        Arrays.asList(null, null), Arrays.asList(null, null)));
  }
}
