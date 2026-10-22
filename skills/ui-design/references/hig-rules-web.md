# HIG rules — web (React / Next.js / TSX / HTML)

> Origin: raintree-technology/hig-doctor (MIT) — 4-framework subset of
> packages/core/src/patterns.ts, regex tier. The upstream ast-tsx and
> swift-structural refinement tiers are not ported; the regex definition
> is every rule's fallback tier, field-for-field equivalent here.
> Rule counts: web 122 / css 25 / flutter 21 / react-native 14, total 182.
> This file: web, 122 rules (24 concerns · 54 positives · 44 patterns) — file scope: React/Next.js TSX/JSX, plus HTML and (for the WEB_ALL-filtered rules) Vue/Svelte markup and css/scss files.
> Citations link Apple's public Human Interface Guidelines;
> no Apple source text is reproduced. HIG snapshot: 2025-02-02.

Scan: `node skills/ui-design/scripts/audit-ui.mjs <target...> --framework web` — each finding prints `file:line · ruleId · severity · fix`.
This knowledge file is the ID key for the web rules; sibling files: [hig-rules-web](hig-rules-web.md), [hig-rules-css](hig-rules-css.md), [hig-rules-flutter](hig-rules-flutter.md), [hig-rules-react-native](hig-rules-react-native.md).

Rule types: concern = a probable HIG violation (carries severity, derived from
the source's CRITICAL_CONCERNS / SERIOUS_CONCERNS sets); positive = good practice
worth crediting; pattern = neutral component usage that routes HIG reference
material. The fix column quotes the source's FIX_GUIDANCE where present.
IDs are stable public API: `// hig-disable-next-line web/<id>` suppresses a hit.

| ID | Type | Detects | Severity | Fix | HIG |
|----|------|---------|----------|-----|-----|
| `web/aria-label` | positive | an aria-label= attribute naming an element | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-describedby` | positive | an aria-describedby attribute linking to descriptive text | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-live` | positive | an aria-live region for dynamic announcements | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-expanded` | positive | aria-expanded state on disclosure controls | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-hidden` | positive | aria-hidden marking content hidden from assistive tech | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-current` | positive | aria-current marking the current item | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-invalid` | positive | aria-invalid state on a field with errors | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-errormessage` | positive | aria-errormessage linking an error description | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-required` | positive | aria-required state on required inputs | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/role-attribute` | positive | an explicit role="…" attribute | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/sr-only` | positive | a screen-reader-only utility class (sr-only, visually-hidden, screen-reader) | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/alt-text` | positive | non-empty alt="…" text on an image | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/tab-index` | positive | tabIndex={0} / tabindex="0" staying in natural focus order | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/focus-management` | positive | onFocus/onBlur handlers or ref-based focus control | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/keyboard-handler` | positive | onKeyDown/onKeyUp/onKeyPress keyboard handling | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/skip-link` | positive | a skip-to-nav / skip-to-content link | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/html-for-for-attribute` | positive | htmlFor=/for= associating a label with a control | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/missing-alt` | concern | an <img> tag with no alt attribute (document scope) | critical | Add descriptive alt text, or alt="" when the image is purely decorative. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/image-without-alt` | concern | a <Image> tag with no alt attribute (document scope) | critical | Add descriptive alt text, or alt="" when the image is purely decorative. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/svg-without-a11y` | concern | an inline <svg> with none of aria-label/aria-hidden/role (document scope) | critical | Give inline SVG role="img" plus a <title> or aria-label, or aria-hidden="true" if decorative. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/div-with-on-click-no-role` | concern | a <div> with onClick but no role attribute (document scope) | serious | Use a native <button>, or add role="button", tabIndex={0}, and Enter/Space key handling. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/span-with-on-click-no-role` | concern | a <span> with onClick but no role attribute (document scope) | serious | Use a native <button>, or add role="button", tabIndex={0}, and Enter/Space key handling. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/ambiguous-link-text` | concern | generic link text: click here / read more / learn more / here / more | serious | Write link text that names the destination; avoid "click here"/"read more". | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/positive-tabindex` | concern | tabIndex={1…} / tabindex="1…" overriding the natural focus order | serious | Use tabindex="0" (or -1); positive values override the natural focus order. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/aria-hidden-on-focusable` | concern | aria-hidden="true" immediately before focusable content (button/a/input/tabIndex) | serious | Remove aria-hidden from focusable elements, or take them out of the tab order too. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/on-mouse-over-without-on-focus` | concern | an onMouseOver handler with no paired onFocus in the same tag (document scope) | serious | Pair onMouseOver with onFocus so keyboard users get the same affordance. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/on-mouse-out-without-on-blur` | concern | an onMouseOut handler with no paired onBlur in the same tag (document scope) | serious | Pair onMouseOut with onBlur so keyboard users get the same affordance. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/auto-focus` | concern | an autoFocus/autofocus attribute forcing initial focus | moderate | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/empty-heading` | concern | an empty <h1>–<h6> heading (document scope) | critical | Add text content to the heading or remove it; screen readers announce empty headings as unlabeled. | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/empty-button` | concern | an empty <button> with no content (document scope) | critical | Give the button visible text or an aria-label. | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/div-as-button` | concern | a div with role="button" instead of a native button (document scope) | serious | Replace the div with a native <button>; it brings focus, key handling, and semantics for free. | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/div-as-nav-header-class` | concern | a div classed nav/header/footer/sidebar instead of the semantic element (document scope) | serious | Use the semantic <nav>/<header> element instead of a classed div so landmarks exist. | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/missing-html-lang` | concern | an <html> tag without a lang= attribute (.html only, document scope) | critical | Add lang="…" to the <html> element so assistive tech picks the right voice. | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/html-lang-attribute` | positive | <html lang="…"> set (.html only) | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/landmark-main` | positive | a <main> element or role="main" | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/landmark-nav` | positive | a <nav> element or role="navigation" | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/landmark-banner` | positive | role="banner" landmark | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/landmark-contentinfo` | positive | role="contentinfo" landmark | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/heading-h1` | positive | an <h1> heading present | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/heading-h2` | pattern | an <h2> heading | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/heading-h3` | pattern | an <h3> heading | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/css-variable-color` | positive | color resolved from a CSS custom property: var(--…) | — | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `web/semantic-text-color` | positive | semantic Tailwind text color tokens (text-foreground, text muted-foreground, …) | — | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `web/semantic-bg-color` | positive | semantic Tailwind background tokens (bg-background, bg-muted, …) | — | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `web/semantic-border-color` | positive | semantic Tailwind border/ring tokens (border-border, border-input, ring) | — | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `web/inline-color-style` | concern | an inline style hardcoding a #hex color | moderate | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `web/design-token-font-size` | positive | Tailwind type-scale tokens (text-xs … text-9xl) | — | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `web/font-weight-token` | positive | Tailwind font-weight tokens (font-thin … font-black) | — | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `web/hardcoded-font-size-px` | concern | hardcoded font-size in px (css/scss/tsx/jsx) | moderate | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `web/rem-em-font-size` | positive | relative font-size in rem/em | — | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `web/system-font-stack` | positive | a system font stack (-apple-system, BlinkMacSystemFont, system-ui, SF Pro) | — | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `web/dark-mode-class` | positive | the Tailwind dark: variant | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/prefers-color-scheme` | positive | prefers-color-scheme handled (css/scss/tsx/…) | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/color-scheme-property` | positive | a color-scheme: light dark declaration | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/responsive-breakpoint` | positive | Tailwind responsive breakpoints (sm:/md:/lg:/xl:/2xl:) | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/media-query` | positive | an @media(…) query | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/safe-area-inset` | positive | safe-area-inset / env(safe-area…) usage | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/container-query` | positive | an @container query | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/prefers-reduced-motion` | positive | prefers-reduced-motion honored (css/scss/tsx/…) | — | — | [motion](https://developer.apple.com/design/human-interface-guidelines/motion) |
| `web/css-animation` | pattern | @keyframes animation | — | — | [motion](https://developer.apple.com/design/human-interface-guidelines/motion) |
| `web/css-transition` | pattern | a transition: declaration | — | — | [motion](https://developer.apple.com/design/human-interface-guidelines/motion) |
| `web/min-touch-target-44px` | positive | 44–48px min touch targets (or Tailwind min-w/h-11/12) | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/nav-element` | pattern | a <nav> element | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/link-component` | pattern | a <Link> navigation component | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/use-router` | pattern | the useRouter() hook | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/use-pathname` | pattern | the usePathname() hook | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/header-element` | pattern | a <header> element | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/main-element` | pattern | a <main> element | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/footer-element` | pattern | a <footer> element | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/section-element` | pattern | a <section> element | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/aside-element` | pattern | an <aside> element | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/article-element` | pattern | an <article> element | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/grid-layout` | positive | grid layout (grid-cols / grid-template) | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/button-element` | pattern | a <button>/<Button> element | — | — | [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) |
| `web/input-element` | pattern | an <input>/<Input> element | — | — | [text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields) |
| `web/select-element` | pattern | a <select>/<Select> element | — | — | [text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields) |
| `web/textarea-element` | pattern | a <textarea>/<Textarea> element | — | — | [text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields) |
| `web/checkbox-radio` | pattern | a checkbox or radio input | — | — | [text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields) |
| `web/label-element` | positive | a <label>/<Label> element | — | — | [text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields) |
| `web/switch-toggle` | pattern | a <Switch> component or role="switch" | — | — | [toggles](https://developer.apple.com/design/human-interface-guidelines/toggles) |
| `web/form-element` | pattern | a <form>/<Form> element | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/form-validation` | positive | client-side validation: required, pattern=, minLength/maxLength | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/input-type-email` | positive | a type="email" input | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/input-type-tel` | positive | a type="tel" input | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/input-type-url` | positive | a type="url" input | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/input-type-number` | positive | a type="number" input | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/autocomplete-attribute` | positive | an autocomplete= attribute | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/fieldset-element` | positive | a <fieldset> grouping | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/legend-element` | positive | a <legend> element | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/placeholder-text` | positive | a placeholder= attribute | — | — | [entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data) |
| `web/dialog-element` | pattern | a <dialog>/<Dialog> element | — | — | [modality](https://developer.apple.com/design/human-interface-guidelines/modality) |
| `web/modal-sheet` | pattern | a <Modal>/<Sheet>/<Drawer> component | — | — | [modality](https://developer.apple.com/design/human-interface-guidelines/modality) |
| `web/alert-dialog` | pattern | an <AlertDialog> or role="alertdialog" | — | — | [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts) |
| `web/popover` | pattern | a <Popover> component | — | — | [popovers](https://developer.apple.com/design/human-interface-guidelines/popovers) |
| `web/toast-notification` | pattern | a toast/notification component (<Toast>, toast(, <Toaster>, <Sonner>) | — | — | [feedback](https://developer.apple.com/design/human-interface-guidelines/feedback) |
| `web/tooltip` | pattern | a <Tooltip> or role="tooltip" | — | — | [offering-help](https://developer.apple.com/design/human-interface-guidelines/offering-help) |
| `web/search-input` | pattern | a type="search" input | — | — | [searching](https://developer.apple.com/design/human-interface-guidelines/searching) |
| `web/search-role` | pattern | role="search" landmark | — | — | [searching](https://developer.apple.com/design/human-interface-guidelines/searching) |
| `web/dropdown-menu` | pattern | a <DropdownMenu> component | — | — | [menus](https://developer.apple.com/design/human-interface-guidelines/menus) |
| `web/context-menu` | pattern | a <ContextMenu> or onContextMenu handler | — | — | [menus](https://developer.apple.com/design/human-interface-guidelines/menus) |
| `web/menu-role` | pattern | role="menu" or role="menubar" | — | — | [menus](https://developer.apple.com/design/human-interface-guidelines/menus) |
| `web/menuitem-role` | pattern | role="menuitem" | — | — | [menus](https://developer.apple.com/design/human-interface-guidelines/menus) |
| `web/progress-bar` | pattern | a <progress>/<Progress> element or role="progressbar" | — | — | [progress-indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) |
| `web/loading-state` | pattern | loading state handling (isLoading, loading:, <Skeleton>, <Spinner>) | — | — | [loading](https://developer.apple.com/design/human-interface-guidelines/loading) |
| `web/aria-busy` | pattern | aria-busy state on busy regions | — | — | [loading](https://developer.apple.com/design/human-interface-guidelines/loading) |
| `web/next-image` | pattern | a <Image> component with src | — | — | [images](https://developer.apple.com/design/human-interface-guidelines/images) |
| `web/table-element` | pattern | a <table>/<Table> element | — | — | [lists-and-tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) |
| `web/accordion` | pattern | an <Accordion> component | — | — | [disclosure-controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls) |
| `web/card-component` | pattern | a <Card> component | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `web/list-elements` | pattern | <ul>/<ol>/<dl> lists | — | — | [lists-and-tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) |
| `web/details-summary` | pattern | a <details>/<summary> disclosure | — | — | [disclosure-controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls) |
| `web/framer-motion` | pattern | framer-motion / motion.x animation | — | — | [motion](https://developer.apple.com/design/human-interface-guidelines/motion) |
| `web/metadata-head` | positive | exported metadata, <Head>, or <title> | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/error-boundary` | positive | error boundary handling (ErrorBoundary, error.tsx) | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/i18n-l10n` | positive | i18n/l10n usage (useTranslation, i18n, intl, formatMessage, <FormattedMessage>) | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `web/analytics` | pattern | analytics instrumentation (@vercel/analytics, gtag, GoogleAnalytics) | — | — | [privacy](https://developer.apple.com/design/human-interface-guidelines/privacy) |
| `web/video-without-track` | concern | a <video> element without a <track> (document scope) | critical | Add a <track kind="captions"> file to the video. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/autoplay-media` | concern | an autoplay attribute not set to false | serious | Avoid autoplay; if unavoidable, autoplay muted with visible controls. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/blink-element` | concern | a <blink> element | critical | Remove <blink>; if emphasis is needed, use CSS animation that honors prefers-reduced-motion. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/marquee-element` | concern | a <marquee> element | critical | Remove <marquee>; use static layout or an accessible animation that honors prefers-reduced-motion. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/user-scalable-no` | concern | user-scalable=no in the viewport meta | critical | Remove user-scalable=no from the viewport meta so pinch-zoom keeps working. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `web/maximum-scale-1` | concern | maximum-scale=1 in the viewport meta | critical | Remove maximum-scale=1 from the viewport meta so users can zoom. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
