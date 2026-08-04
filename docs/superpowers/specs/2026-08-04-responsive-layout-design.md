# Burger House — responsive layout

Design for making the landing page work below 1200px. Written 2026-08-04.

## Problem

`styles/style.css` contains no media queries at all. The layout is built on fixed pixel
widths, so the document stays 1200px wide whatever the viewport is. Measured on the
published page at a 390px viewport: `scrollWidth` 1200 against `clientWidth` 375, i.e. the
page scrolls sideways by 825px. The `viewport` meta tag is present, which makes the omission
look deliberate rather than missing.

The widths that force it:

| Rule | Value | Effective width |
|---|---|---|
| `.products-items` | `repeat(3, 384px)` + `gap: 24px` | 1200px |
| `.why-items` | `repeat(3, 312px)` + `gap: 100px` | 1136px |
| `.order-form` | `max-width: 426px` + `margin-left: 674px` | 1100px |
| `.menu` / `.menu-item` | `margin-left: 191px`, `padding-right: 88px` | ~1052px with logo and currency |
| `.main-image`, `.order-image` | `position: absolute`, `calc()` offsets tuned to 1200px | — |
| `.order-form-input`, its `input`, the submit | `344px` / `342px` / `344px` | fixed inside a 426px card |
| `.main-title` / `.common-title` | `120px` / `64px` | overflow narrow screens on their own |

## Goals

- Zero horizontal overflow from 320px upward.
- The existing desktop appearance is preserved at ≥1200px.
- Behaviour that already works — currency switching, smooth scrolling, order buttons, form
  validation — keeps working.

## Non-goals

- No redesign. Colours, type, imagery and section order stay as they are.
- No build step, no dependencies, no framework. The project is three files and stays that way.
- No change to the currency, scrolling or validation logic beyond what the menu requires.

## Approach

**Chosen: replace the sizing layer with fluid primitives, and keep media queries only for the
two places where the structure genuinely changes.**

Fixed widths become `max-width` plus percentages, the two card rows become `auto-fit` grids,
and display type becomes `clamp()`. Media queries then handle only the header and the hero,
which do not merely shrink but rearrange.

Rejected alternatives:

- **Retrofit media queries over the current rules.** Smallest diff, but the fixed widths stay
  authoritative and the responsive behaviour becomes a pile of exceptions on top. Every later
  change means editing both the base rule and its overrides.
- **Rewrite onto container queries with a token layer.** Better end state, disproportionate
  for a 377-line stylesheet with two card rows.

## Breakpoints

Two, and only for structural change:

- **900px** — the header collapses to a burger menu; the hero and order images leave their
  absolute positions and join the flow.
- **560px** — vertical rhythm steps down: the `padding-bottom: 180px` on `.why`, `.products`
  and `.order` becomes `80px`, `.main-content`'s `103px / 199px` becomes `48px / 96px`, and
  `.order-form`'s `padding: 60px 40px` becomes `40px 24px`.

Everything else adapts without a breakpoint.

## Design

### Container

`.container` gains `padding-inline: 20px`. It currently has none, so at narrow widths content
would sit flush against the screen edge. `max-width: 1200px` stays, giving a 1160px content
box on wide screens — the figure the grid arithmetic below is based on.

### Grids — no media queries

`.products-items`: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`, `gap: 24px`.

- three columns need `3×300 + 2×24 = 948` ≤ 1160, so desktop keeps three
- four would need `4×300 + 3×24 = 1272` > 1160, so it never becomes four
- two columns need 624px of content, i.e. a viewport of ~664px; below that the grid drops to
  one column on its own

`.why-items`: `repeat(auto-fit, minmax(260px, 1fr))` with `gap: clamp(32px, 6vw, 100px)`. The
100px gap is kept at full width and shrinks with the viewport. Three columns at the maximum
gap need `3×260 + 200 = 980` ≤ 1160.

### Type — no media queries

| Rule | From | To |
|---|---|---|
| `.main-title` | `120px` | `clamp(40px, 9vw, 120px)` |
| `.common-title` | `64px` | `clamp(28px, 5.5vw, 64px)` |
| `.main-text` | `24px` | `clamp(18px, 2.2vw, 24px)` |

Body copy at 16–18px already works and is left alone.

### Header and navigation

Above 900px the row keeps its current shape, but `.menu { margin-left: 191px }` becomes
`margin-left: auto` and `.menu-item { padding-right: 88px }` becomes
`padding-right: clamp(24px, 4vw, 88px)`. With the minimum padding the row needs roughly
710px, so it is comfortably intact everywhere above the breakpoint.

Below 900px the links move into a panel behind a burger button.

**Markup** (`index.html`): add a `<button class="burger">` before the `<nav class="menu">`,
with `type="button"`, an `aria-label`, `aria-expanded="false"` and `aria-controls` pointing at
an `id` added to the nav.

**CSS**: the button is `display: none` above the breakpoint and shown below it; below the
breakpoint `.menu` becomes an absolutely positioned panel under the header, full width, with
the list stacked and `.menu-item` padding reset.

**JS** (`scripts/script.js`): open and close, with `aria-expanded` kept in sync. Closes on the
button, on `Escape`, and on a click outside the panel. Focus moves into the panel on open and
returns to the button on close.

One change to existing code: the loop that attaches smooth scrolling to `.menu-item > a` must
also close the panel. Without it the open panel stays over the section the link just scrolled
to.

The existing file assigns handlers as `element.onclick = function () {}`. The button follows
that convention; the document-level `keydown` and `click` listeners use `addEventListener`,
since `onclick` holds only one handler and these share `document` with anything added later.

### Hero

`.main-info { max-width: 608px }` already shrinks correctly and is left alone.

`.main-image` below 900px: `position: static`, `max-width: 100%`, `height: auto`, and the
`top: -123px` / `left: calc(100% - 991px)` offsets dropped. The image joins the flow beneath
the text and scales with the column.

**Decision recorded:** the burger stays visible on phones rather than being hidden. On a
restaurant landing the food is the point. This was assumed rather than confirmed, and is the
single easiest thing to reverse — one `display: none` in the 900px block.

### Order section

`.order-form { margin-left: 674px }` → `margin-left: auto`. On desktop the card stays flush
right exactly as now; below, it centres. No media query needed.

`.order-form-input`, its inner `input` and `.order-form-inputs .button` go from `344px` /
`342px` / `344px` to `width: 100%`. The card's padding steps down at 560px as listed under
Breakpoints.

`.order-image` gets the same treatment as the hero image at 900px: `position: static`,
`max-width: 100%`, `height: auto`, and the `right: calc(100% - 764px)` offset dropped. Its
`z-index: -1` is dropped too — it exists to sit behind the form while overlapping it, which
no longer applies once the two are stacked.

### Remaining details

- `.button { width: 260px }` gains `max-width: 100%`. `.product-button` keeps `width: 182px`
  but gains `max-width: 100%`, and its `padding: 19px 50px` becomes
  `19px clamp(16px, 5vw, 50px)` so it can shrink inside a one-column card.
- `.products-item-extra` is `display: flex; justify-content: space-between` — it gains
  `flex-wrap: wrap` and `gap: 16px` so the price and button stack on narrow cards. No
  breakpoint: wrapping happens when the content needs it.
- `.products { background-size: 1400px }` → `cover`. A background cannot cause overflow, but a
  fixed 1400px on a 390px screen shows an arbitrary crop.
- `footer .container` gains `flex-wrap: wrap` and `gap: 16px`, again without a breakpoint.

## Accessibility

- The burger button carries `aria-expanded`, `aria-controls` and an `aria-label`; the panel is
  reachable by keyboard, closes on `Escape` and returns focus to the button.
- Type floors are set so nothing drops below 16px on a phone.
- No behaviour becomes hover-only.

## Verification

Measured in a real browser against the built page, not by inspection:

1. `scrollWidth - clientWidth === 0` at 1920, 1440, 1200, 1024, 900, 768, 640, 480 and 390.
2. At ≥1200px the rendered layout is unchanged from the current published page — compared
   screenshot to screenshot.
3. Currency switching still rewrites all twelve prices and cycles `$ → ₽ → BYN → € → ¥ → $`.
4. Menu links still smooth-scroll to their sections, and the panel closes when they do.
5. Every "Заказать" button still scrolls to the order form.
6. Form validation still marks empty fields and clears on a valid pass.
7. The burger opens, closes on the button, on `Escape` and on an outside click, with
   `aria-expanded` correct at each step.
8. No console errors at any width.

## Out of scope

The `<title>` says "Бургер Чеддер" while the Open Graph title says "Burger House". Noted in
the README, unrelated to layout, left alone.
