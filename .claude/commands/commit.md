# Command: /commit

Stage, commit, and push all current changes to git.

## Steps

1. Run `git status` to see what has changed
2. Run `git diff --stat` to summarize changes
3. Analyze the changes and draft a commit message:
   - Format: `feat: [short description in English]`
   - Body: brief bullet points of what changed (optional)
   - Footer: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
4. Stage specific changed files (not `git add .` blindly):
   - Include: `src/`, `CLAUDE.md`, `MASTER_PROMPT.md`, `.claude/`
   - Exclude: `.env`, `node_modules/`, `dist/`
5. Commit with the drafted message
6. Push to origin current branch
7. Report success with commit hash

## Commit Message Conventions
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code cleanup without behavior change
- `data:` changes to mock data files only
- `ui:` visual/styling changes only
- `docs:` CLAUDE.md, MASTER_PROMPT.md, .claude/ changes

## Example
```bash
git add src/pages/accounts/AccountsPage.jsx src/data/students.js MASTER_PROMPT.md
git commit -m "feat: add fee structure breakdown and payment ledger to AccountsPage

- Student fees tab shows per-category income breakdown
- Per-student summary table with progress bars
- Payment ledger auto-derived from student.fees.payments
- CSV export for student fee data

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

## Safety
- Never force push to main/master
- Never commit .env files
- If push fails due to upstream changes, run `git pull --rebase` first
