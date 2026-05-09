# Review Instructions

## Severity Calibration

Reserve **Important** for findings that would:

- Break existing behavior or API contracts
- Introduce security vulnerabilities
- Cause data loss or corruption
- Block a rollback

Style, naming, and refactoring suggestions are **Nit** at most.

## Limits

- Report at most 5 Nits per review. Say "plus N similar items" for the rest.
- If the PR is under 20 lines, skip Nits entirely.

## Do Not Report

- Anything CI already enforces (lint, formatting, build errors)
- Generated files or lock files (`go.sum`)
- Test-only code that intentionally violates production rules
- Missing comments on unexported functions

## Always Check

- New API routes have at least one test
- SQL queries use parameterized placeholders (`$1`, `$2`), never string interpolation
- DATE columns use `::text` cast in SELECT queries
- Error responses don't leak internal details (no stack traces, no SQL errors)
- Log lines don't include PII (phone numbers, tokens)
- Empty slices initialized before JSON marshal
- Price/amount fields validated before DB insert
- File uploads enforce size limits
