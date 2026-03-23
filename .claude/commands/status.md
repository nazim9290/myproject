# Command: /status

Show a full progress report of the AgencyOS project.

## Steps

1. Read `MASTER_PROMPT.md`
2. Count features by status: [x] done, [~] in progress, [ ] pending
3. Read `CLAUDE.md` for module list
4. Optionally run `git log --oneline -10` for recent commits
5. Generate the report

## Output Format

```
AgencyOS — Project Status Report
Date: [today]
================================

OVERALL PROGRESS
  Total features tracked: N
  Completed [x]: N (NN%)
  In Progress [~]: N
  Pending [ ]: N

BY MODULE
  Visitors:       [x][x][x][ ][ ]  3/5 (60%)
  Students:       [x][x][x][x][ ]  4/5 (80%)
  Accounts:       [x][x][x][ ]     3/4 (75%)
  HR & Branches:  [x][x][ ][ ]     2/4 (50%)
  ...

NEXT UP (top 3 priority)
  1. Dashboard — Today's tasks widget
  2. Reports — Fee collection report
  3. Students — Bulk export CSV

RECENT COMMITS (last 5)
  [from git log]

DEV SERVER
  Running: http://localhost:5175
```

## Notes
- If MASTER_PROMPT.md does not exist, read the src/ file tree and estimate based on what pages exist
- If git is not initialized, skip the commits section
