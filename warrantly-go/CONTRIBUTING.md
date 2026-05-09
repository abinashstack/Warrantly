# Contributing to Warrantly

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your Neon PostgreSQL URL
3. Run migrations: `go run ./cmd/migrate`
4. Start the server: `make dev`

## Development Workflow

1. Create a branch from `dev`: `git checkout -b feature/your-feature`
2. Make your changes following the conventions below
3. Run tests: `make test`
4. Run lint: `make lint`
5. Push and open a PR against `dev`

## Code Conventions

- **Go formatting**: Use `gofmt` (enforced by CI)
- **SQL**: Always use parameterized queries (`$1`, `$2`)
- **Error handling**: Check every error, return appropriate HTTP status
- **JSON responses**: Use `respondJSON` / `respondError` helpers
- **Nil slices**: Always initialize before marshaling (`if s == nil { s = []T{} }`)
- **DATE columns**: Cast with `::text` in SELECT queries
- **File uploads**: Enforce size limits with `http.MaxBytesReader`
- **Tests**: Integration tests go in `internal/handler/handler_test.go`

## Project Structure

```
cmd/server/          — Entry point
cmd/migrate/         — Migration runner
internal/
  auth/              — JWT + OTP + middleware
  config/            — Environment config
  database/          — Connection pool + migrations
  handler/           — HTTP handlers (one file per domain)
  model/             — Data structures
  pdf/               — Invoice PDF generation
  router/            — Route definitions
```

## Commit Messages

Follow conventional commits:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `test:` — adding tests
- `refactor:` — code restructuring
- `ci:` — CI/CD changes
- `deps:` — dependency updates

## Labels

When creating issues, use these labels:

- `bug` — something is broken
- `feature` — new functionality
- `enhancement` — improve existing feature
- `security` — security-related
- `good-first-issue` — simple, well-scoped task
- `epic` — large multi-issue initiative
