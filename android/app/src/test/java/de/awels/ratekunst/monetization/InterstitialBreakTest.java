package de.awels.ratekunst.monetization;

import static org.junit.Assert.*;
import org.junit.Test;

public final class InterstitialBreakTest {
  @Test public void waitsForWinnerDialogToDismissAndThenShows() {
    InterstitialBreak gameBreak = new InterstitialBreak(2, 3, 1000);
    assertEquals(InterstitialBreak.Decision.WAIT, gameBreak.decide(100, 2, 3, true, false));
    assertEquals(InterstitialBreak.Decision.SHOW, gameBreak.decide(150, 2, 3, true, true));
  }

  @Test public void neverShowsAfterTheFocusDeadline() {
    InterstitialBreak gameBreak = new InterstitialBreak(2, 3, 1000);
    assertEquals(InterstitialBreak.Decision.SKIP, gameBreak.decide(1000, 2, 3, true, false));
    assertEquals(InterstitialBreak.Decision.SKIP, gameBreak.decide(1050, 2, 3, true, true));
  }

  @Test public void cancelsWhenANewGameStartsOrTheAppPauses() {
    InterstitialBreak gameBreak = new InterstitialBreak(2, 3, 1000);
    assertEquals(InterstitialBreak.Decision.SKIP, gameBreak.decide(150, 3, 3, true, true));
  }

  @Test public void cancelsWhenConsentChanges() {
    InterstitialBreak gameBreak = new InterstitialBreak(2, 3, 1000);
    assertEquals(InterstitialBreak.Decision.SKIP, gameBreak.decide(150, 2, 4, true, true));
  }

  @Test public void neverWaitsForInventoryOrShowsWithoutEligibility() {
    InterstitialBreak gameBreak = new InterstitialBreak(2, 3, 1000);
    assertEquals(InterstitialBreak.Decision.SKIP, gameBreak.decide(100, 2, 3, false, false));
    assertEquals(InterstitialBreak.Decision.SKIP, gameBreak.decide(150, 2, 3, false, true));
  }
}
