---
name: detecting-spec-drift
description: Spec-to-code drift auditor. ALWAYS invoke this skill whenever a spec in `docs/specs/` has just been created or modified (including immediately after /authoring-specs), when the user asks whether the code still matches a spec, when a spec's `status` may be stale, or when auditing spec drift across the codebase. Direction matters — use this skill when the **spec** is what changed; use `validating-changes-against-specs` instead when **code** is what changed.
---

## Why this exists

A spec change silently invalidates code that was compliant the day before. `validating-changes-against-specs` only inspects code at the moment *code* changes, so once a spec moves, nothing re-examines the code that spec already governs. Drift then accumulates invisibly until someone stumbles onto it while doing something unrelated — which is exactly how it is usually found, far too late.

This skill closes the loop by walking outward from the spec to the code, rather than inward from a diff.

If you need the spec anatomy (frontmatter fields, contract tables, which sections are mandatory), read `../authoring-specs/spec-rules.md`.

### STEP 1: Establish scope

Identify which spec(s) are under review:

- Named by the user, or passed as arguments → review those
- Just written or edited by `/authoring-specs` → review that one
- User asks for a broad audit → every file in `docs/specs/`

State the spec list back to the user before starting, so a misread scope is caught before the work.

### STEP 2: Map the spec to the code it governs

Derive search targets from the spec rather than guessing at file names, since the spec's own contracts name the boundaries:

- **Inbound Interfaces** table → the route, event, or job that triggers the behaviour, and its inbound adapter
- **Outbound Interactions** table → repositories, event publishers, external clients, and the tables or topics they touch
- **Functional Requirements / Rules** → the domain entity or use case holding that logic
- **Acceptance Criteria** → the tests that should assert them

Use the domain vocabulary of the spec as search terms, but treat a vocabulary mismatch as a *finding*, not a dead end: if the spec says `close` and the code only has `lock`, that divergence is the point — record it and keep going rather than concluding the feature is unimplemented.

### STEP 3: Check every spec element against the code

Walk each numbered requirement, contract row, rule, and acceptance criterion. For each, establish where it is satisfied in the code — file and line — or that it is not.

Also verify the frontmatter tells the truth: `status` must match reality (`spec-rules.md` rule 10), and a spec claiming `not-implemented` while the code implements it is itself a finding.

### STEP 4: Classify each finding

Naming the *kind* of drift matters because the fix differs sharply between them:

| Kind | Meaning | Usual fix |
|------|---------|-----------|
| **Missing** | Spec requires it; code lacks it | Implement it |
| **Undeclared** | Code does it; no spec covers it | Extend the spec, or delete the behaviour |
| **Contradictory** | Both exist but disagree (route, status code, event name, field type) | A decision is needed — do not guess |
| **Untested** | Acceptance criterion has no asserting test | Add the test |
| **Stale metadata** | `status` / `updated` do not reflect reality | Correct the frontmatter |

**Contradictory** is the one that needs care: the spec and the code each represent somebody's intent, and picking a side unasked destroys information. Surface both readings and let the user choose.

### STEP 5: Report

Report every finding with:

- The requirement, rule, or criterion involved
- What the spec requires vs. what the code does, with `file:line`
- The drift kind from STEP 4
- A suggested fix

Close with a compliance summary: which acceptance criteria are met, which are not, and which are met but unverified by tests.

Do NOT silently fix anything. This skill reports; the user decides. A drift review that quietly rewrites code destroys the very signal it was run to produce — and the fix often belongs in the spec rather than the code.

When the user chooses to act, route the work: code fixes go through the relevant implementation skill (and `validating-changes-against-specs`), spec fixes go through `/authoring-specs`.

## Red Flags — STOP

- Spec and code contradict each other → report both, never pick a side unprompted
- A spec has no discoverable implementation at all → confirm with the user before concluding it is unimplemented; the code may simply use different vocabulary
- Review would require changing code to reach a conclusion → it would not; report instead
- Acceptance criteria too vague to verify → ask the user to sharpen them via `/authoring-specs`
