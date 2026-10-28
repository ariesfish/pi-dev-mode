# The deepening conversation

Loaded only after the user picks a candidate from the pick-list.

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam (the dependency classes that decide how a deepened module crosses its seam sit in [DEEPENING.md](DEEPENING.md)), what tests survive.

Side effects happen inline as decisions crystallize:

- **Naming a deepened module after a concept not in `GLOSSARY.md`?** Add the term to `docs/GLOSSARY.md` — same discipline as `grill-me` (see [../../../references/glossary-format.md](../../../references/glossary-format.md)). Create the file lazily if it doesn't exist.
- **Sharpening a fuzzy term during the conversation?** Update `docs/GLOSSARY.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones. See [../../../references/adr-format.md](../../../references/adr-format.md).
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).
