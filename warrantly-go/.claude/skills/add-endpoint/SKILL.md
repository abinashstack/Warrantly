---
name: add-endpoint
description: Add a new API endpoint with handler, route, and tests
allowed-tools: Bash(go *) Bash(make *)
---

# Add New API Endpoint

Create a new API endpoint for the Warrantly backend.

## Steps

1. Determine the HTTP method, path, and purpose from the user's request
2. Create or edit the handler in `internal/handler/` following existing patterns:
   - Parse request body with `json.NewDecoder(r.Body).Decode(&req)`
   - Validate inputs (required fields, ranges, formats)
   - Execute SQL with parameterized queries via `h.pool`
   - Use `::text` cast for any DATE columns
   - Initialize empty slices before JSON response
   - Return with `respondJSON` or `respondError`
3. Register the route in `internal/router/router.go`
4. Add test in `internal/handler/handler_test.go`
5. Verify: `go build ./...` and `go test ./internal/handler/ -run TestNewEndpoint`
