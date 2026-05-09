package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	RefreshSecret string
	OTPMode       string // "mock" or "msg91"
	OTPAPIKey     string
	StorageDir    string
	BaseURL       string
	Environment   string
}

func Load() (*Config, error) {
	_ = godotenv.Load() // ignore error if no .env file

	cfg := &Config{
		Port:          getEnv("PORT", "3000"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		RefreshSecret: getEnv("REFRESH_SECRET", os.Getenv("JWT_SECRET")),
		OTPMode:       getEnv("OTP_MODE", "mock"),
		OTPAPIKey:     os.Getenv("OTP_API_KEY"),
		StorageDir:    getEnv("STORAGE_DIR", "./storage"),
		BaseURL:       getEnv("BASE_URL", "http://localhost:3000"),
		Environment:   getEnv("ENVIRONMENT", "development"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
