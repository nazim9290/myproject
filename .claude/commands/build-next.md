# Command: /build-next

Implement the single next pending feature from MASTER_PROMPT.md.

## Steps

1. Read `MASTER_PROMPT.md`
2. Find the first `[ ]` item under "NEXT PRIORITY" section
3. If "NEXT PRIORITY" list is exhausted, pick the first `[ ]` from any module
4. Read `CLAUDE.md` for project patterns
5. Read `.claude/rules/frontend.md` for coding rules
6. Read all relevant existing source files before editing
7. Implement the feature completely:
   - New component file if needed
   - Register in App.jsx PageRenderer if it's a new page
   - Update relevant data files if needed
8. Mark the feature `[x]` in MASTER_PROMPT.md
9. Report: what was built, files changed, how to test it

## Output Format
```
BUILDING: [feature name]
FILES TO CHANGE: [list]
---
[implementation]
---
DONE: [feature name] marked [x] in MASTER_PROMPT.md
TEST: [how to verify it works]
```
