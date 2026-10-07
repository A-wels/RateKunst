package de.awels.ratekunst;

import static org.junit.Assert.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.Test;

public final class ReactBackCallbackTest {
  @Test public void backDispatchesToReactAndRestoresTheCallback() {
    AtomicInteger count = new AtomicInteger();
    ReactBackCallback[] callback = new ReactBackCallback[1];
    callback[0] = new ReactBackCallback(() -> {
      assertFalse("Native fallback must not reenter the bridge", callback[0].isEnabled());
      count.incrementAndGet();
    });
    callback[0].handleOnBackPressed();
    assertEquals(1, count.get());
    assertTrue(callback[0].isEnabled());
  }

  @Test public void rootFallbackDoesNotInvokeReactAgain() {
    AtomicInteger reactCalls = new AtomicInteger();
    AtomicInteger fallbackCalls = new AtomicInteger();
    ReactBackCallback callback = new ReactBackCallback(reactCalls::incrementAndGet);
    callback.withoutCallback(() -> {
      assertFalse(callback.isEnabled());
      fallbackCalls.incrementAndGet();
    });
    assertEquals(0, reactCalls.get());
    assertEquals(1, fallbackCalls.get());
    assertTrue(callback.isEnabled());
  }

  @Test public void failedDispatchRestoresThePreviousEnabledState() {
    ReactBackCallback callback = new ReactBackCallback(() -> {
      throw new IllegalStateException("test");
    });
    try { callback.handleOnBackPressed(); fail("Expected dispatch failure"); }
    catch (IllegalStateException expected) { assertTrue(callback.isEnabled()); }
    callback.setEnabled(false);
    callback.withoutCallback(() -> {});
    assertFalse(callback.isEnabled());
  }
}
