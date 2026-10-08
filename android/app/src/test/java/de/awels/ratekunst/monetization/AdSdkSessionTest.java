package de.awels.ratekunst.monetization;

import org.junit.Test;
import static org.junit.Assert.*;

public class AdSdkSessionTest {
  @Test public void cachedOwnerNeverStartsAnAdSessionOrNeedsRestart() {
    AdSdkSession session = new AdSdkSession();
    assertFalse(session.begin(false, true));
    assertFalse(session.begin(true, true));
    assertFalse(session.disable());
  }
  @Test public void unknownOwnershipBlocksSdkUntilStoreAnswers() {
    AdSdkSession session = new AdSdkSession();
    assertFalse(session.begin(false, false));
    assertFalse(session.disable());
    session.revoke();
    assertTrue(session.begin(true, false));
  }
  @Test public void purchaseAfterConsentRequiresFreshProcessAndBlocksCallbacks() {
    AdSdkSession session = new AdSdkSession();
    assertTrue(session.begin(true, false));
    assertTrue(session.disable());
    assertTrue(session.isDisabled());
    assertFalse(session.begin(true, false));
    assertFalse(session.begin(true, true));
    assertTrue(session.disable());
  }
  @Test public void confirmedRevocationCanResumeFreeMode() {
    AdSdkSession session = new AdSdkSession();
    session.disable();
    session.revoke();
    assertTrue(session.begin(true, false));
  }
}
