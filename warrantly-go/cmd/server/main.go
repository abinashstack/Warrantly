package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/abinashstack/warrantly-go/internal/config"
	"github.com/abinashstack/warrantly-go/internal/database"
	"github.com/abinashstack/warrantly-go/internal/handler"
	"github.com/abinashstack/warrantly-go/internal/router"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Connected to database")

	// Initialize OTP service
	otpService := auth.NewOTPService(pool, cfg.OTPMode, cfg.OTPAPIKey)

	// Initialize handlers
	handlers := handler.NewHandlers(pool, otpService, cfg.JWTSecret, cfg.RefreshSecret, cfg.BaseURL)

	// Auth middleware
	authMW := auth.Middleware(cfg.JWTSecret)

	// Build router
	r := router.New(handlers, authMW)

	// Create storage directory
	os.MkdirAll(cfg.StorageDir, 0755)

	// Start server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Backend running on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(shutdownCtx)
}
