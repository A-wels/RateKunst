# RateKunst roadmap

This checklist is the source of truth for the current modernization and release work.
Update it in the same commit whenever an item changes state.

## App modernization

- [x] Introduce a cohesive, accessible visual system.
- [x] Redesign the start, game, custom-set, and editor screens.
- [x] Add complete German and English UI localization.
- [x] Persist the selected language and default to the device language.
- [x] Preserve existing players, selected packs, target score, and custom sets.
- [x] Replace decorative cards and icons with plain lists, labeled controls and system typography.
- [x] Fit categories and grouped letters to bounded display windows using native text measurement.
- [x] Add a German/English first-launch tutorial with skip and menu replay.

## Question packs

- [x] Keep the existing Standard and Movies & TV packs in both languages.
- [x] Add Everyday & Chaos.
- [x] Add Fantasy & Role-playing.
- [x] Add Gaming & Nerd Culture.
- [x] Add Party & Dark Humor.
- [x] Add Nature & Animals.
- [x] Add Knowledge & Science.
- [x] Add Food & Drinks.
- [x] Add Travel & Places.
- [x] Validate stable IDs, translations, and non-empty pack contents in tests.
- [x] Use one bilingual schema for all built-in packs; remove the German-only legacy file.

## New app identity and internal-test publishing

- [x] Migrate the application ID, Android namespace, Java packages and source paths to `de.awels.ratekunst`.
- [x] Replace the production-branch workflow with internal testing on pushes to `main`.
- [x] Validate TypeScript, lint, and tests before upload.
- [x] Build a signed Android App Bundle with a unique automatic version code.
- [x] Configure Google Play uploads for `de.awels.ratekunst`, track `internal`, status `completed`.
- [x] Serialize internal releases and retain the signed AAB for 30 days before upload, including failed uploads.
- [x] Add a manually triggered signed build with optional Play upload for first-app registration.
- [x] Document the new app's first manual upload, secrets, tester-track permissions and separate local storage.

## Verification

- [x] Pass TypeScript checking.
- [x] Pass ESLint.
- [x] Pass Jest regressions for game state, storage, navigation, themes, localization and monetization.
- [x] Prevent setup hydration from overwriting saved players.
- [x] Migrate legacy numeric selections, including custom packs, to stable IDs.
- [x] Preserve the last custom-pack edit when leaving the editor; serialize writes.
- [x] Keep manually selected language when a delayed storage read completes.
- [x] Remove the retired Android SDK `tools` package from CI and publishing setup.
- [x] Increase the release-build heap and bound Gradle workers for clean Hermes AAR transforms.
- [x] Target Android API 36 and compile API 36 using React Native 0.87.1, Gradle 9.4.1 and its upstream Android toolchain.
- [x] Remove unused icon fonts, dropdown packages and their obsolete Android Gradle wiring.
- [x] Verify the API 36 release bundle after the `de.awels.ratekunst` package migration: https://github.com/A-wels/RateKunst/actions/runs/37273223445 (type-check, lint, all 11 tests and bundleRelease passed with development signing).
- [ ] Smoke-test layout, scoring, navigation, and language switching on an Android device.

## Maintenance

- [x] Upgrade React Native to 0.87.1 / React 19.2.3 and remove the legacy Android compatibility patch.
- [x] Review current dependency advisories: the remaining high findings cascade from unpatched braces <=3.0.3 in CLI/Metro/Jest glob matching; question/player input does not reach this build tooling. Do not apply npm's suggested framework downgrade.
- [ ] Update the glob tooling once an upstream security fix is available.
- [x] Require ELF64 16 KB alignment and a disabled AdMob startup provider in every release pipeline.
- [ ] Smoke-test the built bundle on a real or emulated 16 KB device.

## One-time owner actions

- [x] Create a new Play Console app and register `de.awels.ratekunst` through the first manual AAB upload with Play App Signing.
- [x] Add the new RateKunst upload key as `ANDROID_UPLOAD_KEYSTORE_BASE64` (owner confirmed repository secrets configured).
- [x] Add `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`, and `ANDROID_UPLOAD_STORE_PASSWORD` (owner confirmed).
- [x] Add the Play service account JSON as `PLAY_SERVICE_ACCOUNT_JSON` (owner confirmed).
- [x] Grant that service account permission to publish internal test releases for `de.awels.ratekunst`.
- [ ] Complete the Play Console requirements, configure testers and roll out the first internal test manually.
- [x] Merge the modernization PR into `main`.
- [x] Confirm a subsequent push to `main` automatically publishes the internal test.

## Production readiness

- [x] Always offer the bilingual privacy policy in Settings, including offline/ad-free use.
- [x] Recover from setup/editor read errors through Retry without replacing saved data.
- [x] Gate Mobile Ads and UMP behind purchase verification; retain verified offline entitlement.
- [x] Persist ownership and restart an already-used advertising process after purchase/restore.
- [ ] Verify a real Play purchase, acknowledgement, restore, pending payment and refund on the internal track.
- [ ] Verify zero AdMob/UMP network traffic after purchase and after an offline cold launch.
- [ ] Repeat device input/navigation/landscape smoke tests after the framework upgrade.
- [ ] Publish docs/RateKunst-privacy-policy.html at the privacy URL configured in Play and AdMob.
- [ ] Confirm Play Data safety, target audience, content rating, ads/IAP declarations and store listing.
- [ ] Promote the tested internal release to production in Play Console.
