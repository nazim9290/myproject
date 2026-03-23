# Command: /review

Run a code quality review on a file or the entire project.

## Usage
`/review` — review all recently changed files
`/review [filename]` — review a specific file
`/review src/pages/students/` — review all files in a folder

## Steps

1. Identify which files to review
2. Read each file using the Read tool
3. Apply every check from `.claude/agents/code-reviewer.md`
4. Report issues grouped by severity:
   - **CRITICAL** — will cause runtime error or data loss
   - **WARNING** — incorrect pattern, may cause bugs
   - **SUGGESTION** — style/consistency improvement

## Output Format

```
REVIEWING: src/pages/students/StudentDetailView.jsx
============================================

CRITICAL (must fix):
  LINE ~45: [theme] Hardcoded color "#ef4444" — use t.rose
  LINE ~123: [state] Mutating array directly — use spread

WARNING (should fix):
  LINE ~67: [pagination] setPage(1) not called on filter change
  LINE ~89: [ux] No toast on delete action

SUGGESTION (optional):
  LINE ~200: [perf] key={index} on mutable list — use item.id

SUMMARY: 2 critical, 1 warning, 1 suggestion
```

## Auto-Fix Option
After reporting, offer to fix all CRITICAL and WARNING issues automatically.
Apply fixes using the Edit tool, one issue at a time.
