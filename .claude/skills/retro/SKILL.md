---
name: retro
description: Retrospective on a reviewed commit or range. Use after a review surfaces findings, or when the user says "retro", to trace each finding to the missing guardrail and propose the fix to docs, lint, types or tests.
---

# Retro

A review found defects; the retro finds why the system let them through. The target is the **guardrail**, never the author: every finding maps to the cheapest durable change that would have stopped it earlier.

Input: a commit SHA or range (default `HEAD`) and the review findings. If no findings are in the conversation, ask for them or run a review first.

## Steps

1. **Collect.** List every finding with its file, line and one-line summary. Read the diff with `git show <sha>` (or `git log -p <range>`). Done when every finding is pinned to a concrete hunk.

2. **Trace.** For each finding, name the earliest point it could have been caught and why it was not. Classify the gap as exactly one of:
   - **language**: a `CONTEXT.md` term was missing, fuzzy, or ignored
   - **decision**: an ADR was missing, unclear, or contradicted
   - **guidance**: `AGENTS.md` or a doc in `docs/` was silent, wrong, or buried
   - **types**: the type system could have made the defect unrepresentable
   - **lint**: a lint or dependency rule could have flagged it
   - **test**: a test at some layer would have gone red
   - **process**: a workflow step was skipped
     Done when every finding has a gap and a one-sentence reason.

3. **Prescribe.** For each gap, propose one change, preferring in order: types, lint, test, then docs. A doc change names the exact file and the replacement text. Before proposing new text, check whether an existing line already covers it and was ignored; if so, sharpen that line instead of adding a second. Done when every gap has a change, and no two changes say the same thing.

4. **Prune.** Scan the docs the changes touch for lines this retro shows to be stale, duplicated or never followed. Propose deleting or rewriting them. Done when every touched doc has been read end to end.

5. **Record.** Write `docs/retros/YYYY-MM-DD-<short-sha>.md` with a table of findings, gaps and prescribed changes, plus the prune list.

6. **Confirm.** Present the prescribed changes to the user. Apply only the ones they approve, each as its own commit: `chore(retro): <change>`.
