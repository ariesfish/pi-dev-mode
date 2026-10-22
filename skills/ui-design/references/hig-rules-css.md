# HIG rules — css (CSS / SCSS / Sass / Less)

> Origin: raintree-technology/hig-doctor (MIT) — 4-framework subset of
> packages/core/src/patterns.ts, regex tier. The upstream ast-tsx and
> swift-structural refinement tiers are not ported; the regex definition
> is every rule's fallback tier, field-for-field equivalent here.
> Rule counts: web 122 / css 25 / flutter 21 / react-native 14, total 182.
> This file: css, 25 rules (10 concerns · 14 positives · 1 patterns) — file scope: css/scss/sass/less stylesheets.
> Citations link Apple's public Human Interface Guidelines;
> no Apple source text is reproduced. HIG snapshot: 2025-02-02.

Scan: `node skills/ui-design/scripts/audit-ui.mjs <target...> --framework css` — each finding prints `file:line · ruleId · severity · fix`.
This knowledge file is the ID key for the css rules; sibling files: [hig-rules-web](hig-rules-web.md), [hig-rules-css](hig-rules-css.md), [hig-rules-flutter](hig-rules-flutter.md), [hig-rules-react-native](hig-rules-react-native.md).

Rule types: concern = a probable HIG violation (carries severity, derived from
the source's CRITICAL_CONCERNS / SERIOUS_CONCERNS sets); positive = good practice
worth crediting; pattern = neutral component usage that routes HIG reference
material. The fix column quotes the source's FIX_GUIDANCE where present.
IDs are stable public API: `// hig-disable-next-line css/<id>` suppresses a hit.

| ID | Type | Detects | Severity | Fix | HIG |
|----|------|---------|----------|-----|-----|
| `css/css-custom-property-def` | positive | a design-token custom property definition (--name: …) | — | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `css/hardcoded-hex-in-css` | concern | a hardcoded #hex value in color/background/border | moderate | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `css/clamp-font-size` | positive | a fluid clamp() font-size | — | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `css/font-size-below-12px` | concern | font-size below 12px | moderate | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `css/text-align-justify` | concern | text-align: justify | moderate | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `css/line-height-below-1-2` | concern | line-height below 1.2 | moderate | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `css/max-width-on-text` | positive | text measure limited with ch units | — | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `css/focus-visible` | positive | :focus-visible styling | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `css/focus-ring-styles` | positive | focus ring styles (outline + focus, or ring-) | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `css/high-contrast` | positive | forced-colors / high-contrast / prefers-contrast handling | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `css/outline-none` | concern | outline: none/0 removing the focus indicator (skipped inside :focus:not(:focus-visible) and @media print blocks) | serious | Keep a visible focus indicator — style :focus-visible instead of removing the outline. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `css/hover-without-focus` | concern | :hover styling with no :focus anywhere in the file (document scope, one finding per file) | moderate | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `css/print-styles` | positive | @media print styles | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/logical-properties` | positive | logical properties (margin-inline, padding-inline, border-inline, inset-inline) | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/flexbox-gap` | positive | layout spacing via gap: | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/aspect-ratio` | positive | aspect-ratio: usage | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/overflow-hidden-on-body` | concern | overflow: hidden on body | moderate | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/touch-target-sizing` | positive | 44–48px min touch targets | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `css/extreme-z-index` | concern | z-index of 1000+ | moderate | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/important-usage` | concern | !important usage (skipped inside @media print / prefers-reduced-motion blocks) | moderate | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/custom-scrollbar` | pattern | custom scrollbar styling (-webkit-scrollbar, scrollbar-width) | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `css/rtl-direction` | positive | RTL support (direction: rtl or [dir="rtl"]) | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `css/logical-text-align` | positive | logical text-align: start/end | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `css/logical-margin-padding` | positive | logical direction margin/padding (-inline-start/-inline-end) | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `css/physical-text-align` | concern | physical text-align: left/right (breaks under RTL) | moderate | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
