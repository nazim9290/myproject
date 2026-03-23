# Command: /build-all

Build all pending features from MASTER_PROMPT.md sequentially.

## Steps

1. Read `MASTER_PROMPT.md` and list all `[ ]` (not started) items
2. Read `CLAUDE.md` for project patterns
3. Sort by priority (use the "NEXT PRIORITY" section at the bottom of MASTER_PROMPT.md)
4. For each pending feature, in order:
   a. Announce which feature you are starting
   b. Read all relevant existing files before editing
   c. Implement the feature following `.claude/rules/frontend.md`
   d. Mark the feature `[x]` in MASTER_PROMPT.md immediately after completion
   e. Show a brief summary of what was changed
5. After all features done, show final completion report

## Rules
- Do not skip features — implement each one fully before moving to the next
- If a feature depends on another unfinished feature, implement the dependency first
- If a feature is too large for one response, implement as much as possible and clearly state where to continue
- Never mark a feature [x] unless it is fully working
- Use the feature-builder agent behavior from `.claude/agents/feature-builder.md`
