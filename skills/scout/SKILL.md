---
name: scout
description: >-
  Scout the way before the main work moves: when the destination itself is
  undecided (more than one session can hold, foggier than a plan), chart a
  shared map of decision tickets on the project tracker and resolve them one
  at a time until the way clear. Charting, not charging — the output is
  decisions, not deliverables. Use when a loose idea is too big or too foggy
  to plan directly, or when the user asks to explore the direction first.
  Chinese triggers: 探路, 摸方向, 方向不明, 去向未定, 这摊子太大.
---

# Scout

A loose idea has arrived, too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Scouting is about finding that way. This skill charts the way as a **shared map** on the repo's issue tracker, then works its **decision tickets** one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting: a spec to hand off, a decision to lock before planning starts, or a change made in place. The map is domain-agnostic.

## Plan, don't do

Scout is **planning** by default: each ticket resolves a decision, and the map is done when the way is clear — nothing left to *decide* before someone goes and does the thing. The pull to just do the work is the signal you've reached the edge of the map and it is time to hand off. An effort can override this in its **Notes**, carrying execution into the map itself, but absent that: decisions, not deliverables.

## Refer by name

Every map and ticket is an issue with a **name**: its title. In everything the human reads, refer to tickets by name, never a bare id or number. The id and URL ride *inside* the name link.

## The map

A single issue labelled `scout:map`, the canonical artifact, an **index** not a store: decisions are gisted in one line each and live in their tickets. Where the map, tickets, blocking, and frontier queries live is tracker-specific — the tracker config comes from `setup` (default: local files under `.dev/`, where scouting a direction means one feature dir: the map at `.dev/<slug>/scout-map.md`, its decision tickets in the same directory; when the way clears, the spec and build tickets join them). No tracker provided → tell the user to run `setup` first.

Map body:

```markdown
## Destination
[what reaching the end looks like; one or two lines]

## Notes
[domain; skills every session should consult; standing preferences]

## Decisions so far
[- [<closed ticket title>](link): <one-line gist>]

## Not yet specified
[the fog: in-scope but not yet ticket-sharp]

## Out of scope
[work ruled beyond the destination; never graduates]
```

## Tickets

Each ticket is a **child issue** of the map, its body the question, sized to one agent session:

```markdown
## Question
[the decision or investigation this ticket resolves]
```

Each carries a `scout:<type>` label: `research`, `prototype`, `grilling`, `task`. **`scout:` labels are the only labels a map and its tickets carry** — never a triage label like `ready-for-agent`: they are decisions, not implementation work.

A session **claims** a ticket by assigning itself **first**, before any work. Blocking uses the tracker's **native** dependency relationship (it renders the frontier in the tracker UI); only trackers without native blocking fall back to a body convention. The **frontier** is the open, unblocked, unclaimed children.

## Ticket types

Every ticket is HITL (worked with a human) or AFK (agent alone). A HITL ticket only resolves through that live exchange — never stand in for the human's side of it.

- **Research (AFK)**: knowledge outside the working directory. Resolved by a subagent running `research`, findings on a throwaway branch, pushed but never PR'd.
- **Prototype (HITL)**: raise the discussion's fidelity with a cheap concrete artifact. Calls `proto`; links the prototype as an asset.
- **Grilling (HITL)**: the default. Calls `align` (interview + language, GLOSSARY/ADR inline).
- **Task (HITL/AFK)**: manual work blocking a decision (sign up for a service, provision access, move data so its shape can be seen). It earns its place by unblocking a decision, not by delivering the destination.

## Fog of war

The map is deliberately incomplete. Beyond the live tickets: **Not yet specified** — decisions you can tell are coming but cannot yet pin down, because they hang on open tickets. Resolving a ticket clears the fog ahead of it, graduating whatever is now specifiable into fresh tickets.

**Fog or ticket?** State the question precisely *now*? Ticket — even blocked. Cannot phrase it sharply yet? Fog. Don't pre-slice the fog.

**Out of scope** is different: work ruled beyond the destination (scope, not sharpness). It never graduates; a ticket found past the destination gets closed and one line recorded here, not in Decisions so far.

## Invocation

### Chart the map (loose idea)

1. **Name the destination** via `align`.
2. **Map breadth-first** (not deep on any one thread). If this surfaces no fog and the journey fits one session, you don't need a map: stop and ask how to proceed.
3. **Create the map** ( label): Destination and Notes filled, fog sketched into Not yet specified.
4. **Create the tickets you can specify now** as children; wire blocking edges and cross-references in a **second pass** with real ids — a placeholder `#<n>` auto-links to an unrelated issue. Wire, don't paste.
5. **Fire the research subagents** with the `agent` tool (lowercase) for `research` tickets in parallel (throwaway branch, push, no PR).
6. Stop: charting is one session's work; it hand-resolves nothing.

### Work through the map (map in hand)

1. Load the map (low-res; not every ticket body).
2. Choose the ticket (user-named, else first frontier ticket). Claim it before any work.
3. Resolve it as its `scout:<type>` label names — read the **label**, not the body: the body never states the type. Zoom ticket bodies on demand; a `## Notes` block may name other skills; in doubt, `align`.
4. Record: resolution comment, close, append the one-line gist to Decisions so far.
5. Graduate newly specifiable fog into tickets (create, then wire); rule mis-scoped tickets out of scope; update tickets a decision invalidates.

**One ticket per session** (research tickets excepted). Expect concurrent sessions: other agents work the frontier in parallel.
