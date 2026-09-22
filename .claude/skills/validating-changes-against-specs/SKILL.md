---
name: validating-changes-against-specs
description: Spec-driven development enforcer. ALWAYS invoke this skill when implementing, planning, or reviewing any code change, feature or behaviour change. Ensures the relevant specification is identified and that the implementation or plan complies with it. Do not proceed with code changes without first validating against specs — use this skill first.
---
### STEP 1: Infer domain from changed files

For each change, infer the domain area it belongs to by analyzing:
- Extract domain terms from:
    - folder path (preferred)
    - file name
    - class names
    - method names involved in the change
    - code itself if the previous points are inconclusive

### STEP 2: Resolve spec

Try to match domain terms to spec files in `docs/specs/` and select the closest match. 

Once selected, ask the user to confirm if the resolved spec is correct and relevant to the change. If the user says no, ask them to specify which spec(s) to use.

If no spec found: 
- STOP And **Ask user to run /authoring-specs**
- Don't provide any other alternative, the spec must be created before proceeding using /authoring-specs.

### STEP 3: Load spec

Load only the resolved spec.

If multiple candidates are found, ask the user to select which one(s) to apply.

### STEP 4: Extract requirements and constraints

From the spec(s), identify:

- **Requirements**: the numbered MUST-level rules
- **Contracts**: input and output models, fields, types
- **Rules**: behavioral rules, edge cases, fallbacks
- **Acceptance criteria**: the checkboxes

If any are unclear or missing, STOP and ask the user for clarification, ask question using `AskUserQuestion` tool one by one.

### STEP 5: Validate the code against the spec

Check the changed code against every applicable requirement, rule, and acceptance criterion from the spec.

Verify:

- All required fields and types match the spec contracts
- Behavioral rules are implemented correctly
- Edge cases listed in the spec are handled
- No behavior is introduced that isn't covered by the spec

### STEP 6: Report

**If compliant:** confirm the change satisfies the spec and list which acceptance criteria are covered.

If the spec is `status: partially-implemented` and this change closes one of the deltas listed under its `### Notes`, say so and tell the user the spec needs its bookkeeping settled: delete that delta line, tick the acceptance criteria the change now satisfies, and — once no deltas remain — move `status` to `implemented` and bump `updated`. Nothing else flips that status, so an unclosed delta stays `partially-implemented` indefinitely and the spec stops describing reality. Route the edit through `/authoring-specs`; do not rewrite the spec here.

**If not compliant:** list each violation with:

- The spec rule or criterion that is violated
- What the code does vs. what the spec requires
- Suggested fix

Do NOT silently fix violations. Report them to the user.

Ask the user to fix the code to comply with the spec or change the spec if the requirements are no longer valid, in that case STOP and ask the user to run /authoring-specs to update the spec before proceeding.

## Red Flags — STOP

- Code introduces behavior not defined in any spec
- Code contradicts a spec rule
- A spec says one thing but existing code does another — flag to user, do not silently pick one. The divergence is rarely confined to the change under review, so hand off to `/detecting-spec-drift` for the full picture before anyone picks a side.
