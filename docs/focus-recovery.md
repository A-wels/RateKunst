# Android input recovery

## System Back on Android 16 and later

The app targets SDK 36, where the system no longer delivers Back through the
legacy `Activity.onBackPressed()` path. RN 0.72 still uses that path to emit its
JavaScript `hardwareBackPress` event. MainActivity registers a lifecycle-owned
AndroidX `OnBackPressedCallback` to forward modern system Back to React's
existing handler. React Navigation then pops Settings, EditSet and CustomSets
one screen at a time, and falls through at Home. Native dialogs and the keyboard
retain their own back handling.

The callback disables itself while delegating and while React invokes the
default native fallback, preventing dispatcher recursion at the root. Native
unit tests verify forwarding, fallback and restoration after errors; a Jest
navigation test verifies the screen-by-screen back stack and root fallback.
Device checks remain necessary for gesture and three-button Back on recent
Android versions, after dialogs and after background/resume.

Reference: [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16).

The reported symptom is that the language switch still works while content
buttons and inputs stop responding after a possible focus loss. This points to
the content input path rather than a stopped JavaScript runtime. The exact
device failure has not been reproduced in this workspace.

The Activity cancels an unfinished touch stream before losing window focus or
pausing. The copied MotionEvent retains its original down time and pointer
coordinates so React's native touch dispatcher can cancel the same gesture.
The app also releases the legacy UIManager's native responder intercept when
returning from an Android blur/background event. Screens, forms and rounds
are not remounted or reset.

Tutorial and question-pack dialogs release their native windows when hidden or
backgrounded. Returning creates a fresh window, including when rapid lifecycle
events are batched. The tutorial step, search and selected packs remain in the
parent components. Android Back still closes the visible dialog.

MainActivity follows react-native-screens 3.22's documented
`super.onCreate(null)` configuration to avoid restoring native fragments with
stale React view references after Activity recreation. Process death still
starts a new app session; in-memory rounds are not newly made persistent.

## Verification

Jest covers notification-shade blur/focus, background/active ordering, listener
cleanup, repeated and batched resumes, retained search/selection/tutorial step,
and closed dialogs staying unmounted. The Android release build checks the
native Activity code. These checks do not replace Android device testing.

Device checks for a release build:

1. Enter a partial player name. Pull down the notification shade, return, and
   finish typing. Add/remove a player and edit the point target.
2. Repeat using Home/app switching and lock/unlock, including while holding a
   button or scrolling. Controls must respond and the name must stay intact.
3. Open question packs, enter a search and toggle a checkbox. Background and
   return repeatedly; the search and selection must remain. Close with Done
   and Android Back, then verify that the menu still accepts input.
4. Advance the tutorial, background and return. Continue from the same step,
   skip it, and check menu inputs. Replay must still start at step one.
5. Award points in a landscape round, switch away and return. Scores and the
   round must remain; Skip and scoring must respond after the countdown.

## Custom-set navigation

Opening “Manage custom packs” was reported to freeze the app. No JavaScript
render loop was found in the list loader. The device failure is not reproduced
locally. The exact RN 0.72 / native-stack 6 / screens 3.22 combination has a
[reported default Android transition regression](https://github.com/react-navigation/react-navigation/issues/11438)
where the outgoing screen is drawn above the incoming screen. This is evidence
for a transition workaround, not proof of the reported freeze's root cause.

The CustomSets and EditSet routes now use `animation: 'none'` on Android, avoiding
the default animated enter/exit path. iOS retains its existing transition.
Existing headers, colors, layout, game orientation and native-stack back handling
are retained. No redesign is included.

The list reads custom sets in one batch, deduplicates and validates storage IDs,
skips invalid or missing records individually, and ignores stale responses after
another focus reload or unmount. Existing storage records are not rewritten.
Jest covers actual App navigation into the list, creation, editing, return and
reopening, plus malformed records alongside valid sets. This validates JS flow
and the native-stack options; it cannot verify Android fragment hit testing.

Device verification still required: repeatedly open the custom-set list, create
and edit a set, use the header Back and Android Back, and verify both list and
setup controls respond. Repeat after Home/resume with the keyboard open.
