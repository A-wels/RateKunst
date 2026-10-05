# Android input recovery

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
