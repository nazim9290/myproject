# Command: /fix

Find and fix an error or bug in the AgencyOS project.

## Usage
`/fix` — fix the most recent error (check browser console or describe the bug)
`/fix [description]` — fix a specific described bug

## Steps

1. Read the error message or bug description carefully
2. Use the debugger agent behavior from `.claude/agents/debugger.md`
3. Search for the relevant file:
   - Runtime error → check the stack trace for file + line
   - Visual bug → identify which component renders that UI
   - Logic bug → trace the data flow from state to render
4. Read the identified file(s) with the Read tool
5. Identify the root cause (see common bugs in debugger.md)
6. Apply a **minimal fix** — do not refactor unrelated code
7. Verify the fix follows CLAUDE.md patterns
8. Report: bug, root cause, file changed, what was fixed

## Common Fixes in This Project

### "Cannot read properties of undefined"
- Check if data has `fees.items` vs old `fees.total` shape
- Guard: `student.fees?.items || []`

### Blank page after filter
- `safePage` not used: `const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)))`

### Toast not working
- Missing `const toast = useToast();` at component top

### Colors not theming
- Component not calling `const t = useTheme();`
- Using hardcoded color instead of `t.cyan` etc.

### Payment category undefined
- New payment added without `category` field
- Guard display: `CATEGORY_CONFIG[p.category] || { label: p.category, color: "#94a3b8", icon: "💰" }`
