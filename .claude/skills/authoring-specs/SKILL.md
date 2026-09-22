---
name: authoring-specs
description: Specification authoring and management expert. ALWAYS invoke this skill when a code change has no governing spec, when an existing spec needs updating, or when the user asks about creating or modifying specs. Ensures a governing spec exists and is up to date. Do not attempt to write or edit spec files directly — use this skill first.
disable-model-invocation: true
---

**Before proceeding, read `spec-rules.md` for the spec template and rules. All outputs MUST strictly follow them. Do not improvise structure.**

## STEP 1: Determine intent

$ARGUMENTS

- If arguments are provided, use them to determine whether this is:
    - **New spec** — defining behavior for a new feature or domain area
    - **Update spec** — modifying or extending an existing spec
    - **Other** — user-defined request

- If no arguments are provided:
    - Infer intent from context (e.g. code changes, user request)
    - If unclear, ask the user to clarify:
        1. New spec
        2. Update spec
        3. Other

## STEP 2: Locate and assess existing specs

- Check for existing specifications in `/docs/specs`
- Identify any spec(s) related to the feature, files, or domain in question

Rules:
- If a relevant spec exists → treat as **Update spec**
- If no relevant spec exists → treat as **New spec**
- If multiple specs exist → identify all applicable ones and clarify scope if needed
- Do NOT assume absence without checking

## STEP 3: Gather required details

- Use the template defined in `spec-rules.md` to determine required information
- Extract as much context as possible from the request or code before asking questions
- Ask only for missing or unclear information

Rules:
- Ask questions **one by one** using the `AskUserQuestion` tool
- Do NOT proceed until all required fields are explicitly confirmed by the user
- Do NOT assume missing details

## STEP 4: Write or update the spec

- Create or update the spec file in `docs/specs/`
- File naming: `docs/specs/<feature-name>.md` (kebab-case)
- Follow the template and rules from `spec-rules.md` exactly

### STEP 4b: Close the gap that prompted the change

Apply `spec-rules.md` rules 11 and 12:

- Write the missing behaviour into the spec **body**, now. A note saying it *should* say 204 is not a spec that says 204 — notes record only what the code still owes.
- If the change touches state, a contract or a decision another spec governs, edit that spec in the same pass. Never write "spec X is updated to match" unless you just did.
- Set `status` on every spec touched: `implemented` if the code already behaves that way, otherwise `partially-implemented` plus one `### Notes` line per outstanding delta.

`partially-implemented` is the normal landing state here; it tells `detecting-spec-drift` the gap is declared, not newly found, and stays until the code catches up.

## STEP 5: Review and confirmation

- Present the full spec and any index changes to the user
- Highlight:
    - New sections
    - Modified sections
    - Every other spec touched, and why
    - Any `status` transition, and for `partially-implemented` the deltas the code still owes

- Do NOT proceed to implementation until the user explicitly approves

## STEP 6: Audit existing code against the spec

Once the spec is approved, the code it governs may no longer comply — an updated spec can invalidate code that was correct beforehand, and nothing else re-checks that direction.

- Invoke the `detecting-spec-drift` skill for the spec just written or updated
- Report the drift it finds; do NOT fix code here

This is a review, not implementation: STEP 5's approval gate still stands.