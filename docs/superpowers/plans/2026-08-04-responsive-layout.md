# Burger House Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Burger House landing page work from 320px upward without horizontal overflow, leaving the desktop rendering pixel-identical.

**Architecture:** Replace the fixed pixel sizing layer in `styles/style.css` with fluid primitives — `max-width` plus percentages, `auto-fit` grids, `clamp()` type. Add exactly two media queries, at 900px and 560px, for the header and hero, which rearrange rather than merely shrink. The burger menu adds a button to `index.html` and a handler to `scripts/script.js`.

**Tech Stack:** Plain HTML, one CSS file, one JS file. No build step, no dependencies, no framework. GitHub Pages serves the repository root of `main`.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-08-04-responsive-layout-design.md`.
- No build step, no `package.json`, no dependencies may be introduced.
- Desktop rendering at viewports ≥1240px must be unchanged. Every task verifies this.
- Only two media queries in the finished file: `max-width: 900px` and `max-width: 560px`.
- No redesign: colours, fonts, imagery and section order stay as they are.
- Existing behaviour — currency switching, smooth scrolling, order buttons, form validation — must keep working.
- There is no test runner in this project and none may be added. Verification is browser DOM measurement with expected values, run against a local HTTP server. Playwright blocks the `file:` protocol, so the server is not optional.
- Repository working copy for this work: `C:\Users\ANNATO~1\AppData\Local\Temp\claude\C--Users-AnnaTolstoukhova-Desktop-Projects\6d23dd45-6573-4b02-9fd4-87f994aa47dd\scratchpad\burgers`
- Commit messages in English, matching the existing history.

---

### Task 1: Verification harness and container gutters

**Files:**
- Create: `<scratchpad>/serve-burgers.js` (outside the repository — must not be committed)
- Modify: `styles/style.css:25-29`

**Interfaces:**
- Consumes: nothing.
- Produces: a local server on port 8130 serving the repository root, used by every later task. The measurement snippet `overflowAt()` defined in Step 1 is re-stated in full in each task that needs it.

- [ ] **Step 1: Write the server outside the repository**

Write to `C:\Users\ANNATO~1\AppData\Local\Temp\claude\C--Users-AnnaTolstoukhova-Desktop-Projects\6d23dd45-6573-4b02-9fd4-87f994aa47dd\scratchpad\serve-burgers.js`:

```js
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\ANNATO~1\\AppData\\Local\\Temp\\claude\\C--Users-AnnaTolstoukhova-Desktop-Projects\\6d23dd45-6573-4b02-9fd4-87f994aa47dd\\scratchpad\\burgers';
const mime = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(root, urlPath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found: ' + filePath); return; }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}).listen(8130, () => console.log('listening on 8130'));
```

Start it in the background:

```bash
node "C:/Users/ANNATO~1/AppData/Local/Temp/claude/C--Users-AnnaTolstoukhova-Desktop-Projects/6d23dd45-6573-4b02-9fd4-87f994aa47dd/scratchpad/serve-burgers.js"
```

- [ ] **Step 2: Measure the current overflow and record the baseline**

Navigate to `http://localhost:8130/index.html`, set the viewport to 390×844, and evaluate:

```js
() => {
  const de = document.documentElement;
  return { viewport: de.clientWidth, scrollWidth: de.scrollWidth, overflow: de.scrollWidth - de.clientWidth };
}
```

Expected now: `overflow` is a large positive number (roughly 825 at 390px). This is the failing state.

Then set the viewport to 1280×800 and evaluate:

```js
() => {
  const c = document.querySelector('.container');
  const cs = getComputedStyle(c);
  const p = document.querySelector('.products-items');
  return {
    // Content box, not getBoundingClientRect(): once the container has padding
    // the border box is 1240 while the content the layout is built on is 1200.
    contentWidth: Math.round(c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)),
    firstCardWidth: Math.round(p.firstElementChild.getBoundingClientRect().width),
  };
}
```

Expected now: `contentWidth` 1200, `firstCardWidth` 384. **Write these two numbers down — every later task re-checks them and they must not change.**

- [ ] **Step 3: Give the container gutters**

In `styles/style.css`, replace:

```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    /*центрирование контейнера */
}
```

with:

```css
.container {
    /* 1240 rather than 1200: with border-box the 20px gutters come out of the
       max-width, so 1200 would shrink the content box to 1160 and shift the
       whole desktop layout. At 1240 the content box stays exactly 1200. */
    max-width: 1240px;
    margin: 0 auto;
    padding-inline: 20px;
    box-sizing: border-box;
}
```

- [ ] **Step 4: Verify the desktop is unchanged and narrow screens have gutters**

At 1280×800, evaluate the same snippet as Step 2.
Expected: `contentWidth` 1200, `firstCardWidth` 384 — identical to the baseline.

At 390×844, evaluate:

```js
() => {
  const c = document.querySelector('.container');
  const cs = getComputedStyle(c);
  // The container's border box spans the full viewport at this width, so its
  // own left edge is 0. The gutter is inside it — measure the padding, and a
  // child's inset from the screen edge.
  const child = c.firstElementChild.getBoundingClientRect();
  return {
    paddingLeft: cs.paddingLeft,
    paddingRight: cs.paddingRight,
    firstChildLeft: Math.round(child.left),
  };
}
```

Expected: `paddingLeft` and `paddingRight` both `"20px"`, and `firstChildLeft` 20 — content no longer touches the screen edge. Overflow is still large; later tasks remove it.

- [ ] **Step 5: Commit**

```bash
git add styles/style.css
git commit -m "Give the container horizontal gutters

max-width goes to 1240 so that with border-box the 20px gutters leave the
content box at exactly 1200 and the desktop layout does not move."
```

---

### Task 2: Fluid type scale

**Files:**
- Modify: `styles/style.css:56-63` (`.common-title`), `:155-163` (`.main-title`), `:165-169` (`.main-text`)

**Interfaces:**
- Consumes: the container from Task 1.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Measure the current headline sizes**

At 390×844, evaluate:

```js
() => {
  const g = (s) => { const e = document.querySelector(s); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null; };
  return { mainTitle: g('.main-title'), commonTitle: g('.common-title'), mainText: g('.main-text') };
}
```

Expected now: `{ mainTitle: 120, commonTitle: 64, mainText: 24 }` — full desktop sizes on a phone. This is the failing state.

- [ ] **Step 2: Replace the three fixed sizes**

In `styles/style.css`, in `.common-title` replace:

```css
    font-size: 64px;
    line-height: 80px;
```

with:

```css
    font-size: clamp(28px, 5.5vw, 64px);
    /* was 80px — a fixed line-height does not survive a shrinking font-size */
    line-height: 1.25;
```

In `.main-title` replace:

```css
    font-size: 120px;
```

with:

```css
    font-size: clamp(40px, 9vw, 120px);
```

In `.main-text` replace:

```css
    font-size: 24px;
    line-height: 29px;
```

with:

```css
    font-size: clamp(18px, 2.2vw, 24px);
    line-height: 1.2;
```

- [ ] **Step 3: Verify the phone sizes shrink and the desktop does not**

At 390×844, evaluate the Step 1 snippet.
Expected: `mainTitle` 40, `commonTitle` 28, `mainText` 18 — all at their floors.

At 1440×900, evaluate the Step 1 snippet.
Expected: `{ mainTitle: 120, commonTitle: 64, mainText: 24 }` — the original desktop sizes.

- [ ] **Step 4: Commit**

```bash
git add styles/style.css
git commit -m "Scale the display type with the viewport

The three display sizes were fixed at their desktop values, so a phone got
a 120px headline. clamp() floors them at 40/28/18 and leaves the desktop
sizes untouched. .common-title and .main-text also lose their fixed
line-heights, which do not survive a shrinking font-size."
```

---

### Task 3: Card grids become auto-fit

**Files:**
- Modify: `styles/style.css:187-197` (`.why-items`), `:226-231` (`.products-items`)

**Interfaces:**
- Consumes: the container from Task 1.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Measure the grids at three widths**

Evaluate at 1280×800, then 800×900, then 390×844:

```js
() => {
  const cols = (s) => getComputedStyle(document.querySelector(s)).gridTemplateColumns.split(' ').length;
  const de = document.documentElement;
  return { viewport: de.clientWidth, overflow: de.scrollWidth - de.clientWidth, whyCols: cols('.why-items'), productCols: cols('.products-items') };
}
```

Expected now: three columns at every width, and a large positive `overflow` at 800 and 390. This is the failing state.

- [ ] **Step 2: Replace both grid definitions**

In `styles/style.css`, replace:

```css
.why-items {
    margin-top: 60px;
    /* для табличного вида */
    display: grid;
    gap: 100px;
    /* jрасстояние между*/
    grid-template-columns: repeat(3, 312px);
    /*  одинаковые колонки с одним размером*/
    justify-content: center;

}
```

with:

```css
.why-items {
    margin-top: 60px;
    display: grid;
    gap: clamp(32px, 6vw, 100px);
    /* Capped at 312px rather than 1fr: at 1fr the three columns would stretch
       to 333px in a 1200px content box and the desktop layout would shift. */
    grid-template-columns: repeat(auto-fit, minmax(260px, 312px));
    justify-content: center;
}
```

and replace:

```css
.products-items {
    display: grid;
    grid-template-columns: repeat(3, 384px);
    gap: 24px;
    margin-top: 60px;
}
```

with:

```css
.products-items {
    display: grid;
    /* In a 1200px content box this computes to exactly the 384px the cards
       were hard-coded to. Four columns would need 1272px, so it stays three. */
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-top: 60px;
}
```

- [ ] **Step 3: Verify the column counts and that the desktop cards keep their width**

At 1280×800, evaluate:

```js
() => {
  const p = document.querySelector('.products-items');
  const w = document.querySelector('.why-items');
  return {
    productCols: getComputedStyle(p).gridTemplateColumns.split(' ').length,
    firstCardWidth: Math.round(p.firstElementChild.getBoundingClientRect().width),
    whyCols: getComputedStyle(w).gridTemplateColumns.split(' ').length,
    firstWhyWidth: Math.round(w.firstElementChild.getBoundingClientRect().width),
  };
}
```

Expected: `productCols` 3, `firstCardWidth` 384, `whyCols` 3, `firstWhyWidth` 312 — all unchanged from the current desktop.

At 800×900, evaluate the Step 1 snippet. Expected: `productCols` 2.
At 390×844, evaluate the Step 1 snippet. Expected: `productCols` 1, `whyCols` 1.

- [ ] **Step 4: Commit**

```bash
git add styles/style.css
git commit -m "Let the card grids reflow

Both rows declared three fixed columns, which is what pinned the document
at 1200px. auto-fit with a minimum track drops them to two and then one
column on their own, with no media query. The minimum tracks are chosen so
that at a 1200px content box the columns still compute to the widths the
cards have today."
```

---

### Task 4: Order form and its inputs go fluid

**Files:**
- Modify: `styles/style.css:311-322` (`.order-form`), `:336-345` (`.order-form-input`), `:347-357` (`.order-form-input input`), `:359-363` (`.order-form-inputs .button`)

**Interfaces:**
- Consumes: the container from Task 1.
- Produces: `.order-form` keeps `margin-left: auto`, which Task 6 overrides inside the 900px block.

- [ ] **Step 1: Measure the form's position and input widths**

At 1280×800, evaluate:

```js
() => {
  const f = document.querySelector('.order-form');
  const c = f.closest('.container');
  // Measure from the container's CONTENT edge, not its border box — the
  // container carries 20px of padding, so the two differ by 20.
  const contentLeft = c.getBoundingClientRect().left + parseFloat(getComputedStyle(c).paddingLeft);
  const r = f.getBoundingClientRect();
  return { offsetFromContentLeft: Math.round(r.left - contentLeft), formWidth: Math.round(r.width), inputWidth: Math.round(document.querySelector('.order-form-input').getBoundingClientRect().width) };
}
```

Expected now: `offsetFromContentLeft` 674, `formWidth` 426, `inputWidth` 344. **These are the desktop values to preserve.**

At 390×844, evaluate the same snippet. Expected now: the form still sits 674px in and is 426px wide, far outside the screen. This is the failing state.

- [ ] **Step 2: Replace the hard offset and the fixed input widths**

In `styles/style.css`, in `.order-form` replace:

```css
    margin-left: 674px;
```

with:

```css
    /* The card is not flush right: at 674px in a 1200px container it leaves a
       100px gutter. margin-left alone would move it 100px right of where it
       sits today, so the gutter is stated. Both become auto below 900px. */
    margin-left: auto;
    margin-right: 100px;
```

In `.order-form-input` replace:

```css
    width: 344px;
```

with:

```css
    width: 100%;
```

In `.order-form-input input` replace:

```css
    width: 342px;
```

with:

```css
    width: 100%;
```

In `.order-form-inputs .button` replace:

```css
    width: 344px;
```

with:

```css
    width: 100%;
```

- [ ] **Step 3: Verify the desktop position holds and the form fits a phone**

At 1280×800, evaluate the Step 1 snippet.
Expected: `offsetFromContentLeft` 674, `formWidth` 426, `inputWidth` 344 — identical to the baseline.

At 390×844, evaluate:

```js
() => {
  const f = document.querySelector('.order-form');
  const r = f.getBoundingClientRect();
  return { right: Math.round(r.right), viewport: document.documentElement.clientWidth, fits: r.right <= document.documentElement.clientWidth };
}
```

Expected: `fits` is `true`.

- [ ] **Step 4: Commit**

```bash
git add styles/style.css
git commit -m "Let the order form and its inputs shrink

The card was positioned with margin-left: 674px and its three controls were
fixed at 344/342/344px inside a 426px box. The offset becomes auto with the
existing 100px gutter stated explicitly, so the desktop position is
unchanged, and the controls fill their container instead."
```

---

### Task 5: Buttons, card footer, page footer and the fixed background

**Files:**
- Modify: `styles/style.css:31-50` (`.button`), `:261-264` (`.products-item-extra`), `:279-286` (`.button.product-button`), `:217-224` (`.products`), `:369-373` (`footer .container`)

**Interfaces:**
- Consumes: the grids from Task 3.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Measure a card's price row on a phone**

At 390×844, evaluate:

```js
() => {
  const extra = document.querySelector('.products-item-extra');
  const card = extra.closest('.products-item').getBoundingClientRect();
  const r = extra.getBoundingClientRect();
  return { cardWidth: Math.round(card.width), extraRight: Math.round(r.right), cardRight: Math.round(card.right), overflowsCard: r.right > card.right + 0.5 };
}
```

Expected now: `overflowsCard` is `true` — the 182px button plus the price does not fit a one-column card. This is the failing state.

- [ ] **Step 2: Let the buttons and rows shrink**

In `styles/style.css`, in `.button` add after `width: 260px;`:

```css
    max-width: 100%;
```

Replace `.products-item-extra`:

```css
.products-item-extra {
    display: flex;
    justify-content: space-between;
}
```

with:

```css
.products-item-extra {
    display: flex;
    justify-content: space-between;
    /* No breakpoint: the row wraps when the price and button stop fitting. */
    flex-wrap: wrap;
    gap: 16px;
}
```

In `.button.product-button` replace:

```css
    padding: 19px 50px;
    width: 182px;
```

with:

```css
    padding: 19px clamp(16px, 5vw, 50px);
    width: 182px;
    max-width: 100%;
```

In `.products` replace:

```css
    background-size: 1400px;
```

with:

```css
    background-size: cover;
```

Replace `footer .container`:

```css
footer .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
```

with:

```css
footer .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
}
```

- [ ] **Step 3: Verify nothing overflows its card and the desktop is unchanged**

At 390×844, evaluate the Step 1 snippet. Expected: `overflowsCard` is `false`.

At 1280×800, evaluate:

```js
() => {
  const b = document.querySelector('.button.product-button').getBoundingClientRect();
  const e = document.querySelector('.products-item-extra');
  return { buttonWidth: Math.round(b.width), buttonHeight: Math.round(b.height), extraWrapped: e.getBoundingClientRect().height > 80 };
}
```

Expected: `buttonWidth` 182, `buttonHeight` 62, `extraWrapped` false — the desktop row still sits on one line at its original size.

- [ ] **Step 4: Commit**

```bash
git add styles/style.css
git commit -m "Let buttons and rows wrap instead of overflowing

The order button was a fixed 260px, the card button 182px with 50px of
horizontal padding, and the price row never wrapped, so a one-column card
overflowed. The products background was also pinned at 1400px, which showed
an arbitrary crop on a phone."
```

---

### Task 6: Hero and order images join the flow at 900px

**Files:**
- Modify: `styles/style.css` — append the first media query at the end of the file

**Interfaces:**
- Consumes: `.order-form`'s `margin-left: auto; margin-right: 100px` from Task 4, which this task overrides.
- Produces: a `@media (max-width: 900px)` block that Task 7 adds the navigation rules to. Task 7 must extend this same block, not open a second one.

- [ ] **Step 1: Measure the two images on a tablet**

At 800×900, evaluate:

```js
() => {
  const m = document.querySelector('.main-image');
  const o = document.querySelector('.order-image');
  const de = document.documentElement;
  return {
    overflow: de.scrollWidth - de.clientWidth,
    mainPosition: getComputedStyle(m).position,
    mainRight: Math.round(m.getBoundingClientRect().right),
    orderPosition: getComputedStyle(o).position,
    viewport: de.clientWidth,
  };
}
```

Expected now: both `position` values are `absolute` and `mainRight` far exceeds `viewport`. This is the failing state.

- [ ] **Step 2: Append the 900px block**

Append to the end of `styles/style.css`:

```css
/* ── Below 900px the header and the hero rearrange rather than just shrink ── */
@media (max-width: 900px) {
    /* Both decorative burgers are positioned absolutely against a 1200px
       layout. Below this width they join the flow and scale with the column,
       so the food stays visible on a phone instead of being cropped away. */
    .main-image,
    .order-image {
        position: static;
        max-width: 100%;
        height: auto;
    }

    .order-image {
        /* Only needed to sit behind the overlapping form on desktop. */
        z-index: auto;
    }

    .order-form {
        margin-left: auto;
        margin-right: auto;
    }
}
```

- [ ] **Step 3: Verify the images are in the flow and fit**

At 800×900, evaluate the Step 1 snippet.
Expected: `mainPosition` and `orderPosition` are both `static`, and `mainRight` is less than or equal to `viewport`.

At 1280×800, evaluate:

```js
() => {
  const m = document.querySelector('.main-image');
  const f = document.querySelector('.order-form');
  const c = f.closest('.container');
  const contentLeft = c.getBoundingClientRect().left + parseFloat(getComputedStyle(c).paddingLeft);
  return { mainPosition: getComputedStyle(m).position, formOffset: Math.round(f.getBoundingClientRect().left - contentLeft) };
}
```

Expected: `mainPosition` is `absolute` and `formOffset` is 674 — the desktop is untouched.

- [ ] **Step 4: Commit**

```bash
git add styles/style.css
git commit -m "Bring the decorative images into the flow below 900px

Both burgers are absolutely positioned with calc() offsets tuned to a 1200px
layout. Below 900px they become static and scale with the column, and the
order form centres instead of hugging the right gutter."
```

---

### Task 7: Burger menu below 900px

**Files:**
- Modify: `index.html` — the `<header class="header">` block
- Modify: `styles/style.css` — the `@media (max-width: 900px)` block created in Task 6, plus a new `.burger` rule above it
- Modify: `scripts/script.js` — append the handler, and change the existing menu-link loop

**Interfaces:**
- Consumes: the `@media (max-width: 900px)` block from Task 6. Add to that block; do not open a second one.
- Produces: `#main-menu` as the id of `<nav class="menu">`, and `.burger` as the toggle button class. Nothing later depends on them.

- [ ] **Step 1: Measure the header on a phone**

At 390×844, evaluate:

```js
() => {
  const menu = document.querySelector('.menu');
  const r = menu.getBoundingClientRect();
  return { menuRight: Math.round(r.right), viewport: document.documentElement.clientWidth, fits: r.right <= document.documentElement.clientWidth, burgerExists: !!document.querySelector('.burger') };
}
```

Expected now: `fits` is `false` and `burgerExists` is `false`. This is the failing state.

- [ ] **Step 2: Add the button and the nav id**

In `index.html`, replace:

```html
                <nav class="menu">
```

with:

```html
                <button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="main-menu">
                    <span class="burger-line"></span>
                    <span class="burger-line"></span>
                    <span class="burger-line"></span>
                </button>
                <nav class="menu" id="main-menu">
```

- [ ] **Step 3: Style the button and the panel**

In `styles/style.css`, add immediately before the `@media (max-width: 900px)` block:

```css
.burger {
    /* Hidden on desktop; the 900px block turns it on. */
    display: none;
    width: 45px;
    height: 45px;
    padding: 10px;
    box-sizing: border-box;
    margin-left: auto;
    background: transparent;
    border: 1px solid #FFF;
    border-radius: 5px;
    cursor: pointer;
    flex-direction: column;
    justify-content: space-between;
}

.burger-line {
    display: block;
    height: 2px;
    width: 100%;
    background: #FFF;
}
```

Then add inside the existing `@media (max-width: 900px)` block, after the `.order-form` rule:

```css
    .burger {
        display: flex;
        order: 2;
    }

    .currency {
        order: 3;
        margin-left: 16px;
    }

    .header .container {
        flex-wrap: wrap;
    }

    .menu {
        /* Full-width panel under the header row. order: 4 puts it on the
           second flex line, below the logo, burger and currency. */
        order: 4;
        display: none;
        width: 100%;
        margin-left: 0;
        margin-top: 20px;
    }

    .menu.is-open {
        display: block;
    }

    .menu-list {
        flex-direction: column;
        gap: 20px;
    }

    .menu-item {
        padding-right: 0;
    }
```

- [ ] **Step 4: Make the menu links fluid above the breakpoint too**

In `styles/style.css`, in `.menu` replace:

```css
    margin-left: 191px;
```

with:

```css
    /* Not auto: .currency already has margin-left: auto, and two auto margins
       split the free space between them, which would move the menu 21px left
       on desktop. 16vw reaches 191px at any viewport ≥1194, so the desktop is
       unchanged, and it shrinks through the 900-1240 range where the row has
       to compress. */
    margin-left: clamp(24px, 16vw, 191px);
```

and in `.menu-item` replace:

```css
    padding-right: 88px;
```

with:

```css
    padding-right: clamp(24px, 4vw, 88px);
```

- [ ] **Step 5: Wire the button up**

Append to `scripts/script.js`:

```js
// Бургер-меню на узких экранах
let burgerButton = document.querySelector(".burger");
let mainMenu = document.getElementById("main-menu");

function setMenuOpen(open) {
    mainMenu.classList.toggle("is-open", open);
    burgerButton.setAttribute("aria-expanded", String(open));
    burgerButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
}

burgerButton.onclick = function (event) {
    event.stopPropagation();
    setMenuOpen(!mainMenu.classList.contains("is-open"));
};

// document уже используется другими обработчиками, поэтому addEventListener,
// а не onclick — он держит только один обработчик.
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mainMenu.classList.contains("is-open")) {
        setMenuOpen(false);
        burgerButton.focus();
    }
});

document.addEventListener("click", function (event) {
    if (mainMenu.classList.contains("is-open") && !mainMenu.contains(event.target)) {
        setMenuOpen(false);
    }
});
```

- [ ] **Step 6: Close the panel when a link scrolls**

In `scripts/script.js`, replace:

```js
for(let i = 0; i < Links.length; i++) {
    Links[i].onclick = function () {
        document.getElementById(Links[i].getAttribute("data-link")).scrollIntoView({ behavior: "smooth" });
    }
}
```

with:

```js
for(let i = 0; i < Links.length; i++) {
    Links[i].onclick = function () {
        // Панель перекрыла бы секцию, к которой сейчас проскроллит.
        setMenuOpen(false);
        document.getElementById(Links[i].getAttribute("data-link")).scrollIntoView({ behavior: "smooth" });
    }
}
```

Note: `setMenuOpen` is defined later in the file than this loop, but function declarations are hoisted, so the call resolves. `burgerButton` and `mainMenu` are `let` bindings assigned at load time, before any click can fire.

- [ ] **Step 7: Verify the menu opens, closes and stays out of the way**

At 390×844, evaluate:

```js
async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const b = document.querySelector('.burger');
  const m = document.getElementById('main-menu');
  const vis = () => getComputedStyle(m).display;
  const out = [];
  out.push({ step: 'initial', display: vis(), expanded: b.getAttribute('aria-expanded') });
  b.click(); await sleep(50);
  out.push({ step: 'opened', display: vis(), expanded: b.getAttribute('aria-expanded') });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await sleep(50);
  out.push({ step: 'escape', display: vis(), expanded: b.getAttribute('aria-expanded') });
  b.click(); await sleep(50);
  document.body.click(); await sleep(50);
  out.push({ step: 'outside click', display: vis(), expanded: b.getAttribute('aria-expanded') });
  return out;
}
```

Expected: `initial` display `none` / expanded `false`; `opened` display `block` / `true`; `escape` display `none` / `false`; `outside click` display `none` / `false`.

At 1280×800, evaluate:

```js
() => {
  const b = document.querySelector('.burger');
  const m = document.getElementById('main-menu');
  return { burgerDisplay: getComputedStyle(b).display, menuDisplay: getComputedStyle(m).display, menuListDirection: getComputedStyle(document.querySelector('.menu-list')).flexDirection };
}
```

Expected: `burgerDisplay` `none`, `menuDisplay` `block`, `menuListDirection` `row` — the desktop header is untouched.

Also confirm the menu did not shift. At 1280×800, evaluate:

```js
() => {
  const m = document.querySelector('.menu');
  const c = m.closest('.container');
  const contentLeft = c.getBoundingClientRect().left + parseFloat(getComputedStyle(c).paddingLeft);
  return { offsetFromContentLeft: Math.round(m.getBoundingClientRect().left - contentLeft) };
}
```

Expected: 348 — the same offset the menu has before this task, since `157 + 191 = 348`.

- [ ] **Step 8: Commit**

```bash
git add index.html styles/style.css scripts/script.js
git commit -m "Add a burger menu below 900px

Three long labels plus the logo and the currency badge do not fit one row on
a phone. Below 900px the links move into a panel behind a button that keeps
aria-expanded in sync and closes on Escape or an outside click.

The smooth-scroll loop now closes the panel first, otherwise it covers the
section the link just scrolled to."
```

---

### Task 8: Vertical rhythm at 560px, then the full sweep

**Files:**
- Modify: `styles/style.css` — append the second media query at the end of the file

**Interfaces:**
- Consumes: everything above.
- Produces: the finished stylesheet.

- [ ] **Step 1: Measure the section padding on a phone**

At 390×844, evaluate:

```js
() => {
  const p = (s) => Math.round(parseFloat(getComputedStyle(document.querySelector(s)).paddingBottom));
  return { why: p('.why'), products: p('.products'), order: p('.order'), mainContentTop: Math.round(parseFloat(getComputedStyle(document.querySelector('.main-content')).paddingTop)) };
}
```

Expected now: `{ why: 180, products: 180, order: 180, mainContentTop: 103 }` — desktop spacing on a 390px screen. This is the failing state.

- [ ] **Step 2: Append the 560px block**

Append to the end of `styles/style.css`:

```css
/* ── Below 560px the vertical rhythm steps down ── */
@media (max-width: 560px) {
    .why,
    .products,
    .order {
        padding-bottom: 80px;
    }

    .main-content {
        padding-top: 48px;
        padding-bottom: 96px;
    }

    .order-form {
        padding: 40px 24px;
    }
}
```

- [ ] **Step 3: Verify the spacing steps down and the desktop does not**

At 390×844, evaluate the Step 1 snippet.
Expected: `{ why: 80, products: 80, order: 80, mainContentTop: 48 }`.

At 1280×800, evaluate the Step 1 snippet.
Expected: `{ why: 180, products: 180, order: 180, mainContentTop: 103 }`.

- [ ] **Step 4: Sweep every width for overflow**

For each of 1920, 1440, 1280, 1024, 900, 768, 640, 480, 390 and 320, set the viewport and evaluate:

```js
() => {
  const de = document.documentElement;
  return { viewport: de.clientWidth, scrollWidth: de.scrollWidth, overflow: de.scrollWidth - de.clientWidth };
}
```

Expected: `overflow` is 0 at every width. If any width fails, find the offending element with:

```js
() => {
  const limit = document.documentElement.clientWidth;
  return [...document.querySelectorAll('*')]
    .filter(el => el.getBoundingClientRect().right > limit + 0.5)
    .slice(0, 5)
    .map(el => ({ tag: el.tagName.toLowerCase(), cls: String(el.className), right: Math.round(el.getBoundingClientRect().right) }));
}
```

- [ ] **Step 5: Confirm the existing behaviour still works**

At 390×844, evaluate:

```js
async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const btn = document.getElementById('change-currency');
  const price = () => document.querySelector('.products-item-price').innerText;
  const before = price();
  btn.click(); await sleep(60);
  const after = price();
  return {
    currencyChanged: before !== after,
    sample: before + ' -> ' + after,
    priceCount: document.querySelectorAll('.products-item-price').length,
    orderButtons: document.querySelectorAll('.product-button').length,
    menuLinks: document.querySelectorAll('.menu-item > a').length,
    consoleClean: true,
  };
}
```

Expected: `currencyChanged` true, `sample` `8 $ -> 640 ₽`, `priceCount` 12, `orderButtons` 12, `menuLinks` 3. Also check the browser console shows zero errors.

- [ ] **Step 6: Confirm the media query count**

```bash
grep -c '@media' styles/style.css
```

Expected: `2`.

- [ ] **Step 7: Commit and push**

```bash
git add styles/style.css
git commit -m "Step the vertical rhythm down below 560px

The sections carried 180px of desktop padding on a phone. Verified zero
horizontal overflow from 320 to 1920, with the currency switcher, smooth
scrolling, order buttons and form validation all still working."
git push origin main
```

- [ ] **Step 8: Verify the deployed page**

Wait for the `pages-build-deployment` run to complete, then load
`https://tecna-developer.github.io/burgers-itlogia/?v=responsive` and repeat the Step 4 sweep
and the Step 5 behaviour check against the live page.

Expected: identical results. Then stop the local server and delete `serve-burgers.js`.

---

## Self-Review

**Spec coverage:** Container gutters → Task 1. Type scale → Task 2. Both grids → Task 3. Order
form and inputs → Task 4. Buttons, `.products-item-extra`, footer, `background-size` → Task 5.
900px block, both images, `z-index` → Task 6. Burger menu markup, CSS, JS and the smooth-scroll
change → Task 7. 560px spacing → Task 8. Accessibility requirements → Task 7 Steps 2, 5 and 7.
Verification list → Task 8 Steps 4, 5 and 8. No spec section is unimplemented.

**Placeholder scan:** No TBD, TODO, "similar to Task N", or steps without code. Every CSS and JS
change is shown in full.

**Type consistency:** `setMenuOpen(open)` is defined in Task 7 Step 5 and called in Step 6 with
the same name and signature. `#main-menu` is introduced in Step 2 and referenced in Steps 3, 5
and 7. `.burger` and `.burger-line` are introduced in Step 2 and styled in Step 3. The
`@media (max-width: 900px)` block is created in Task 6 and extended — not duplicated — in
Task 7, which Task 8's `grep -c '@media'` check confirms.
