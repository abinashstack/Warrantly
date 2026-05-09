.PHONY: build run dev migrate test clean

build:
	go build -o bin/server ./cmd/server

run: build
	./bin/server

dev:
	go run ./cmd/server

migrate:
	@echo "Run: psql \$$DATABASE_URL -f internal/database/migrations/sql/001_initial_schema.up.sql"

test:
	go test ./... -v -cover

clean:
	rm -rf bin/ storage/

lint:
	golangci-lint run ./...
