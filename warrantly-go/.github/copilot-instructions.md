Instructions for GitHub Copilot working on the Warrantly Go backend.

## Overview

This is a Go REST API for warranty management (consumers + dealers). Uses chi/v5 router, pgx/v5 for PostgreSQL, JWT auth with phone OTP.

## Coding Guidelines

- Write raw SQL with pgx parameterized queries. No ORM.
- Cast DATE columns with `::text` in SELECT queries.
- Initialize empty slices before JSON marshaling (`if s == nil { s = []T{} }`).
- Use `respondJSON(w, status, data)` and `respondError(w, status, msg)`.
- Get authenticated user: `auth.UserIDFromContext(r.Context())`.
- Validate money fields: non-negative, max 9999999999.99.
- File uploads: always use `http.MaxBytesReader`.
- Handle FK violations (code "23503") as 400 Bad Request.

## Testing

- Run `go build ./...` to verify compilation.
- Run `go test ./...` to run all tests.
- Integration tests need DATABASE_URL and JWT_SECRET env vars.

## Project Structure

- `cmd/server/` — entry point
- `internal/auth/` — JWT, OTP, middleware
- `internal/handler/` — HTTP handlers (one file per domain)
- `internal/pdf/` — PDF generation
- `internal/router/` — route setup
- `internal/database/migrations/` — SQL schema
