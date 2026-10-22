# HIG rules — flutter (Dart)

> Origin: raintree-technology/hig-doctor (MIT) — 4-framework subset of
> packages/core/src/patterns.ts, regex tier. The upstream ast-tsx and
> swift-structural refinement tiers are not ported; the regex definition
> is every rule's fallback tier, field-for-field equivalent here.
> Rule counts: web 122 / css 25 / flutter 21 / react-native 14, total 182.
> This file: flutter, 21 rules (3 concerns · 11 positives · 7 patterns) — file scope: Dart (.dart) sources.
> Citations link Apple's public Human Interface Guidelines;
> no Apple source text is reproduced. HIG snapshot: 2025-02-02.

Scan: `node skills/ui-design/scripts/audit-ui.mjs <target...> --framework flutter` — each finding prints `file:line · ruleId · severity · fix`.
This knowledge file is the ID key for the flutter rules; sibling files: [hig-rules-web](hig-rules-web.md), [hig-rules-css](hig-rules-css.md), [hig-rules-flutter](hig-rules-flutter.md), [hig-rules-react-native](hig-rules-react-native.md).

Rule types: concern = a probable HIG violation (carries severity, derived from
the source's CRITICAL_CONCERNS / SERIOUS_CONCERNS sets); positive = good practice
worth crediting; pattern = neutral component usage that routes HIG reference
material. The fix column quotes the source's FIX_GUIDANCE where present.
IDs are stable public API: `// hig-disable-next-line flutter/<id>` suppresses a hit.

| ID | Type | Detects | Severity | Fix | HIG |
|----|------|---------|----------|-----|-----|
| `flutter/semantics-widget` | positive | a Semantics( wrapper providing custom semantics | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `flutter/exclude-semantics` | positive | an ExcludeSemantics( wrapper | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `flutter/merge-semantics` | positive | a MergeSemantics( wrapper merging the subtree | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `flutter/semantic-label` | positive | a semanticLabel: parameter naming a widget | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `flutter/theme-color` | positive | a color from Theme.of(context).colorScheme | — | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `flutter/hardcoded-color` | concern | a hardcoded Color(0x…) literal | moderate | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `flutter/colors-red-blue` | concern | a material palette constant (Colors.red, Colors.blue, Colors.green, …) | moderate | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `flutter/theme-text-style` | positive | a text style from Theme.of(context).textTheme | — | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `flutter/hardcoded-font-size` | concern | a hardcoded fontSize: value | moderate | — | [typography](https://developer.apple.com/design/human-interface-guidelines/typography) |
| `flutter/brightness-detection` | positive | dark-mode detection via MediaQuery platformBrightness | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `flutter/dark-theme` | positive | a darkTheme: parameter wired in | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `flutter/media-query-responsive` | positive | MediaQuery size-driven layout | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `flutter/layout-builder` | positive | a LayoutBuilder responding to parent constraints | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `flutter/navigator` | pattern | imperative Navigator routing | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `flutter/cupertino-tab-bar` | pattern | a CupertinoTabBar | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `flutter/go-router` | pattern | declarative GoRouter routing | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `flutter/list-view` | pattern | a scrolling ListView | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `flutter/grid-view` | pattern | a scrolling GridView | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `flutter/cupertino-button` | pattern | a CupertinoButton (iOS-styled control) | — | — | [controls](https://developer.apple.com/design/human-interface-guidelines/controls) |
| `flutter/elevated-button` | pattern | an ElevatedButton | — | — | [controls](https://developer.apple.com/design/human-interface-guidelines/controls) |
| `flutter/flutter-l10n` | positive | localization via AppLocalizations / flutter_localizations / intl | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
