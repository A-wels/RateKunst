# Interface design

RateKunst is a small game companion. Its interface should help people prepare a
round, read the question and letter, and award points quickly.

## Decisions

- A warm white background, dark brown text and the platform's system font.
  A peach header and softly tinted game windows give the app a game feel without
  a broad palette. All player fields share the same warm surface. Buttons,
  checkboxes and awarded points use one darker peach accent for contrast.
  Red is reserved for deletion and storage failures.
- Ordinary sentence case and moderate font weights. No slogans, oversized hero
  headings, decorative icons, emoji, gradients, shadows or ornamental badges.
- Plain form sections and lists instead of a dashboard of rounded cards.
  Question and letter use softly tinted cream and peach display windows.
- Buttons have labels, pressed feedback and a minimum 48 dp touch target.
  Topic rows expose checkbox state to TalkBack and show a checked or empty box.
  Player removal uses a trash icon with a localized accessible label. These
  functional symbols are drawn with native views, without icon fonts or emoji.
- Players and custom sets are lists. Edit, remove and delete actions are explicit.
  Custom-set deletion still requires confirmation.
- Topics are selected in a searchable full-screen native modal. Selection is
  saved immediately, including when leaving with Android Back. Search filtering
  never removes a selected topic.
- Narrow forms scroll; landscape scoring scrolls horizontally. Question and
  letter text fill bounded display windows. Questions retain native paragraph
  fitting. Single-line letters use the measured native width and height of the
  complete group, then scale it into the actual field with a small rounding
  margin. This avoids relying on Android automatic single-line fitting, which
  clipped X / Y / Z in the device screenshot. Full text is exposed to TalkBack.
  The player input stacks on narrow displays or with enlarged text. Long set
  titles and topic names wrap. Controls grow instead of using fixed heights.
- A four-step tutorial appears once, can be skipped (including Android Back),
  and can be reopened from the setup menu. It is available in both languages.
- All ten built-in packs use one bilingual schema in questionPacks.ts. The
  separate German-only pack file and legacy runtime composition are removed.
  Old numeric selections still migrate to the same stable IDs. Custom text
  remains user-authored and is not translated automatically.
- The existing storage keys, stable topic IDs, languages and game rules remain
  compatible. The icon-font and dropdown dependencies are no longer needed.

## Research

[The New Yorker, The A.I.-Design Aesthetic That's Taking Over the Internet](https://www.newyorker.com/culture/infinite-scroll/the-ai-design-aesthetic-thats-taking-over-the-internet)
(24 June 2026) describes repeated palettes, serif headlines, tracked-out labels,
rounded outlined panels and decorative symbols. These are observations about
common defaults, not a reliable way to identify how an interface was made.
Changing only the palette would leave the same structural problem in this app.

[Material Design layout principles](https://m1.material.io/layout/principles.html)
emphasize hierarchy through typography, spacing and consistent structure.
[Android's accessibility guidance](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)
informs the touch targets, contrast and accessible control labels.

The chosen treatment applies these principles to this game's actual tasks rather
than reproducing a generic dashboard or landing-page template.

The question window labels each drawn question with its source set's title.
Built-in titles follow the round's language; custom titles stay user-authored.
Question text and source title travel together through random selection, so
identical prompts from different sets retain their correct source. The title
clears during the countdown and is bounded to two lines in the existing label
area. The existing palette and screen layout are unchanged.

## Single-line letter fitting

An invisible, noninteractive Text measures the full short letter/group at the
preferred size, with the same system font and weight as the displayed text.
Its wide measurement area prevents wrapping or truncation before measurement.
The [native onTextLayout metrics](https://reactnative.dev/docs/0.72/text#ontextlayout)
include the device's system font scaling. The rendered font size scales by the
smaller ratio of available width or height to those metrics, never exceeding the
preferred size. Four dp of total margin cover native pixel rounding. No separate
character-count approximation or Android auto-fit is used for these letters.

The measuring copy is excluded from accessibility and the whole letter window
is noninteractive. The visible group is announced once. Unmeasured text stays
hidden, preventing a clipped first frame. Measurement resets for a new group,
preferred size or system font scale; resizing the field recalculates immediately.
Late events from a previous group cannot replace newer measurements.

Jest exercises all five grouped entries, small fields, height constraints,
resizing, switching back to a single letter, 150%/200% system font scaling and
stale native measurement events. These tests use supplied native event metrics;
actual Android typography still needs device verification. The existing theme,
game layout, question typography and player controls are unchanged.
