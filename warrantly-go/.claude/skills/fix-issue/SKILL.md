---
name: fix-issue
description: Fix a GitHub issue by reading it, implementing the change, testing, and committing
allowed-tools: Bash(go *) Bash(make *) Bash(git *) Bash(gh *)
---

# Fix GitHub Issue

Fix the GitHub issue specified by the user.

## Steps

1. Read the issue: `gh issue view $ARGUMENTS --json title,body,labels`
2. Understand the requirements and acceptance criteria
3. Find the relevant code using Grep and Glob
4. Implement the fix following existing patterns in the codebase
5. Write or update tests covering the change
6. Verify: `go build ./...` and `go test ./...`
7. Create a descriptive commit referencing the issue: `git commit -m "fix: description (closes #N)"`
