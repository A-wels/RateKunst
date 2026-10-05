# RateKunst roadmap

This checklist is the source of truth for the current modernization and release work.
Update it in the same commit whenever an item changes state.

## App modernization

- [x] Introduce a cohesive, accessible visual system.
- [x] Redesign the start, game, custom-set, and editor screens.
- [x] Add complete German and English UI localization.
- [x] Persist the selected language and default to the device language.
- [x] Preserve existing players, selected packs, target score, and custom sets.

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
- [x] Pass Jest tests (3 suites, 11 tests, including persistence regressions).
- [x] Prevent setup hydration from overwriting saved players.
- [x] Migrate legacy numeric selections, including custom packs, to stable IDs.
- [x] Preserve the last custom-pack edit when leaving the editor; serialize writes.
- [x] Keep manually selected language when a delayed storage read completes.
- [x] Remove the retired Android SDK `tools` package from CI and publishing setup.
- [x] Increase the release-build heap and bound Gradle workers for clean Hermes AAR transforms.
- [x] Target and compile Android API 36 with AGP 8.9.2, Gradle 8.11.1 and the matching Kotlin plugin patch.
- [x] Replace the legacy plugin's removed Gradle `serviceOf` helper with an equivalent service lookup.
- [x] Declare the icon-font copy dependency for AGP lint tasks.
- [x] Verify the API 36 release bundle after the `de.awels.ratekunst` package migration: https://github.com/A-wels/RateKunst/actions/runs/37273223445 (type-check, lint, all 11 tests and bundleRelease passed with development signing).
- [ ] Smoke-test layout, scoring, navigation, and language switching on an Android device.

## Maintenance

- [ ] Upgrade React Native 0.72 and review dependency security findings; remove the Android compatibility patch when supported upstream.
- [ ] Verify native-library 16 KB page-size compatibility and upgrade incompatible dependencies before rollout to 16 KB devices. See https://developer.android.com/guide/practices/page-sizes.

## One-time owner actions

- [ ] Create a new Play Console app and register `de.awels.ratekunst` through the first manual AAB upload with Play App Signing.
- [x] Add the new RateKunst upload key as `ANDROID_UPLOAD_KEYSTORE_BASE64` (owner confirmed repository secrets configured).
- [x] Add `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`, and `ANDROID_UPLOAD_STORE_PASSWORD` (owner confirmed).
- [x] Add the Play service account JSON as `PLAY_SERVICE_ACCOUNT_JSON` (owner confirmed).
- [ ] Grant that service account permission to publish internal test releases for `de.awels.ratekunst`.
- [ ] Complete the Play Console requirements, configure testers and roll out the first internal test manually.
- [ ] Merge the modernization PR into `main`.
- [ ] Confirm a subsequent push to `main` automatically publishes the internal test.
