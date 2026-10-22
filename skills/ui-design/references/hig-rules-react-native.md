# HIG rules — react native (TSX / JSX)

> Origin: raintree-technology/hig-doctor (MIT) — 4-framework subset of
> packages/core/src/patterns.ts, regex tier. The upstream ast-tsx and
> swift-structural refinement tiers are not ported; the regex definition
> is every rule's fallback tier, field-for-field equivalent here.
> Rule counts: web 122 / css 25 / flutter 21 / react-native 14, total 182.
> This file: react-native, 14 rules (1 concerns · 7 positives · 6 patterns) — file scope: React Native TSX/JSX (and TS/JS for hook rules).
> Citations link Apple's public Human Interface Guidelines;
> no Apple source text is reproduced. HIG snapshot: 2025-02-02.

Scan: `node skills/ui-design/scripts/audit-ui.mjs <target...> --framework react-native` — each finding prints `file:line · ruleId · severity · fix`.
This knowledge file is the ID key for the react-native rules; sibling files: [hig-rules-web](hig-rules-web.md), [hig-rules-css](hig-rules-css.md), [hig-rules-flutter](hig-rules-flutter.md), [hig-rules-react-native](hig-rules-react-native.md).

Rule types: concern = a probable HIG violation (carries severity, derived from
the source's CRITICAL_CONCERNS / SERIOUS_CONCERNS sets); positive = good practice
worth crediting; pattern = neutral component usage that routes HIG reference
material. The fix column quotes the source's FIX_GUIDANCE where present.
IDs are stable public API: `// hig-disable-next-line react-native/<id>` suppresses a hit.

| ID | Type | Detects | Severity | Fix | HIG |
|----|------|---------|----------|-----|-----|
| `react-native/accessibility-label` | positive | an accessibilityLabel= prop | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `react-native/accessibility-role` | positive | an accessibilityRole= prop | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `react-native/accessibility-hint` | positive | an accessibilityHint= prop | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `react-native/accessibility-state` | positive | an accessibilityState= prop | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `react-native/accessible-true` | positive | accessible={true} | — | — | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| `react-native/use-color-scheme` | positive | the useColorScheme() hook | — | — | [color](https://developer.apple.com/design/human-interface-guidelines/color) |
| `react-native/use-window-dimensions` | positive | the useWindowDimensions() hook | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `react-native/react-navigation` | pattern | React Navigation (NavigationContainer, stack/bottom-tab navigators) | — | — | [hig](https://developer.apple.com/design/human-interface-guidelines/) |
| `react-native/flat-list` | pattern | a FlatList | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `react-native/section-list` | pattern | a SectionList | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `react-native/safe-area-view` | pattern | a SafeAreaView respecting device insets | — | — | [layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| `react-native/gesture-handler` | pattern | gesture handler components/detectors (Pan/TapGestureHandler, GestureDetector) | — | — | [gestures](https://developer.apple.com/design/human-interface-guidelines/gestures) |
| `react-native/haptics` | pattern | haptic feedback (Haptics., expo-haptics) | — | — | [playing-haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics) |
| `react-native/nested-touchables` | concern | accessible={true} followed by a <Touchable … on the same line — nested interactive wrappers | serious | Flatten nested touchables; keep one interactive wrapper per control. | [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
