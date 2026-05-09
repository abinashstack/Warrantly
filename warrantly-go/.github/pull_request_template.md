## Summary

<!-- What does this PR do? Keep it to 1-3 bullet points. -->

-

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Refactor (no functional changes)
- [ ] Documentation
- [ ] Tests

## Changes Made

<!-- List the key files changed and why -->

| File | Change |
| ---- | ------ |
|      |        |

## Testing

- [ ] `go build ./...` passes
- [ ] `go test ./...` passes
- [ ] Manually tested the endpoint(s)
- [ ] No new security vulnerabilities introduced

## Checklist

- [ ] SQL queries use parameterized placeholders (`$1`, `$2`)
- [ ] DATE columns cast with `::text` in queries
- [ ] Empty slices initialized before JSON response
- [ ] Price/amount fields validated (non-negative, within bounds)
- [ ] File uploads enforce size limits with `MaxBytesReader`
- [ ] Error responses use appropriate HTTP status codes
