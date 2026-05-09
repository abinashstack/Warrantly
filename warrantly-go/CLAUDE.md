# CLAUDE.md — Warrantly Go Backend

## Project Overview

Warrantly is a warranty management platform for consumers and dealers. This is the Go REST API backend replacing a previous Node.js implementation.

**Module:** `github.com/abinashstack/warrantly-go`
**Go version:** 1.26.2
**Database:** Neon PostgreSQL (serverless)
**Auth:** Phone OTP + JWT (HS256)

## Architecture

```
cmd/server/       — Entry point, graceful shutdown
cmd/migrate/      — Database migration runner
internal/
  auth/           — JWT generation/validation, OTP service, middleware
  config/         — Environment configuration (godotenv)
  database/       — Connection pool (pgx), migrations SQL
  handler/        — HTTP handlers (all business logic)
  model/          — Data structures
  pdf/            — Invoice PDF generation (go-pdf/fpdf)
  router/         — Chi v5 router, CORS, route definitions
storage/          — Generated PDFs and uploaded files (gitignored)
```

## Key Commands

```bash
make dev          # Run server with go run (hot-reload friendly)
make build        # Compile to bin/server
make test         # Run all tests with coverage
make lint         # Run golangci-lint
go test ./...     # Run all tests
```

## Environment Variables

Required: `DATABASE_URL`, `JWT_SECRET`
Optional: `PORT` (3000), `OTP_MODE` (mock), `REFRESH_SECRET`, `BASE_URL`, `STORAGE_DIR`

## Database

- PostgreSQL with pgx/v5 (binary protocol)
- DATE columns require `::text` cast when scanning into `*string`
- All UUIDs are `gen_random_uuid()` default
- Schema: `internal/database/migrations/sql/001_initial_schema.up.sql`

## Conventions

- **No ORM** — raw SQL with pgx parameterized queries
- **Handler pattern** — each handler struct gets `*pgxpool.Pool`
- **Auth context** — `auth.UserIDFromContext(ctx)` returns profile_id
- **JSON responses** — `respondJSON(w, status, data)` / `respondError(w, status, msg)`
- **Nil slice fix** — always `if slice == nil { slice = []T{} }` before JSON response
- **Error codes** — FK violation (23503) → 400, numeric overflow → 400
- **File uploads** — `http.MaxBytesReader` enforces 10MB limit
- **PDF generation** — pure Go with `go-pdf/fpdf`, no external binaries
- **GST calculation** — 18% split into CGST 9% + SGST 9%

## API Routes

Public: `POST /api/auth/{send-otp,verify-otp,refresh}`
Protected (JWT): All other `/api/*` routes
Static files: `GET /storage/*`

## Testing

- Unit tests: `internal/auth/`, `internal/pdf/`
- Integration tests: `internal/handler/` (require DATABASE_URL + JWT_SECRET)
- Run integration tests: `source .env && go test ./internal/handler/ -v`
- Tests use `httptest.NewServer` with real DB connections

## Common Pitfalls

1. pgx binary format can't scan PostgreSQL DATE into `*string` — use `::text` cast
2. Go nil slices marshal to JSON `null` — initialize empty slices
3. `ParseMultipartForm` alone doesn't reject oversized bodies — use `MaxBytesReader`
4. Mock OTP mode still requires `send-otp` to be called first (stores in DB)
5. NUMERIC(12,2) overflows at values > 9999999999.99 — validate before insert
