# AdMob and permanent ad removal

The Android implementation uses Google Mobile Ads SDK 25.5.0, UMP 4.0.0 and
Google Play Billing 8.3.0. Minimum Android version is now Android 7.0 / API 24.
No additional React Native packages or billing server are required.

## Behavior

- A labeled 320 × 50 bottom banner occupies its own layout area in the menu,
  settings and custom-set editor/list. Picker/tutorial dialogs have their own
  footer; the underlying banner is destroyed when its native window loses focus.
- The gameplay screen has no banner. The native bridge independently prevents
  banners and interstitial display while a game is active.
- Every second **completed round** attempts one preloaded interstitial when the
  winner dialog returns to the menu. Quitting a round does not count. The counter
  persists across app launches. Unavailable ads are skipped, with no delayed ad
  popping up during play. Starting another round invalidates a delayed counter write.
- `remove_ads` is a **one-time, non-consumable** product. It removes all ads forever
  for the owning Google Play account; there is no subscription and no consumption.
- Purchases are checked on startup/foreground and can be restored from Settings.
  Pending/cancelled purchases do not grant an entitlement. Completed purchases
  are signature-verified, locally cached for offline use and acknowledged. A
  successful owned-purchases query removes refunded/revoked entitlements; network
  errors retain a previously verified entitlement.
- No ads load until Play ownership has been checked and UMP allows ad requests.
  A cached verified purchase suppresses ads even while offline. If an owned
  purchase cannot be verified, ads remain suppressed until verification succeeds.
- A neutral age-group prompt follows the tutorial. **Under 16**, **16–17** and
  **18 or older** choose UMP/ad treatment; no birth date is collected. Changes
  remain available under Settings. Deferring the choice still allows G-rated ads
  after the ownership and UMP checks; no age choice is required to load them.
- Unknown age and under 16 get conservative CHILD / under-age-of-consent treatment and a G-only
  ad-content limit regardless of the configured app limit; 16–17 gets
  TEEN treatment; adult requests use UNSPECIFIED and the user's UMP consent.
  The selected age group stays in app storage; an age-treatment signal is sent
  with ad requests. UMP privacy options are available when required.

## Production configuration

### Diagnosing missing ads without ADB

Open Settings → Ad diagnostics. The panel reports the installed version, purchase
check, UMP status/form availability, age treatment, content limit, banner ad-unit
ID, banner state/measured size, interstitial state and SDK error codes/messages.
It does not include purchase receipts, purchase tokens or device identifiers and
is neither persisted nor uploaded. Share a screenshot of this panel when ads fail.
The retry button rechecks ownership and UMP and creates a fresh banner request;
it does not reset consent, change age, bypass gates or request ads during a game.
An unsuccessful first UMP request can also be retried on a later foreground event.

`BannerView` must measure/layout its Android children after asynchronous AdMob
updates: React Native 0.72's `ReactViewGroup.requestLayout()` is intentionally a
no-op. A posted, coalesced native measure/layout pass preserves the dimensions
assigned by Yoga while laying out the ad's child tree. Banner callbacks report
load success/failure; empty inventory and configuration errors are distinguished
from layout failures. Actual ad inventory and consent messages still need device
verification against the production AdMob configuration.

The native bridge carries the `@ReactModule` registration required by React Native's
class-based lookup when `BannerView` first resolves the module. Android unit tests
check this runtime registration contract as well as the unknown-age G policy.

The supplied RateKunst release IDs and RSA public key are included in the app.
Optional overrides can be set as **repository variables** under Settings → Secrets
and variables → Actions → Variables. The internal-release workflow passes them to
Gradle. These values are public identifiers, including the RSA **public** key.

| Variable | Value |
| --- | --- |
| `ADMOB_APP_ID` | Included default: `ca-app-pub-4579090895960312~2264456781` |
| `ADMOB_BANNER_ID` | Included default: `ca-app-pub-4579090895960312/2477133216` |
| `ADMOB_INTERSTITIAL_ID` | Included default: `ca-app-pub-4579090895960312/7672610412` |
| `ADMOB_MAX_AD_CONTENT_RATING` | `G`, `PG`, `T` or `MA`; default `G` |
| `PLAY_BILLING_PUBLIC_KEY` | Optional override for this app's Base64 RSA licensing public key; the supplied RateKunst key is included in `android/app/play-billing-public-key.txt` |

Local builds accept the same environment variables or `-P<name>=<value>` Gradle
properties. Release builds use the supplied RateKunst IDs; debug builds **always**
use Google test inventory. Purchases use the bundled public key by default; a configured
override replaces it. The Android manifest explicitly declares `com.android.vending.BILLING`.
Do not confuse publisher ID `pub-…`, AdMob App ID, ad-unit
IDs, Android application ID or the Play public licensing key.

1. In AdMob configure the UMP European regulations message / privacy options for
   **de.awels.ratekunst**. The supplied app, banner and interstitial IDs are configured.
2. In Play Console create and activate the **one-time product** `remove_ads`,
   with a regular **buy** purchase option and your chosen price. Do not configure
   a subscription or consume the product. The price is loaded from Google Play.
3. Set any necessary overrides above and distribute a signed internal test build. Add
   license testers and test cancelled, pending, completed and restored purchases,
   reinstall/restoration, offline operation, refunds, the second-round boundary,
   age groups, consent choices, dark mode and foreground interruptions.
4. Update Play's **Contains ads**, target audience (13+ as selected), content
   rating questionnaire, Advertising ID declaration, Data safety and privacy
   policy to reflect AdMob/UMP/Play Billing. The previous local-only/privacy
   description is no longer sufficient for the free ad-supported app.
5. Choose the ad-content limit based on the actual **content rating**, not merely
   the selected audience. The safe default remains G until that is established.

Google recommends server-side verification for stronger fraud resistance. This
local app verifies Google's signed receipt with its app-specific public key; a
modified client can bypass local checks. A future server verification endpoint
can replace this without changing the non-consumable product.

## app-ads.txt verification (screenshot)

At implementation time, `https://a-wels.de/app-ads.txt` was checked directly: it
returned **HTTP 200** and already contained the exact expected publisher line.
If AdMob still rejects verification, check the developer website host in the
Play listing and request a new crawl rather than changing the correct record.

The screenshot shows publisher ID `pub-4579090895960312` and an app-ads.txt
verification failure. Publish this exact line at the root of the **developer
website host listed on the Play store listing**:

```
google.com, pub-4579090895960312, DIRECT, f08c47fec0942fa0
```

The same line is provided in `docs/app-ads.txt`. It belongs at e.g.
`https://a-wels.de/app-ads.txt` if that is the actual developer website in the
listing, not under the privacy-policy subdirectory. Keep existing authorized
seller lines for other accounts. Verify HTTP 200, public accessibility, no login
wall and correct robots.txt access, then use **Check for updates** in AdMob.
Google says discovery/verification can take a few days. Publishing the Android
code does not fix this website record.

## Policy references

- [Ad content labels](https://support.google.com/admob/answer/10478094)
- [Request-level maximum content rating](https://support.google.com/admob/answer/10477886)
- [High-engagement ads](https://support.google.com/admob/answer/15525707)
- [Google Play ad placement policy](https://support.google.com/googleplay/android-developer/answer/9857753)
- [Families policy](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Sexual content and profanity](https://support.google.com/googleplay/android-developer/answer/9878810)
- [UMP consent integration](https://developers.google.com/admob/android/privacy)
- [Billing integration](https://developer.android.com/google/play/billing/integrate)
