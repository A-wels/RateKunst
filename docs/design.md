# Interface design

RateKunst is a small game companion. Its interface should help people prepare a
round, read the category and letter, and award points quickly.

## Decisions

- White background, dark text and the platform's system font. One blue accent
  identifies actions; red is reserved for deletion and storage failures.
- Ordinary sentence case and moderate font weights. No slogans, oversized hero
  headings, decorative icons, emoji, gradients, shadows or ornamental badges.
- Plain form sections and lists instead of a dashboard of rounded cards.
  Category and letter are separated by space and a single divider.
- Buttons have labels, pressed feedback and a minimum 48 dp touch target.
  Topic rows expose checkbox state to TalkBack and display selection in text.
- Players and custom sets are lists. Edit, remove and delete actions are explicit.
  Custom-set deletion still requires confirmation.
- Topics are selected in a searchable full-screen native modal. Selection is
  saved immediately, including when leaving with Android Back. Search filtering
  never removes a selected topic.
- Narrow forms scroll; landscape scoring scrolls horizontally. Long set titles
  and topic names wrap. Controls grow with text instead of using fixed heights.
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
