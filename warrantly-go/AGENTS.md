# AGENTS.md — Warrantly Go Backend

Instructions for AI coding agents (OpenAI Codex, GitHub Copilot, Cursor, Claude Code, etc.)

## Project Context

This is a Go REST API for a warranty management SaaS. It handles:

- Phone OTP authentication with JWT tokens
- Consumer product registration and warranty tracking
- Dealer inventory management and sales flow
- Invoice generation with GST calculation and PDF output
- File uploads for invoice images

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Language | Go 1.26                                 |
| Router   | chi/v5                                  |
| Database | PostgreSQL (Neon serverless) via pgx/v5 |
| Auth     | JWT (HS256) + Phone OTP                 |
| PDF      | go-pdf/fpdf                             |
| Config   | godotenv                                |

## Code Style

- Standard Go formatting (`gofmt`)
- No ORM — write raw SQL with `$1` parameterized placeholders
- Handlers receive `*pgxpool.Pool` directly (no repository layer yet)
- Error handling: check every error, return appropriate HTTP status
- Use `respondJSON(w, status, data)` and `respondError(w, status, msg)` helpers
- Always initialize empty slices before marshaling to JSON

## When Making Changes

1. Run `go build ./...` to verify compilation
2. Run `go test ./...` to ensure tests pass
3. Check for nil slice issues in any new list endpoint
4. Use `::text` cast for any DATE column in SELECT queries
5. Add price validation (non-negative, within NUMERIC bounds) for money fields
6. Use `http.MaxBytesReader` for any file upload endpoint

## File Organization

- New endpoints go in `internal/handler/` — one file per domain
- New business logic helpers go at bottom of the relevant handler file
- Database schema changes go in `internal/database/migrations/sql/`
- Tests go alongside code (`*_test.go` in same package or `_test` package)

## Security Checklist

- [ ] Parameterized SQL queries (never string concatenation)
- [ ] JWT validation on all protected routes
- [ ] Input validation (length, range, format)
- [ ] File upload size enforcement
- [ ] No secrets in code (use env vars)
- [ ] FK constraint errors return 400, not 500
