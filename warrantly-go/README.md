# Warrantly Go Backend

A warranty management REST API built in Go — handles consumer product registration, dealer inventory management, invoice generation with GST calculation, and PDF output.

## Tech Stack

- **Go 1.26** with Chi v5 router
- **PostgreSQL** (Neon serverless) via pgx/v5
- **JWT** authentication with phone OTP
- **PDF generation** with go-pdf/fpdf
- **No ORM** — raw parameterized SQL

## Quick Start

```bash
# Clone and setup
git clone https://github.com/abinashstack/Warrantly.git
cd warrantly-go
cp .env.example .env  # Fill in your DATABASE_URL and JWT_SECRET

# Run migrations
go run ./cmd/migrate

# Start server
make dev
```

## API Overview

| Category        | Endpoints                                          |
| --------------- | -------------------------------------------------- |
| Auth            | `POST /api/auth/send-otp`, `verify-otp`, `refresh` |
| Profile         | `GET/POST /api/profile`                            |
| Onboarding      | `POST /api/onboarding/user`, `/dealer`             |
| Catalog         | `GET /api/categories`, `/items`, `/products`       |
| Customers       | `GET/POST /api/customers`                          |
| Dealers         | `POST /api/dealers`, `GET /api/dealerUsers`        |
| Dealer Products | `GET/POST /api/dealerProducts`, `GET /{id}`        |
| User Products   | `GET/POST /api/user-products`, `GET /{id}`         |
| Invoices        | `GET/POST /api/invoices`, `GET /{invoiceId}`       |
| Uploads         | `POST /api/upload`, `POST /api/upload/dealer`      |
| Health          | `GET /health`                                      |

## Environment Variables

| Variable         | Required | Default               | Description                  |
| ---------------- | -------- | --------------------- | ---------------------------- |
| `DATABASE_URL`   | Yes      | —                     | PostgreSQL connection string |
| `JWT_SECRET`     | Yes      | —                     | Access token signing key     |
| `REFRESH_SECRET` | No       | JWT_SECRET            | Refresh token signing key    |
| `PORT`           | No       | 3000                  | Server port                  |
| `OTP_MODE`       | No       | mock                  | `mock` or `msg91`            |
| `BASE_URL`       | No       | http://localhost:3000 | Base URL for file serving    |

## Commands

```bash
make build    # Compile to bin/server
make dev      # Run with go run
make test     # Run all tests with coverage
make lint     # Run golangci-lint
make clean    # Remove bin/ and storage/
```

## Testing

```bash
# Unit tests (no DB needed)
go test ./internal/auth/ ./internal/pdf/ -v

# Integration tests (needs DATABASE_URL + JWT_SECRET)
source .env && go test ./internal/handler/ -v
```

## Architecture

```
cmd/server/       — Entry point with graceful shutdown
cmd/migrate/      — Schema migration runner
internal/
  auth/           — JWT generation, OTP service, auth middleware
  config/         — Environment configuration
  database/       — pgx connection pool, SQL migrations
  handler/        — HTTP handlers (business logic)
  model/          — Data structures
  pdf/            — Invoice PDF generation (pure Go)
  router/         — Chi router with CORS + routes
```

## AI Agent Support

This repo is configured for AI coding agents:

| File                              | Agent                                        |
| --------------------------------- | -------------------------------------------- |
| `CLAUDE.md`                       | Claude Code                                  |
| `AGENTS.md`                       | OpenAI Codex, Copilot, Gemini CLI, 30+ tools |
| `.cursorrules`                    | Cursor                                       |
| `.github/copilot-instructions.md` | GitHub Copilot                               |
| `REVIEW.md`                       | Claude Code Review                           |
| `.claude/skills/`                 | Claude Code Skills                           |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
