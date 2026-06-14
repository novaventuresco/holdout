Produce a session summary and save to docs/quality/handoff.md, overwriting
previous content. Use this exact structure:

---
# Holdout — Session Handoff

Date: [today's date]
Phase: [current phase number and name]
Previous session: [date and one-line description]

---

## What Was Accomplished This Session

[Numbered list. One item per feature or task completed. Include P-number if
applicable. Note if a /review or /fix-review was run and which findings
were resolved.]

---

## Files Modified This Session

| File | Change |
|------|--------|
[One row per file. Be specific about what changed, not just "modified".]

---

## What Comes Next

[Numbered list of next steps. For each step, state the explicit gate that
must pass before it can begin — e.g., "sandbox IAP testing complete",
"DEV_UNLOCK_ALL_THEMES confirmed false". If the next step is an EAS build
or App Store submission, list all pre-conditions.]

---

## Open Decisions

[Any architectural or product decision raised but not resolved. If none: "None blocking."]

---

## Known Issues / Blockers

[Active issues. Reference finding IDs (C-01 / H-01 etc.) from last-review.md
if relevant. If none: "None active."]

---

After saving, confirm: "Handoff saved to docs/quality/handoff.md."
