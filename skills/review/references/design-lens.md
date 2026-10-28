# Design lens — the three tiers

Loaded by lens 5 only when the diff touches UI-bearing code (TSX/JSX/HTML/CSS/SCSS, Flutter dart, React Native). A diff with no UI code gets "no UI-bearing changes, design axis n/a" and nothing else.

- **Mechanical tier**: run `node skills/ui-design/scripts/audit-ui.mjs
  <changed-file-dirs>` (zero-dependency, 182 rules: web/css/flutter/
  react-native) — findings are objective file:line report rows carrying the
  audit's severity. Then check the diff's UI values against the repo-root
  DESIGN.md tokens: a color/size/spacing not in the contract is a finding,
  citing both the file:line and the DESIGN.md section it violates (no
  DESIGN.md → say so, the way lens 1 says "no spec available").
- **Guidelines tier**: judge the diff's UI craft against the vendored Vercel
  web interface guidelines at `skills/ui-design/references/web-guidelines.md`
  (layout, typography, color, motion, accessibility) — a violation cites the
  guideline and the file:line.
- **Visual tier**: any claim about how things LOOK must come from the
  `pi-dev:image-reader` agent — spawn it with `subagent_type:
  pi-dev:image-reader` (capture-based: it reads the rendered screenshot,
  never the code). A reviewer inferring visual conclusions from code is a
  protocol violation — the same never-self-assess-on-a-model-that-cannot-see
  rule `implement` runs on builders.
