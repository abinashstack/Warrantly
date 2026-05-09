package handler_test

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func testContext() context.Context {
	return context.Background()
}

func newTestPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	if databaseURL == "" {
		// Try loading from .env
		godotenv.Load("../../.env")
		databaseURL = os.Getenv("DATABASE_URL")
	}
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}
	return pgxpool.New(ctx, databaseURL)
}
