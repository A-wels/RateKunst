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

## Production publishing

- [x] Create the permanent `production` branch from `main`.
- [x] Add a production-only GitHub Actions workflow.
- [x] Validate TypeScript, lint, and tests before upload.
- [x] Build a signed Android App Bundle with a unique automatic version code.
- [x] Publish directly to the Google Play `production` track at 100% rollout.
- [x] Keep active production releases serialized and retain the AAB for 30 days.
- [x] Document the fast-forward promotion procedure.

## Verification

- [x] Pass TypeScript checking.
- [x] Pass ESLint.
- [x] Pass Jest tests.
- [ ] Build the Android release bundle in CI (legacy transitive R compatibility pending rerun).

## One-time owner actions

- [ ] Add the RateKunst upload key as `ANDROID_UPLOAD_KEYSTORE_BASE64`.
- [ ] Add `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`, and `ANDROID_UPLOAD_STORE_PASSWORD`.
- [ ] Add the Play service account JSON as `PLAY_SERVICE_ACCOUNT_JSON`.
- [ ] Grant that service account permission to publish production releases for `com.RateDepp`.
- [ ] Complete all required Play Console listing, policy, content-rating, and production-access steps.
- [ ] Merge the modernization PR into `main`.
- [ ] Fast-forward `production` to the reviewed `main` commit and push it to publish live.
