---
name: security-audit
description: Run a security audit on the codebase checking for common vulnerabilities
allowed-tools: Bash(go *) Bash(govulncheck *)
---

# Security Audit

Perform a security audit of the Warrantly Go backend.

## Checks

1. **SQL Injection**: Grep for string concatenation in SQL queries
   - Safe: `$1`, `$2` parameterized placeholders
   - Unsafe: `fmt.Sprintf` with user input in SQL strings

2. **Auth Bypass**: Verify all routes in `internal/router/router.go` that should be protected are behind `authMW`

3. **Input Validation**: Check handlers for:
   - Missing body size limits on uploads
   - Unvalidated price/amount fields
   - Missing required field checks

4. **Dependency Vulnerabilities**: Run `govulncheck ./...`

5. **Token Security**: Verify:
   - Access tokens can't be used as refresh tokens (and vice versa)
   - Expired tokens are rejected
   - Wrong signing key is rejected

6. **Error Leakage**: Ensure error responses don't expose internal details (SQL errors, stack traces)

7. Report findings as a markdown table with severity, location, and recommendation.
