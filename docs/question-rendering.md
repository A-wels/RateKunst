# Question text fitting

Question paragraphs use `ParagraphFittedText`. The visible Text stays mounted
in normal layout, including before the first layout/text measurement arrives.
An invisible, inaccessible copy wraps at the question window's actual width
without a constrained height. Native `onTextLayout` reports every line; a
bounded binary search chooses the largest font size that fits the available
height, within 0.5 points of the requested size (minimum 4 points). Native
wrapping bounds the ink width; reported line width can include trailing spaces
outside that bound and does not trigger shrinking.

The previous paragraph filled its window absolutely and relied on Android's
`adjustsFontSizeToFit`. With both dimensions exact, RN 0.72's bundled Yoga can
skip the Text measure function altogether. Android's fitting lives in that
function and mutates the prepared font spans. Those are unreliable dependencies
while the game enters landscape or the available window changes. A local
experiment against the bundled Yoga confirmed the skipped measure callback for
an absolutely filled Text and a called callback for width-only measurement.
This identifies a fitting failure path; it does not reproduce the user's exact
physical-device rendering failure.

A new question, window size or system font scale starts a fresh fit from the
preferred 38-point size. Late callbacks from earlier questions, windows or
search steps are ignored. Empty/invalid reports retain visible text. The
measurement copy never draws or participates in accessibility. Color comes
from the current Material theme. Single-line letter fitting is unchanged.

Jest exercises initial visible text, wrapped line metrics, narrow/landscape
windows, enlarged system text, transient small/zero windows, restoring the
preferred size, changed questions and stale/invalid callbacks. Native glyph
reports are simulated in those tests; they do not prove device rendering.

Device check: start with Standard, verify the countdown, question and letter,
skip repeatedly, rotate/leave/restart the round, and background/return. Repeat
with long custom questions, dark mode and enlarged system text. Questions must
remain visible, fit the available panel, and retain the current round's scores.
