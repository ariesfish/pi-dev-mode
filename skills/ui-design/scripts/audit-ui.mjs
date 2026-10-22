#!/usr/bin/env node
// audit-ui.mjs — zero-dependency HIG audit for the four frameworks this
// skill layer owns: web (React/Next.js/TSX/HTML), css, flutter, react-native.
//
// Ported from raintree-technology/hig-doctor (MIT): a 4-framework subset of
// packages/core/src/patterns.ts, regex tier. The rule arrays, regex semantics,
// file filters, line scanning, document-scope rules (scope: "document",
// requireAbsent), severity sets, fix guidance, and slugify/ID scheme are
// field-for-field equivalent to the source. The ast-tsx and swift-structural
// refinement tiers are deliberately NOT ported — the regex definitions here
// are the fallback tier for every rule, exactly as in the source engine.
// Engine scope: skipInBlock CSS-block context, comment stripping, and
// hig-disable-next-line / hig-disable-file inline suppressions behave as the
// source's regex engine does.
//
// Uses ONLY node:fs / node:path / node:url builtins — no node_modules, ever.
// Writes only to stdout/stderr; never mutates the targets it scans.
//
// CLI:
//   node skills/ui-design/scripts/audit-ui.mjs <target...> [--list] [--framework web|css|flutter|react-native]
//
// Knowledge layer: skills/ui-design/references/hig-rules-{web,css,flutter,react-native}.md
// Rule IDs are public API and match hig-doctor's docs/rules.md exactly.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** HIG snapshot the ruleset was authored against (from patterns.ts). */
export const HIG_SNAPSHOT_DATE = "2025-02-02";

export const FRAMEWORKS = ["web", "css", "flutter", "react-native"];

// ════════════════════════════════════════════════════════════════
// Types (ported from patterns.ts)
// ════════════════════════════════════════════════════════════════

/** @typedef {"critical" | "serious" | "moderate"} Severity */
/** @typedef {"pattern" | "positive" | "concern"} RuleType */

/**
 * @typedef {object} PatternRule
 * @property {string} category
 * @property {string} subcategory
 * @property {RuleType} type
 * @property {string} pattern            (label — the slug source and the
 *                                        FIX_GUIDANCE/CRITICAL/SERIOUS key)
 * @property {RegExp} regex
 * @property {string} [hig]              per-rule HIG citation override; default
 *                                        derives from subcategory
 * @property {string} [fix]              per-rule fix override; default from FIX_GUIDANCE
 * @property {RegExp} [fileFilter]       only apply to files matching this pattern
 * @property {RegExp} [skipInBlock]      skip inside a CSS block matching this
 * @property {"document"} [scope]        match the whole comment-stripped source
 * @property {RegExp} [requireAbsent]    document scope only: fire once, only if
 *                                       this pattern appears nowhere in the file
 */

/**
 * @typedef {object} PatternMatch
 * @property {string} ruleId
 * @property {string} category
 * @property {string} subcategory
 * @property {RuleType} type
 * @property {string} pattern
 * @property {number} line
 * @property {string} lineContent
 * @property {string} file
 * @property {Severity} [severity]       concerns only
 */

/**
 * @typedef {object} CatalogRule
 * @property {string} id                 <framework>/<slug-of-pattern-label>
 * @property {string} framework
 * @property {Severity | null} severity  concerns only; else null
 * @property {string} hig                absolute HIG citation URL
 * @property {string | null} fix         fix guidance, when present
 * @property {string} [fixOverride]      per-rule fix, if declared
 * @property {string} [higOverride]      per-rule citation, if declared
 */

// ════════════════════════════════════════════════════════════════
// Severity classification (verbatim sets from patterns.ts)
// ════════════════════════════════════════════════════════════════

// Critical = breaks accessibility outright. Serious = significant UX
// degradation. Everything else defaults to moderate.
const CRITICAL_CONCERNS = new Set([
  "missing alt",
  "Image without alt",
  "svg without a11y",
  "empty heading",
  "empty button",
  "missing html lang",
  "video without track",
  "blink element",
  "marquee element",
  "user-scalable=no",
  "maximum-scale=1",
  "ImageView without contentDescription",
]);

const SERIOUS_CONCERNS = new Set([
  // "onTapGesture without traits", "Image without a11y", and "hover without
  // focus" are deliberately NOT here: they fire heuristically on common,
  // frequently-fine code, so they default to moderate instead of tripping a
  // `--fail-on serious` CI gate.
  "isAccessibilityElement false on interactive",
  "div with onClick no role",
  "span with onClick no role",
  "ambiguous link text",
  "positive tabindex",
  "aria-hidden on focusable",
  "onMouseOver without onFocus",
  "onMouseOut without onBlur",
  "div as button",
  "div as nav/header class",
  "autoplay media",
  "outline none",
  "v-on:click without keyboard",
  "on:click without on:keydown",
  "(click) without (keydown)",
  "clickable without Role",
  "nested touchables",
]);

/** @param {string} pattern @returns {Severity} */
export function severityFor(pattern) {
  if (CRITICAL_CONCERNS.has(pattern)) return "critical";
  if (SERIOUS_CONCERNS.has(pattern)) return "serious";
  return "moderate";
}

// ════════════════════════════════════════════════════════════════
// File filter shorthands (derived from patterns.ts constants)
// ════════════════════════════════════════════════════════════════

const WEB = /\.(tsx|jsx|html?)$/; // the source's WEB
const TSX_JSX = /\.(tsx|jsx)$/;
const TS_JS = /\.(tsx|jsx|ts|js)$/;
const DART = /\.dart$/;
const HTML = /\.html?$/; // the source inlines this literal on the two lang rules
const WEB_ALL = /\.(tsx|jsx|html?|vue|svelte)$/;
const STYLE_ALL = /\.(css|scss|sass|less)$/; // the source's CSS family filter

// ════════════════════════════════════════════════════════════════
// WEB / REACT / NEXT.JS RULES (122 rules)
// ════════════════════════════════════════════════════════════════
const webRules = [
  // ── Accessibility: Positives ────────────────────────────────
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-label", regex: /aria-label\s*=/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-describedby", regex: /aria-describedby/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-live", regex: /aria-live/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-expanded", regex: /aria-expanded/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-hidden", regex: /aria-hidden/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-current", regex: /aria-current/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-invalid", regex: /aria-invalid/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-errormessage", regex: /aria-errormessage/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "aria-required", regex: /aria-required/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "role attribute", regex: /role=["']/, fileFilter: WEB },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "sr-only", regex: /sr-only|visually-hidden|screen-reader/i, fileFilter: /\.(tsx|jsx|html?|css|vue|svelte)$/ },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "alt text", regex: /\balt=["'][^"']+["']/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "tabIndex", regex: /tabIndex=\{0\}|tabindex="0"/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "focus management", regex: /onFocus|onBlur|useRef.*focus/, fileFilter: TS_JS },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "keyboard handler", regex: /onKeyDown|onKeyUp|onKeyPress/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "skip link", regex: /skip.*nav|skip.*content|skiplink/i, fileFilter: /\.(tsx|jsx|html?|css|vue|svelte)$/ },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "htmlFor/for attribute", regex: /htmlFor=|for=["']/, fileFilter: WEB_ALL },

  // ── Accessibility: Concerns ─────────────────────────────────
  // Negative-attribute checks use a "tempered greedy token" — (?:(?!X)[^>])* —
  // which walks the tag body asserting attribute X never appears before the
  // closing >. A plain lookbehind/lookahead backtracks and matches tags that DO
  // have the attribute (the original bug flagged <img alt="..."> as missing alt).
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "missing alt", regex: /<img\b(?:(?!\balt\s*=)[^>])*>/i, fileFilter: WEB_ALL, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "Image without alt", regex: /<Image\b(?:(?!\balt\s*=)[^>])*>/, fileFilter: TSX_JSX, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "svg without a11y", regex: /<svg\b(?:(?!aria-label|aria-hidden|\brole\s*=)[^>])*>/, fileFilter: WEB_ALL, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "div with onClick no role", regex: /<div\b(?:(?!\brole\s*=)[^>])*\bonClick\b(?:(?!\brole\s*=)[^>])*>/, fileFilter: TSX_JSX, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "span with onClick no role", regex: /<span\b(?:(?!\brole\s*=)[^>])*\bonClick\b(?:(?!\brole\s*=)[^>])*>/, fileFilter: TSX_JSX, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "ambiguous link text", regex: />\s*(click here|read more|learn more|here|more)\s*</i, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "positive tabindex", regex: /tabIndex=\{[1-9]|tabindex="[1-9]/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "aria-hidden on focusable", regex: /aria-hidden=["']true["'][^>]*(?:<button|<a\s|<input|tabIndex)/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "onMouseOver without onFocus", regex: /<[A-Za-z][\w.:-]*\b(?:(?!\bonFocus\s*=)[^>])*\bonMouseOver\s*=(?:(?!\bonFocus\s*=)[^>])*>/, fileFilter: TSX_JSX, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "onMouseOut without onBlur", regex: /<[A-Za-z][\w.:-]*\b(?:(?!\bonBlur\s*=)[^>])*\bonMouseOut\s*=(?:(?!\bonBlur\s*=)[^>])*>/, fileFilter: TSX_JSX, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "autoFocus", regex: /autoFocus\b|autofocus\b/, fileFilter: WEB_ALL },

  // ── Heading & Structure ─────────────────────────────────────
  { category: "foundations", subcategory: "structure", type: "concern", pattern: "empty heading", regex: /<h[1-6][^>]*>\s*<\/h[1-6]>/, fileFilter: WEB_ALL, scope: "document" },
  { category: "foundations", subcategory: "structure", type: "concern", pattern: "empty button", regex: /<button[^>]*>\s*<\/button>/, fileFilter: WEB_ALL, scope: "document" },
  { category: "foundations", subcategory: "structure", type: "concern", pattern: "div as button", regex: /<div[^>]*role=["']button["']/, fileFilter: WEB_ALL, scope: "document" },
  { category: "foundations", subcategory: "structure", type: "concern", pattern: "div as nav/header class", regex: /<div[^>]*class(?:Name)?=["'][^"']*\b(nav|header|footer|sidebar)\b/i, fileFilter: WEB_ALL, scope: "document" },
  { category: "foundations", subcategory: "structure", type: "concern", pattern: "missing html lang", regex: /<html(?!\s[^>]*lang=)/, fileFilter: HTML, scope: "document" },
  { category: "foundations", subcategory: "structure", type: "positive", pattern: "html lang attribute", regex: /<html\s[^>]*lang=["'][a-z]/, fileFilter: HTML },
  { category: "foundations", subcategory: "structure", type: "positive", pattern: "landmark main", regex: /<main\b|role=["']main["']/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "structure", type: "positive", pattern: "landmark nav", regex: /<nav\b|role=["']navigation["']/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "structure", type: "positive", pattern: "landmark banner", regex: /role=["']banner["']/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "structure", type: "positive", pattern: "landmark contentinfo", regex: /role=["']contentinfo["']/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "structure", type: "positive", pattern: "heading h1", regex: /<h1\b/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "structure", type: "pattern", pattern: "heading h2", regex: /<h2\b/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "structure", type: "pattern", pattern: "heading h3", regex: /<h3\b/, fileFilter: WEB_ALL },

  // ── Color system ────────────────────────────────────────────
  { category: "foundations", subcategory: "color", type: "positive", pattern: "CSS variable color", regex: /var\(--[a-z]/, fileFilter: /\.(tsx|jsx|css|scss|html?|vue|svelte)$/ },
  { category: "foundations", subcategory: "color", type: "positive", pattern: "semantic text color", regex: /text-(foreground|muted-foreground|primary|secondary|destructive|accent-foreground)/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "color", type: "positive", pattern: "semantic bg color", regex: /bg-(background|muted|accent|card|popover|primary|secondary|destructive)/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "color", type: "positive", pattern: "semantic border color", regex: /border-(border|input|ring)/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "color", type: "concern", pattern: "inline color style", regex: /style=\{?\{[^}]*color:\s*['"]#/, fileFilter: TSX_JSX },

  // ── Typography ──────────────────────────────────────────────
  { category: "foundations", subcategory: "typography", type: "positive", pattern: "design token font size", regex: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "typography", type: "positive", pattern: "font-weight token", regex: /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "typography", type: "concern", pattern: "hardcoded font-size px", regex: /font-size:\s*\d+px/, fileFilter: /\.(css|scss|tsx|jsx)$/ },
  { category: "foundations", subcategory: "typography", type: "positive", pattern: "rem/em font size", regex: /font-size:\s*[\d.]+r?em/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "typography", type: "positive", pattern: "system font stack", regex: /font-family:.*(-apple-system|BlinkMacSystemFont|system-ui|SF Pro)/i, fileFilter: STYLE_ALL },

  // ── Dark mode ───────────────────────────────────────────────
  { category: "foundations", subcategory: "darkMode", type: "positive", pattern: "dark mode class", regex: /\bdark:/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "darkMode", type: "positive", pattern: "prefers-color-scheme", regex: /prefers-color-scheme/, fileFilter: /\.(css|scss|tsx|jsx|ts|js|vue|svelte)$/ },
  { category: "foundations", subcategory: "darkMode", type: "positive", pattern: "color-scheme property", regex: /color-scheme:\s*(light\s+dark|dark\s+light)/, fileFilter: STYLE_ALL },

  // ── Responsive / Layout ─────────────────────────────────────
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "responsive breakpoint", regex: /\b(sm:|md:|lg:|xl:|2xl:)/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "media query", regex: /@media\s*\(/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "safe area inset", regex: /safe-area-inset|env\(safe-area/, fileFilter: /\.(css|scss|tsx|jsx)$/ },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "container query", regex: /@container\b/, fileFilter: STYLE_ALL },

  // ── Motion ──────────────────────────────────────────────────
  { category: "foundations", subcategory: "motion", type: "positive", pattern: "prefers-reduced-motion", regex: /prefers-reduced-motion/, fileFilter: /\.(css|scss|tsx|jsx|ts|js|vue|svelte)$/ },
  { category: "foundations", subcategory: "motion", type: "pattern", pattern: "CSS animation", regex: /@keyframes/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "motion", type: "pattern", pattern: "CSS transition", regex: /transition:/, fileFilter: STYLE_ALL },

  // ── Touch targets ───────────────────────────────────────────
  { category: "foundations", subcategory: "touchTargets", type: "positive", pattern: "min touch target 44px", regex: /min-(width|height):\s*4[4-8]px|min-(w|h)-1[1-2]\b/, fileFilter: /\.(css|scss|tsx|jsx)$/ },

  // ── Navigation (components-layout) ──────────────────────────
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "nav element", regex: /<nav\b/, fileFilter: WEB_ALL },
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "Link component", regex: /<Link\b/, fileFilter: TSX_JSX },
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "useRouter", regex: /useRouter\b/, fileFilter: TS_JS },
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "usePathname", regex: /usePathname\b/, fileFilter: TS_JS },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "header element", regex: /<header\b/, fileFilter: WEB_ALL },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "main element", regex: /<main\b/, fileFilter: WEB_ALL },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "footer element", regex: /<footer\b/, fileFilter: WEB_ALL },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "section element", regex: /<section\b/, fileFilter: WEB_ALL },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "aside element", regex: /<aside\b/, fileFilter: WEB_ALL },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "article element", regex: /<article\b/, fileFilter: WEB_ALL },
  { category: "components-layout", subcategory: "layout", type: "positive", pattern: "grid layout", regex: /grid-cols|grid-template/, fileFilter: /\.(tsx|jsx|css|scss)$/ },

  // ── Controls (components-controls) ──────────────────────────
  { category: "components-controls", subcategory: "buttons", type: "pattern", pattern: "button element", regex: /<button\b|<Button\b/, fileFilter: WEB_ALL },
  { category: "components-controls", subcategory: "inputs", type: "pattern", pattern: "input element", regex: /<input\b|<Input\b/, fileFilter: WEB_ALL },
  { category: "components-controls", subcategory: "inputs", type: "pattern", pattern: "select element", regex: /<select\b|<Select\b/, fileFilter: WEB_ALL },
  { category: "components-controls", subcategory: "inputs", type: "pattern", pattern: "textarea element", regex: /<textarea\b|<Textarea\b/, fileFilter: WEB_ALL },
  { category: "components-controls", subcategory: "inputs", type: "pattern", pattern: "checkbox/radio", regex: /type=["'](checkbox|radio)["']/, fileFilter: WEB_ALL },
  { category: "components-controls", subcategory: "inputs", type: "positive", pattern: "label element", regex: /<label\b|<Label\b/, fileFilter: WEB_ALL },
  { category: "components-controls", subcategory: "toggle", type: "pattern", pattern: "switch/toggle", regex: /<Switch\b|role=["']switch["']/, fileFilter: TSX_JSX },

  // ── Forms (inputs) ──────────────────────────────────────────
  { category: "inputs", subcategory: "forms", type: "pattern", pattern: "form element", regex: /<form\b|<Form\b/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "form validation", regex: /\brequired\b|pattern=|minLength|maxLength/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "input type email", regex: /type=["']email["']/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "input type tel", regex: /type=["']tel["']/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "input type url", regex: /type=["']url["']/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "input type number", regex: /type=["']number["']/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "autocomplete attribute", regex: /autocomplete=["']/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "fieldset element", regex: /<fieldset\b/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "legend element", regex: /<legend\b/, fileFilter: WEB_ALL },
  { category: "inputs", subcategory: "forms", type: "positive", pattern: "placeholder text", regex: /placeholder=["']/, fileFilter: WEB_ALL },

  // ── Dialogs (components-dialogs) ────────────────────────────
  { category: "components-dialogs", subcategory: "modals", type: "pattern", pattern: "dialog element", regex: /<dialog\b|<Dialog\b/, fileFilter: WEB_ALL },
  { category: "components-dialogs", subcategory: "modals", type: "pattern", pattern: "modal/sheet", regex: /<Modal\b|<Sheet\b|<Drawer\b/, fileFilter: TSX_JSX },
  { category: "components-dialogs", subcategory: "alerts", type: "pattern", pattern: "alert dialog", regex: /<AlertDialog\b|role=["']alertdialog["']/, fileFilter: TSX_JSX },
  { category: "components-dialogs", subcategory: "popover", type: "pattern", pattern: "popover", regex: /<Popover\b/, fileFilter: TSX_JSX },
  { category: "components-dialogs", subcategory: "toast", type: "pattern", pattern: "toast/notification", regex: /<Toast\b|toast\(|<Toaster\b|<Sonner\b/, fileFilter: TSX_JSX },
  { category: "components-dialogs", subcategory: "tooltip", type: "pattern", pattern: "tooltip", regex: /<Tooltip\b|role=["']tooltip["']/, fileFilter: WEB_ALL },

  // ── Search (components-search) ──────────────────────────────
  { category: "components-search", subcategory: "search", type: "pattern", pattern: "search input", regex: /type=["']search["']/, fileFilter: WEB_ALL },
  { category: "components-search", subcategory: "search", type: "pattern", pattern: "search role", regex: /role=["']search["']/, fileFilter: WEB_ALL },

  // ── Menus (components-menus) ────────────────────────────────
  { category: "components-menus", subcategory: "menus", type: "pattern", pattern: "dropdown menu", regex: /<DropdownMenu\b/, fileFilter: TSX_JSX },
  { category: "components-menus", subcategory: "menus", type: "pattern", pattern: "context menu", regex: /<ContextMenu\b|onContextMenu/, fileFilter: TSX_JSX },
  { category: "components-menus", subcategory: "menus", type: "pattern", pattern: "menu role", regex: /role=["']menu["']|role=["']menubar["']/, fileFilter: WEB_ALL },
  { category: "components-menus", subcategory: "menus", type: "pattern", pattern: "menuitem role", regex: /role=["']menuitem["']/, fileFilter: WEB_ALL },

  // ── Status (components-status) ──────────────────────────────
  { category: "components-status", subcategory: "progress", type: "pattern", pattern: "progress bar", regex: /<progress\b|<Progress\b|role=["']progressbar["']/, fileFilter: WEB_ALL },
  { category: "components-status", subcategory: "loading", type: "pattern", pattern: "loading state", regex: /isLoading|loading\s*[=:]|<Skeleton\b|<Spinner\b/, fileFilter: TS_JS },
  { category: "components-status", subcategory: "loading", type: "pattern", pattern: "aria-busy", regex: /aria-busy/, fileFilter: WEB_ALL },

  // ── Content (components-content) ────────────────────────────
  { category: "components-content", subcategory: "images", type: "pattern", pattern: "Next Image", regex: /<Image\b.*\bsrc=/, fileFilter: TSX_JSX },
  { category: "components-content", subcategory: "tables", type: "pattern", pattern: "table element", regex: /<table\b|<Table\b/, fileFilter: WEB_ALL },
  { category: "components-content", subcategory: "accordion", type: "pattern", pattern: "accordion", regex: /<Accordion\b/, fileFilter: TSX_JSX },
  { category: "components-content", subcategory: "cards", type: "pattern", pattern: "card component", regex: /<Card\b/, fileFilter: TSX_JSX },
  { category: "components-content", subcategory: "lists", type: "pattern", pattern: "list elements", regex: /<ul\b|<ol\b|<dl\b/, fileFilter: WEB_ALL },
  { category: "components-content", subcategory: "details", type: "pattern", pattern: "details/summary", regex: /<details\b|<summary\b/, fileFilter: WEB_ALL },

  // ── Patterns ────────────────────────────────────────────────
  { category: "patterns", subcategory: "animation", type: "pattern", pattern: "framer motion", regex: /framer-motion|motion\.[a-z]/, fileFilter: TS_JS },
  { category: "patterns", subcategory: "seo", type: "positive", pattern: "metadata/head", regex: /export.*metadata|<Head\b|<title\b/, fileFilter: TS_JS },
  { category: "patterns", subcategory: "errorHandling", type: "positive", pattern: "error boundary", regex: /ErrorBoundary|error\.tsx/, fileFilter: TS_JS },
  { category: "patterns", subcategory: "i18n", type: "positive", pattern: "i18n/l10n", regex: /useTranslation|i18n|intl|formatMessage|<FormattedMessage/, fileFilter: TS_JS },

  // ── Technologies ────────────────────────────────────────────
  { category: "technologies", subcategory: "analytics", type: "pattern", pattern: "analytics", regex: /@vercel\/analytics|gtag|GoogleAnalytics/, fileFilter: TS_JS },

  // ── Media accessibility ─────────────────────────────────────
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "video without track", regex: /<video\b(?:(?!<\/video>|<track\b)[\s\S])*?<\/video>/i, fileFilter: WEB_ALL, scope: "document" },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "autoplay media", regex: /\bauto[Pp]lay\b(?!\s*=\s*\{?\s*['"]?false)/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "blink element", regex: /<blink\b/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "marquee element", regex: /<marquee\b/, fileFilter: WEB_ALL },

  // ── Viewport concerns ───────────────────────────────────────
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "user-scalable=no", regex: /user-scalable\s*=\s*no/, fileFilter: WEB_ALL },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "maximum-scale=1", regex: /maximum-scale\s*=\s*1\b/, fileFilter: WEB_ALL },
];

// ════════════════════════════════════════════════════════════════
// CSS-SPECIFIC RULES (25 rules)
// ════════════════════════════════════════════════════════════════
const cssRules = [
  // Color
  { category: "foundations", subcategory: "color", type: "positive", pattern: "CSS custom property def", regex: /--[a-z][\w-]*:\s*/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "color", type: "concern", pattern: "hardcoded hex in CSS", regex: /(?:^|[\s;{])(?:color|background(?:-color)?|border(?:-color)?):\s*#[0-9a-fA-F]{3,8}\b/, fileFilter: STYLE_ALL },

  // Typography
  { category: "foundations", subcategory: "typography", type: "positive", pattern: "clamp font size", regex: /font-size:\s*clamp\(/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "typography", type: "concern", pattern: "font-size below 12px", regex: /font-size:\s*(1[01]|[0-9])px\b/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "typography", type: "concern", pattern: "text-align justify", regex: /text-align:\s*justify/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "typography", type: "concern", pattern: "line-height below 1.2", regex: /line-height:\s*(0\.\d+|1\.[01]\d*)\s*[;}]/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "typography", type: "positive", pattern: "max-width on text", regex: /max-width:.*ch\b/, fileFilter: STYLE_ALL },

  // Accessibility
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "focus-visible", regex: /:focus-visible/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "focus ring styles", regex: /outline.*focus|ring-/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "high contrast", regex: /forced-colors|high-contrast|prefers-contrast/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "outline none", regex: /outline:\s*(none|0)\b/, fileFilter: STYLE_ALL, skipInBlock: /(:focus:not\(:focus-visible\))|(@media\s+print)/ },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "hover without focus", regex: /:hover\b/, fileFilter: STYLE_ALL, scope: "document", requireAbsent: /:focus/ },

  // Layout
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "print styles", regex: /@media\s+print/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "logical properties", regex: /margin-inline|padding-inline|border-inline|inset-inline/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "flexbox gap", regex: /\bgap:\s*/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "aspect-ratio", regex: /aspect-ratio:/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "layout", type: "concern", pattern: "overflow hidden on body", regex: /body\s*\{[^}]*overflow:\s*hidden/, fileFilter: STYLE_ALL },

  // Touch targets
  { category: "foundations", subcategory: "touchTargets", type: "positive", pattern: "touch target sizing", regex: /min-(width|height):\s*4[4-8]px/, fileFilter: STYLE_ALL },

  // z-index
  { category: "foundations", subcategory: "layout", type: "concern", pattern: "extreme z-index", regex: /z-index:\s*[1-9]\d{3,}/, fileFilter: STYLE_ALL },

  // !important
  { category: "foundations", subcategory: "layout", type: "concern", pattern: "!important usage", regex: /!important/, fileFilter: STYLE_ALL, skipInBlock: /@media\s+print|prefers-reduced-motion/ },

  // Scrollbar
  { category: "foundations", subcategory: "layout", type: "pattern", pattern: "custom scrollbar", regex: /-webkit-scrollbar|scrollbar-width/, fileFilter: STYLE_ALL },

  // i18n / RTL
  { category: "foundations", subcategory: "i18n", type: "positive", pattern: "RTL direction", regex: /direction:\s*rtl|\[dir=["']rtl["']\]/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "i18n", type: "positive", pattern: "logical text-align", regex: /text-align:\s*(start|end)\b/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "i18n", type: "positive", pattern: "logical margin/padding", regex: /margin-inline-start|margin-inline-end|padding-inline-start|padding-inline-end/, fileFilter: STYLE_ALL },
  { category: "foundations", subcategory: "i18n", type: "concern", pattern: "physical text-align", regex: /text-align:\s*(left|right)\b/, fileFilter: STYLE_ALL },
];

// ════════════════════════════════════════════════════════════════
// REACT NATIVE RULES (14 rules)
// ════════════════════════════════════════════════════════════════
const reactNativeRules = [
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "accessibilityLabel", regex: /accessibilityLabel=/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "accessibilityRole", regex: /accessibilityRole=/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "accessibilityHint", regex: /accessibilityHint=/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "accessibilityState", regex: /accessibilityState=/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "accessible={true}", regex: /accessible=\{true\}/, fileFilter: TSX_JSX },
  { category: "foundations", subcategory: "color", type: "positive", pattern: "useColorScheme", regex: /useColorScheme\b/, fileFilter: TS_JS },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "useWindowDimensions", regex: /useWindowDimensions\b/, fileFilter: TS_JS },
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "React Navigation", regex: /createNativeStackNavigator|createBottomTabNavigator|NavigationContainer/, fileFilter: TS_JS },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "FlatList", regex: /\bFlatList\b/, fileFilter: TSX_JSX },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "SectionList", regex: /\bSectionList\b/, fileFilter: TSX_JSX },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "SafeAreaView", regex: /\bSafeAreaView\b/, fileFilter: TSX_JSX },
  { category: "inputs", subcategory: "gestures", type: "pattern", pattern: "Gesture handler", regex: /PanGestureHandler|TapGestureHandler|GestureDetector/, fileFilter: TSX_JSX },
  { category: "patterns", subcategory: "haptics", type: "pattern", pattern: "Haptics", regex: /Haptics\.|expo-haptics/, fileFilter: TS_JS },
  { category: "foundations", subcategory: "accessibility", type: "concern", pattern: "nested touchables", regex: /accessible=\{true\}[\s\S]*?<Touchable/, fileFilter: TSX_JSX },
];

// ════════════════════════════════════════════════════════════════
// FLUTTER RULES (21 rules)
// ════════════════════════════════════════════════════════════════
const flutterRules = [
  // Accessibility
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "Semantics widget", regex: /\bSemantics\(/, fileFilter: DART },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "ExcludeSemantics", regex: /\bExcludeSemantics\(/, fileFilter: DART },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "MergeSemantics", regex: /\bMergeSemantics\(/, fileFilter: DART },
  { category: "foundations", subcategory: "accessibility", type: "positive", pattern: "semanticLabel", regex: /semanticLabel:/, fileFilter: DART },
  // Color
  { category: "foundations", subcategory: "color", type: "positive", pattern: "Theme color", regex: /Theme\.of\(context\)\.colorScheme/, fileFilter: DART },
  { category: "foundations", subcategory: "color", type: "concern", pattern: "hardcoded Color", regex: /Color\(0x[0-9a-fA-F]+\)/, fileFilter: DART },
  { category: "foundations", subcategory: "color", type: "concern", pattern: "Colors.red/blue", regex: /Colors\.(red|blue|green|yellow|orange|purple|pink|white|black|grey)\b/, fileFilter: DART },
  // Typography
  { category: "foundations", subcategory: "typography", type: "positive", pattern: "Theme text style", regex: /Theme\.of\(context\)\.textTheme/, fileFilter: DART },
  { category: "foundations", subcategory: "typography", type: "concern", pattern: "hardcoded fontSize", regex: /fontSize:\s*\d+/, fileFilter: DART },
  // Dark mode
  { category: "foundations", subcategory: "darkMode", type: "positive", pattern: "brightness detection", regex: /MediaQuery\.of\(context\)\.platformBrightness/, fileFilter: DART },
  { category: "foundations", subcategory: "darkMode", type: "positive", pattern: "darkTheme", regex: /darkTheme:/, fileFilter: DART },
  // Layout
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "MediaQuery responsive", regex: /MediaQuery\.of\(context\)\.size/, fileFilter: DART },
  { category: "foundations", subcategory: "layout", type: "positive", pattern: "LayoutBuilder", regex: /\bLayoutBuilder\b/, fileFilter: DART },
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "Navigator", regex: /\bNavigator\b/, fileFilter: DART },
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "CupertinoTabBar", regex: /\bCupertinoTabBar\b/, fileFilter: DART },
  { category: "components-layout", subcategory: "navigation", type: "pattern", pattern: "GoRouter", regex: /\bGoRouter\b/, fileFilter: DART },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "ListView", regex: /\bListView\b/, fileFilter: DART },
  { category: "components-layout", subcategory: "layout", type: "pattern", pattern: "GridView", regex: /\bGridView\b/, fileFilter: DART },
  { category: "components-controls", subcategory: "controls", type: "pattern", pattern: "CupertinoButton", regex: /\bCupertinoButton\b/, fileFilter: DART },
  { category: "components-controls", subcategory: "controls", type: "pattern", pattern: "ElevatedButton", regex: /\bElevatedButton\b/, fileFilter: DART },
  // i18n
  { category: "patterns", subcategory: "i18n", type: "positive", pattern: "Flutter l10n", regex: /AppLocalizations|flutter_localizations|intl/, fileFilter: DART },
];

// ════════════════════════════════════════════════════════════════
// RULE CATALOG — stable IDs: <framework>/<slug-of-pattern-label>.
// IDs are public API (suppressions, baselines); pattern labels are frozen.
// ════════════════════════════════════════════════════════════════

function slugify(label) {
  return label
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SECTIONS = [
  ["web", webRules],
  ["css", cssRules],
  ["flutter", flutterRules],
  ["react-native", reactNativeRules],
];

/** @type {(PatternRule & CatalogRule)[]} */
const _rules = [];
{
  const used = new Set();
  for (const [framework, rules] of SECTIONS) {
    for (const rule of rules) {
      const base = `${framework}/${slugify(rule.pattern)}`;
      // Duplicate labels within a framework get a stable ordinal suffix; the
      // suffix only ever grows with rule additions at the end of a section.
      let id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      _rules.push({ ...rule, id, framework });
    }
  }
}
export const ALL_RULES = _rules;

/** Public, serializable rule view for the knowledge layer and tooling.
 * @returns {{id:string, framework:string, category:string, subcategory:string,
 *            type:RuleType, label:string, severity:Severity|null,
 *            hig:string, fix:string|null, scope:"document"|"line",
 *            regex:string, fileFilter:string}[]} */
export function ruleCatalog() {
  return ALL_RULES.map((r) => ({
    id: r.id,
    framework: r.framework,
    category: r.category,
    subcategory: r.subcategory,
    type: r.type,
    label: r.pattern,
    severity: r.type === "concern" ? severityFor(r.pattern) : null,
    hig: higCitation(r),
    fix: fixGuidance(r),
    scope: r.scope === "document" ? "document" : "line",
    regex: r.regex.source,
    fileFilter: r.fileFilter ? r.fileFilter.source : null,
  }));
}

// ════════════════════════════════════════════════════════════════
// HIG citations — best-fit per rule subcategory (verbatim map; "" cites
// the HIG root for subcategories with no single canonical page).
// ════════════════════════════════════════════════════════════════

const HIG_BASE = "https://developer.apple.com/design/human-interface-guidelines/";
const SUBCATEGORY_HIG = {
  accessibility: "accessibility",
  accordion: "disclosure-controls",
  alerts: "alerts",
  analytics: "privacy",
  animation: "motion",
  buttons: "buttons",
  cards: "layout",
  color: "color",
  controls: "controls",
  details: "disclosure-controls",
  focus: "focus-and-selection",
  forms: "entering-data",
  gestures: "gestures",
  haptics: "playing-haptics",
  images: "images",
  inputs: "text-fields",
  keyboard: "keyboards",
  layout: "layout",
  lists: "lists-and-tables",
  loading: "loading",
  menus: "menus",
  modals: "modality",
  motion: "motion",
  multiplatform: "",
  navigation: "",
  popover: "popovers",
  progress: "progress-indicators",
  refresh: "loading",
  search: "searching",
  seo: "",
  state: "feedback",
  structure: "layout",
  tables: "lists-and-tables",
  toast: "feedback",
  toggle: "toggles",
  toolbar: "toolbars",
  tooltip: "offering-help",
  typography: "typography",
  widgets: "widgets",
  // Apple-platform subcategories (kept verbatim with the source map)
  windows: "windows",
  sidebars: "sidebars",
  "split-views": "split-views",
  "menu-bar": "the-menu-bar",
  materials: "materials",
  "sf-symbols": "sf-symbols",
  "digital-crown": "digital-crown",
  complications: "complications",
  "always-on": "always-on",
  workouts: "workouts",
  immersive: "immersive-experiences",
  spatial: "spatial-layout",
  ornaments: "ornaments",
};

/** @param {{hig?: string, subcategory: string}} rule */
export function higCitation(rule) {
  if (rule.hig) return rule.hig;
  const slug = SUBCATEGORY_HIG[rule.subcategory] ?? "";
  return HIG_BASE + slug;
}

// Fix guidance keyed by pattern label — exactly the entries reachable from
// this layer's four frameworks (every web concern the source covers, plus the
// css "outline none" and react-native "nested touchables" serious concerns;
// unreachable-from-here entries — Swift/Vue/Svelte/Angular/Compose — are out
// of scope; coverage gaps surface as "—" in reports).
const FIX_GUIDANCE = {
  // Critical
  "missing alt": 'Add descriptive alt text, or alt="" when the image is purely decorative.',
  "Image without alt": 'Add descriptive alt text, or alt="" when the image is purely decorative.',
  "svg without a11y": 'Give inline SVG role="img" plus a <title> or aria-label, or aria-hidden="true" if decorative.',
  "empty heading": "Add text content to the heading or remove it; screen readers announce empty headings as unlabeled.",
  "empty button": "Give the button visible text or an aria-label.",
  "missing html lang": 'Add lang="…" to the <html> element so assistive tech picks the right voice.',
  "video without track": 'Add a <track kind="captions"> file to the video.',
  "blink element": "Remove <blink>; if emphasis is needed, use CSS animation that honors prefers-reduced-motion.",
  "marquee element": "Remove <marquee>; use static layout or an accessible animation that honors prefers-reduced-motion.",
  "user-scalable=no": "Remove user-scalable=no from the viewport meta so pinch-zoom keeps working.",
  "maximum-scale=1": "Remove maximum-scale=1 from the viewport meta so users can zoom.",
  // Serious
  "div with onClick no role": 'Use a native <button>, or add role="button", tabIndex={0}, and Enter/Space key handling.',
  "span with onClick no role": 'Use a native <button>, or add role="button", tabIndex={0}, and Enter/Space key handling.',
  "ambiguous link text": 'Write link text that names the destination; avoid "click here"/"read more".',
  "positive tabindex": 'Use tabindex="0" (or -1); positive values override the natural focus order.',
  "aria-hidden on focusable": "Remove aria-hidden from focusable elements, or take them out of the tab order too.",
  "onMouseOver without onFocus": "Pair onMouseOver with onFocus so keyboard users get the same affordance.",
  "onMouseOut without onBlur": "Pair onMouseOut with onBlur so keyboard users get the same affordance.",
  "div as button": "Replace the div with a native <button>; it brings focus, key handling, and semantics for free.",
  "div as nav/header class": "Use the semantic <nav>/<header> element instead of a classed div so landmarks exist.",
  "autoplay media": "Avoid autoplay; if unavoidable, autoplay muted with visible controls.",
  "outline none": "Keep a visible focus indicator — style :focus-visible instead of removing the outline.",
  "nested touchables": "Flatten nested touchables; keep one interactive wrapper per control.",
};

/** @param {{fix?: string, pattern: string}} rule */
export function fixGuidance(rule) {
  return rule.fix ?? FIX_GUIDANCE[rule.pattern] ?? null;
}

// ════════════════════════════════════════════════════════════════
// Comment stripping (verbatim lexer from patterns.ts): comments are
// removed so rules never fire on commented-out code; string literals are
// PRESERVED — their contents are exactly what many rules match on.
// ════════════════════════════════════════════════════════════════

/** @typedef {{inBlock: boolean, inHtml: boolean}} CommentState */

function stripComments(line, state, lineComments) {
  let out = "";
  let str = null; // active string delimiter, or null
  const n = line.length;
  let i = 0;
  while (i < n) {
    const c = line[i];
    const c2 = i + 1 < n ? line[i + 1] : "";
    if (state.inBlock) {
      if (c === "*" && c2 === "/") { state.inBlock = false; i += 2; } else { i++; }
      continue;
    }
    if (state.inHtml) {
      if (c === "-" && c2 === "-" && line[i + 2] === ">") { state.inHtml = false; i += 3; } else { i++; }
      continue;
    }
    if (str !== null) {
      out += c;
      if (c === "\\" && i + 1 < n) { out += c2; i += 2; continue; }
      if (c === str) str = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { str = c; out += c; i++; continue; }
    if (c === "/" && c2 === "*") { state.inBlock = true; i += 2; continue; }
    if (lineComments && c === "/" && c2 === "/") break; // line comment → drop the rest
    if (c === "<" && c2 === "!" && line[i + 2] === "-" && line[i + 3] === "-") { state.inHtml = true; i += 4; continue; }
    out += c;
    i++;
  }
  return out;
}

// ════════════════════════════════════════════════════════════════
// Inline suppressions, parsed from RAW lines (comments):
//   // hig-disable-next-line web/missing-alt -- brand splash screen
//   <!-- hig-disable-next-line web/missing-alt -->
//   // hig-disable-file css/important
// No rule IDs → everything suppressed. IDs exact or prefix globs ("web/*").
// ════════════════════════════════════════════════════════════════

/** @typedef {{kind: "next-line" | "file", ids: string[] | "all"}} Suppression */

function parseSuppression(line) {
  const m = line.match(/hig-disable-(next-line|file)\b(.*)$/);
  if (!m) return null;
  const ids = [];
  for (const token of (m[2] ?? "").trim().split(/\s+/)) {
    if (token === "" || token === "--") break;
    if (!/^[a-z0-9/*-]+$/.test(token) || !token.includes("/")) break;
    ids.push(token);
  }
  return { kind: m[1], ids: ids.length > 0 ? ids : "all" };
}

function suppressionCovers(ids, ruleId) {
  if (ids === "all") return true;
  return ids.some((id) =>
    id.endsWith("*") ? ruleId.startsWith(id.slice(0, -1)) : ruleId === id,
  );
}

/** @param {string} code */
export function buildSuppressionFilter(code) {
  const rawLines = code.split("\n");

  let fileSuppression = null;
  const lineSuppressions = new Map();
  for (let i = 0; i < rawLines.length; i++) {
    if (!rawLines[i].includes("hig-disable-")) continue;
    const sup = parseSuppression(rawLines[i]);
    if (!sup) continue;
    if (sup.kind === "file") {
      fileSuppression = fileSuppression === "all" || sup.ids === "all"
        ? "all"
        : [...(fileSuppression ?? []), ...sup.ids];
    } else {
      const existing = lineSuppressions.get(i + 2);
      lineSuppressions.set(
        i + 2,
        existing === "all" || sup.ids === "all" ? "all" : [...(existing ?? []), ...sup.ids],
      );
    }
  }
  return (ruleId, line) => {
    if (fileSuppression && suppressionCovers(fileSuppression, ruleId)) return true;
    const forLine = lineSuppressions.get(line);
    return forLine !== undefined && suppressionCovers(forLine, ruleId);
  };
}

// ════════════════════════════════════════════════════════════════
// The regex detection engine (verbatim port of detectPatterns): line
// scanning over comment-stripped source plus whole-document rules for
// tags that span lines and child/sibling inspection.
// ════════════════════════════════════════════════════════════════

/**
 * @param {string} code
 * @param {string} file
 * @param {(PatternRule & CatalogRule)[]} [rules] defaults to all four frameworks
 * @returns {PatternMatch[]}
 */
export function detectPatterns(code, file, rules = ALL_RULES) {
  const matches = [];
  const rawLines = code.split("\n");

  const isSuppressed = buildSuppressionFilter(code);
  const isStyleFile = /\.(css|scss|sass|less)$/.test(file);
  // `//` is a line comment in code and in SCSS/Sass/Less, but NOT in plain CSS,
  // HTML, or XML — where it legitimately appears in protocol-relative URLs like
  // url(//cdn…).
  const allowLineComments = !/\.(css|html?|xml|storyboard|xib)$/i.test(file);

  const commentState = { inBlock: false, inHtml: false };
  const lines = rawLines.map((l) => stripComments(l, commentState, allowLineComments));

  const applicable = rules.filter((r) => !r.fileFilter || r.fileFilter.test(file));
  const lineRules = applicable.filter((r) => r.scope !== "document");
  const docRules = applicable.filter((r) => r.scope === "document");

  // CSS block context for skipInBlock rules: a stack of block-opening lines so
  // we can tell whether we're inside @media print, :focus:not(:focus-visible).
  const blockContext = [];
  let braceDepth = 0;
  const blockStartDepth = [];

  for (let i = 0; i < lines.length; i++) {
    const scanLine = lines[i];

    if (isStyleFile) {
      const opensBlock = scanLine.includes("{");
      const closesBlock = scanLine.includes("}");
      if (opensBlock) {
        // Accumulate context: look back up to 3 lines for the selector/at-rule.
        let contextLines = scanLine;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (!lines[j].includes("}") && !lines[j].includes("{")) {
            contextLines = `${lines[j]} ${contextLines}`;
          }
        }
        blockContext.push(contextLines);
        blockStartDepth.push(braceDepth);
        braceDepth++;
      }
      if (closesBlock) {
        braceDepth = Math.max(0, braceDepth - 1);
        while (blockStartDepth.length > 0 && blockStartDepth[blockStartDepth.length - 1] >= braceDepth) {
          blockStartDepth.pop();
          blockContext.pop();
        }
      }
    }

    for (const rule of lineRules) {
      if (rule.regex.test(scanLine)) {
        const skipInBlock = rule.skipInBlock;
        if (skipInBlock && isStyleFile) {
          const inSkippedBlock = blockContext.some((ctx) => skipInBlock.test(ctx));
          if (inSkippedBlock) continue;
        }
        if (isSuppressed(rule.id, i + 1)) continue;
        matches.push({
          ruleId: rule.id,
          category: rule.category,
          subcategory: rule.subcategory,
          type: rule.type,
          pattern: rule.pattern,
          line: i + 1,
          lineContent: rawLines[i].trim(),
          file,
          severity: rule.type === "concern" ? severityFor(rule.pattern) : undefined,
        });
      }
    }
  }

  // Document-scoped rules match against the whole comment-stripped source, so
  // tags that wrap across lines and child/sibling relationships (e.g. a <video>
  // with a <track>) are visible — things a per-line scan structurally cannot see.
  if (docRules.length > 0) {
    const stripped = lines.join("\n");
    const lineStarts = [0];
    for (let k = 0; k < stripped.length; k++) {
      if (stripped[k] === "\n") lineStarts.push(k + 1);
    }
    const lineNumberAt = (index) => {
      let lo = 0;
      let hi = lineStarts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= index) lo = mid;
        else hi = mid - 1;
      }
      return lo + 1;
    };
    for (const rule of docRules) {
      // requireAbsent: a file-level signal (e.g. ":hover styles but no :focus
      // anywhere"). Skip when the "good" pattern is present; otherwise report a
      // single finding at the first match.
      if (rule.requireAbsent && rule.requireAbsent.test(stripped)) continue;
      const flags = rule.regex.flags.includes("g") ? rule.regex.flags : rule.regex.flags + "g";
      const re = new RegExp(rule.regex.source, flags);
      let m;
      while ((m = re.exec(stripped)) !== null) {
        const lineNo = lineNumberAt(m.index);
        if (isSuppressed(rule.id, lineNo)) {
          if (rule.requireAbsent) break;
          if (m.index === re.lastIndex) re.lastIndex++;
          continue;
        }
        matches.push({
          ruleId: rule.id,
          category: rule.category,
          subcategory: rule.subcategory,
          type: rule.type,
          pattern: rule.pattern,
          line: lineNo,
          lineContent: (rawLines[lineNo - 1] ?? "").trim(),
          file,
          severity: rule.type === "concern" ? severityFor(rule.pattern) : undefined,
        });
        if (rule.requireAbsent) break; // file-level: one finding is enough
        if (m.index === re.lastIndex) re.lastIndex++; // never spin on a zero-width match
      }
    }
    // Interleave document findings with line findings in source order.
    matches.sort((a, b) => a.line - b.line);
  }

  return matches;
}

// ════════════════════════════════════════════════════════════════
// CLI: walk targets, scan read-only, report.
// ════════════════════════════════════════════════════════════════

const USAGE = "usage: node skills/ui-design/scripts/audit-ui.mjs <target...> [--list] [--framework web|css|flutter|react-native]";

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", ".cache", "coverage"]);

function walk(target) {
  const st = statSync(target); // throws for missing targets (caller reports)
  if (st.isFile()) return [target];
  const out = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) visit(p);
      } else if (entry.isFile()) {
        out.push(p);
      }
    }
  };
  visit(target);
  return out;
}

function ruleCounts(frameworks) {
  const counts = {};
  for (const f of frameworks) counts[f] = ALL_RULES.filter((r) => r.framework === f).length;
  return counts;
}

function main(argv) {
  const targets = [];
  let wantList = false;
  let framework = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") { wantList = true; continue; }
    if (a === "--framework" || a.startsWith("--framework=")) {
      const val = a === "--framework" ? argv[++i] : a.slice("--framework=".length);
      if (val === undefined || !FRAMEWORKS.includes(val)) {
        process.stderr.write(`unknown framework: ${val ?? "(none)"} — expected web|css|flutter|react-native\n${USAGE}\n`);
        process.exit(2);
      }
      framework = val;
      continue;
    }
    if (a === "--help" || a === "-h") { process.stdout.write(`${USAGE}\n`); return; }
    if (a.startsWith("--")) {
      process.stderr.write(`unknown flag: ${a}\n${USAGE}\n`);
      process.exit(2);
    }
    targets.push(a);
  }
  if (targets.length === 0 && !wantList) {
    process.stderr.write(`${USAGE}\n`);
    process.exit(2);
  }
  for (const t of targets) {
    try { statSync(t); } catch {
      process.stderr.write(`target not found: ${t}\n`);
      process.exit(2);
    }
  }

  const frameworks = framework ? [framework] : FRAMEWORKS;
  const counts = ruleCounts(frameworks);
  const totalRules = Object.values(counts).reduce((a, b) => a + b, 0);

  if (wantList) {
    for (const f of frameworks) process.stdout.write(`${f}: ${counts[f]}\n`);
    const breakdown = frameworks.map((f) => counts[f]).join("/");
    process.stdout.write(`total: ${totalRules}${frameworks.length > 1 ? ` (${breakdown} ≡ ${totalRules})` : ""}\n`);
    return;
  }

  const rules = ALL_RULES.filter((r) => frameworks.includes(r.framework));

  // Walk every target; skip files no rule applies to (same pre-filter as the
  // source engine — applicable = fileFilter matches, or none declared).
  const seen = new Set();
  const files = [];
  for (const t of targets) {
    for (const f of walk(resolve(t))) {
      if (seen.has(f)) continue;
      seen.add(f);
      if (rules.some((r) => !r.fileFilter || r.fileFilter.test(f))) files.push(f);
    }
  }

  let fileCount = 0;
  const totals = {}; // framework → {critical, serious, moderate, other, rules}
  for (const f of frameworks) totals[f] = { critical: 0, serious: 0, moderate: 0, other: 0 };
  const sevOrder = { critical: 0, serious: 1, moderate: 2 };

  for (const file of files) {
    let code;
    try { code = readFileSync(file, "utf8"); } catch { continue; }
    const findings = detectPatterns(code, file, rules);
    if (findings.length === 0) continue;
    fileCount++;
    for (const m of findings) {
      const rule = rules.find((r) => r.id === m.ruleId);
      const fix = rule ? fixGuidance(rule) : null;
      process.stdout.write(`${file}:${m.line} · ${m.ruleId} · ${m.severity ?? "—"} · ${fix ?? "—"}\n`);
      const t = totals[rule.framework];
      if (m.severity) t[m.severity]++;
      else t.other++;
    }
  }

  const concerns = Object.values(totals).reduce((a, t) => a + t.critical + t.serious + t.moderate, 0);
  const others = Object.values(totals).reduce((a, t) => a + t.other, 0);
  const parts = frameworks.map((f) => {
    const t = totals[f];
    return `${f} critical ${t.critical} / serious ${t.serious} / moderate ${t.moderate}`;
  });
  process.stdout.write(
    `summary: ${parts.join(" | ")} — ${concerns} concern${concerns === 1 ? "" : "s"} (+${others} positive/pattern) across ${fileCount} file${fileCount === 1 ? "" : "s"}` +
    ` · rules: ${frameworks.length > 1 ? `${frameworks.map((f) => counts[f]).join("/")} ≡ ${totalRules}` : totalRules}\n`,
  );
}

const invokedDirectly = import.meta.url === pathToFileURL(resolve(process.argv[1] ?? process.argv[0])).href;
if (invokedDirectly) {
  main(process.argv.slice(2));
}
