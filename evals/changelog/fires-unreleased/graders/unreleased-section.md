---
type: llm
---

PASS if the reply edits the existing CHANGELOG with an Unreleased section whose
entries are grouped and written in the file's established style, scoped to the
commits since the last release tag.

FAIL if it writes release notes as chat prose only, creates a separate file, or
mixes internal chores into user-facing entries without saying so.
