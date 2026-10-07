package de.awels.ratekunst.monetization;

/** A short display window for one completed-game break, never for a later game. */
final class InterstitialBreak {
  enum Decision { SHOW, WAIT, SKIP }
  private final int gameRevision, consentRevision;
  private final long expiresAt;

  InterstitialBreak(int gameRevision, int consentRevision, long expiresAt) {
    this.gameRevision = gameRevision;
    this.consentRevision = consentRevision;
    this.expiresAt = expiresAt;
  }

  Decision decide(long now, int gameRevision, int consentRevision,
      boolean eligible, boolean windowFocused) {
    if (!eligible || now >= expiresAt || this.gameRevision != gameRevision
        || this.consentRevision != consentRevision) return Decision.SKIP;
    return windowFocused ? Decision.SHOW : Decision.WAIT;
  }
}
