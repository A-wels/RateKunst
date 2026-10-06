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

The native-responder release alone did not resolve the reported app-switch
failure: scrolling and the header language switch worked, while buttons and
inputs inside the scroll content remained unresponsive. The pinned RN 0.72
ScrollView owns additional JavaScript touch/momentum capture flags, separate
from UIManager's native responder. An interrupted stream or unmatched momentum
event can retain those flags. This is a plausible failure path, not a device
reproduction of the user's exact failure.

`InputRecoveryProvider` advances a generation after Android blur/background and
return, including batched transitions. `RecoverableScrollView` replaces only
the affected scroll containers and their controls, restoring the last observed
offset. Screen components and the navigator stay mounted: setup drafts, scores,
countdowns, custom-set text and selected packs remain in their parent state.
Virtualized lists use the same ref-forwarding scroll component. iOS retains its
usual ScrollView. No private RN fields are modified or framework files patched.

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
The additional recovery tests verify fresh scroll instances, retained screen
identity, draft input and scroll offset over repeated/batched resumes, and score
correction after a blur/focus without resetting the round.

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

## Android navigation uses React views

Recreating scroll content alone did not resolve the user's intermittent input
failure. The Android navigation path now uses `@react-navigation/stack` 6 with
`detachInactiveScreens: false`. Screen content and headers are ordinary React
views, bypassing react-native-screens 3.22's native ScreenStack fragments,
CoordinatorLayout and toolbar/content split. Card animations, overlays and
navigation gestures are disabled on Android. iOS retains the native stack.
This is an architectural workaround, not a reproduction or a confirmed diagnosis
of the user's exact device failure.

The earlier native-stack animation workaround only covered selected routes;
Game, including its replace/restart transition, still used the default native
transition. The Android stack change covers every route and restart. Hidden
routes retain their parent state but cannot intercept the active card's input.
React Navigation still owns route keys, focus/blur events, Back handling and
`replace`/`popToTop`; navigation is not remounted on app resume.

Gesture Handler is initialized before App registration and owns the app's root
view as required by the JavaScript stack. Its version is pinned to the existing
RN 0.72 compatibility range. `RateKunstDisplay` applies sensor landscape only
while Game is the current route, reapplying it after a host resume and restoring
unspecified orientation outside Game. This is separate from the native ad
`gameActive` flag so an interstitial break cannot rotate the screen or reset the
round. A missing Activity at an early route update is handled at host resume.

Tests exercise the actual Android App stack: preserve a partially typed player
name while visiting Settings and over repeated/batched resumes, return and add
the player, start a round, preserve a score through resume, correct it, win and
restart with zero scores, and return home. They verify the native screen
containers are absent, route-owned orientation updates, listener cleanup, and
screen identity across resumes. The custom-set create/edit/reopen and one-step
system Back tests remain. Image fixtures now match RN's numeric asset IDs for
the stack's built-in Back icon. Tutorial tests reflect the shorter DE/EN copy
already edited on main; that copy is not overwritten.

Device verification remains necessary: repeat app switching, shade and lock
cycles with a name field focused, while scrolling, and in a landscape round;
then test winning Restart, header/system Back, custom-set editing, consent and
interstitial dismissal. The native bundle build validates compilation and linking
but does not prove physical-device hit testing.

References: [React Navigation stack](https://reactnavigation.org/docs/6.x/stack-navigator/)
and [Gesture Handler setup](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/fundamentals/installation/).
