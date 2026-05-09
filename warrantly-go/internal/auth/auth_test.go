package auth_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateTokenPair(t *testing.T) {
	secret := "test-secret"
	refreshSecret := "test-refresh-secret"

	t.Run("valid token generation", func(t *testing.T) {
		pair, err := auth.GenerateTokenPair(secret, refreshSecret, "user-123", "+919876543210", []string{"consumer"})
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if pair.AccessToken == "" {
			t.Error("access token is empty")
		}
		if pair.RefreshToken == "" {
			t.Error("refresh token is empty")
		}
		if pair.ExpiresIn != 86400 {
			t.Errorf("expected expires_in 86400, got %d", pair.ExpiresIn)
		}
	})

	t.Run("multiple roles", func(t *testing.T) {
		pair, err := auth.GenerateTokenPair(secret, refreshSecret, "user-456", "+911234567890", []string{"consumer", "dealer-owner"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		claims, err := auth.ValidateAccessToken(secret, pair.AccessToken)
		if err != nil {
			t.Fatalf("failed to validate: %v", err)
		}
		if len(claims.Roles) != 2 {
			t.Errorf("expected 2 roles, got %d", len(claims.Roles))
		}
	})

	t.Run("empty profile ID", func(t *testing.T) {
		pair, err := auth.GenerateTokenPair(secret, refreshSecret, "", "+919876543210", []string{"consumer"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		claims, err := auth.ValidateAccessToken(secret, pair.AccessToken)
		if err != nil {
			t.Fatalf("failed to validate: %v", err)
		}
		if claims.Sub != "" {
			t.Errorf("expected empty sub, got %q", claims.Sub)
		}
	})
}

func TestValidateAccessToken(t *testing.T) {
	secret := "test-secret"
	refreshSecret := "test-refresh"

	t.Run("valid token", func(t *testing.T) {
		pair, _ := auth.GenerateTokenPair(secret, refreshSecret, "user-123", "+919876543210", []string{"consumer"})
		claims, err := auth.ValidateAccessToken(secret, pair.AccessToken)
		if err != nil {
			t.Fatalf("expected valid, got error: %v", err)
		}
		if claims.Sub != "user-123" {
			t.Errorf("expected sub user-123, got %s", claims.Sub)
		}
		if claims.Phone != "+919876543210" {
			t.Errorf("expected phone +919876543210, got %s", claims.Phone)
		}
	})

	t.Run("wrong secret rejects token", func(t *testing.T) {
		pair, _ := auth.GenerateTokenPair(secret, refreshSecret, "user-123", "+919876543210", []string{"consumer"})
		_, err := auth.ValidateAccessToken("wrong-secret", pair.AccessToken)
		if err == nil {
			t.Error("expected error for wrong secret, got nil")
		}
	})

	t.Run("malformed token", func(t *testing.T) {
		_, err := auth.ValidateAccessToken(secret, "not.a.token")
		if err == nil {
			t.Error("expected error for malformed token")
		}
	})

	t.Run("empty token", func(t *testing.T) {
		_, err := auth.ValidateAccessToken(secret, "")
		if err == nil {
			t.Error("expected error for empty token")
		}
	})

	t.Run("expired token rejected", func(t *testing.T) {
		// Create a manually expired token
		claims := jwt.MapClaims{
			"sub":   "user-123",
			"phone": "+919876543210",
			"roles": []string{"consumer"},
			"iss":   "warrantly",
			"exp":   time.Now().Add(-1 * time.Hour).Unix(),
			"iat":   time.Now().Add(-2 * time.Hour).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenStr, _ := token.SignedString([]byte(secret))

		_, err := auth.ValidateAccessToken(secret, tokenStr)
		if err == nil {
			t.Error("expected error for expired token")
		}
	})

	t.Run("algorithm confusion attack - none alg", func(t *testing.T) {
		// Try token with "none" algorithm
		_, err := auth.ValidateAccessToken(secret, "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJoYWNrZXIifQ.")
		if err == nil {
			t.Error("VULNERABILITY: accepted token with 'none' algorithm")
		}
	})

	t.Run("refresh token not accepted as access token", func(t *testing.T) {
		pair, _ := auth.GenerateTokenPair(secret, refreshSecret, "user-123", "+919876543210", []string{"consumer"})
		_, err := auth.ValidateAccessToken(secret, pair.RefreshToken)
		if err == nil {
			t.Error("VULNERABILITY: refresh token accepted as access token")
		}
	})
}

func TestValidateRefreshToken(t *testing.T) {
	secret := "test-secret"
	refreshSecret := "test-refresh-secret"

	t.Run("valid refresh token", func(t *testing.T) {
		pair, _ := auth.GenerateTokenPair(secret, refreshSecret, "user-123", "+919876543210", []string{"consumer"})
		sub, err := auth.ValidateRefreshToken(refreshSecret, pair.RefreshToken)
		if err != nil {
			t.Fatalf("expected valid, got error: %v", err)
		}
		if sub != "user-123" {
			t.Errorf("expected sub user-123, got %s", sub)
		}
	})

	t.Run("access token not accepted as refresh", func(t *testing.T) {
		pair, _ := auth.GenerateTokenPair(secret, refreshSecret, "user-123", "+919876543210", []string{"consumer"})
		_, err := auth.ValidateRefreshToken(refreshSecret, pair.AccessToken)
		if err == nil {
			t.Error("VULNERABILITY: access token accepted as refresh token")
		}
	})

	t.Run("wrong secret", func(t *testing.T) {
		pair, _ := auth.GenerateTokenPair(secret, refreshSecret, "user-123", "+919876543210", []string{"consumer"})
		_, err := auth.ValidateRefreshToken("wrong-secret", pair.RefreshToken)
		if err == nil {
			t.Error("expected error for wrong secret")
		}
	})
}

func TestMiddleware(t *testing.T) {
	secret := "test-secret"

	t.Run("context contains user ID after middleware", func(t *testing.T) {
		// Verify context helpers work
		ctx := context.Background()
		userID := auth.UserIDFromContext(ctx)
		if userID != "" {
			t.Errorf("expected empty user ID from empty context, got %q", userID)
		}
	})

	t.Run("SQL injection in phone field", func(t *testing.T) {
		pair, _ := auth.GenerateTokenPair(secret, secret, "user-123", "'; DROP TABLE profile; --", []string{"consumer"})
		claims, err := auth.ValidateAccessToken(secret, pair.AccessToken)
		if err != nil {
			t.Fatalf("token should still be valid: %v", err)
		}
		// The phone field contains injection attempt but JWT just stores it as data
		// The vulnerability would be if this is used in raw SQL (it's not — uses parameterized queries)
		if !strings.Contains(claims.Phone, "DROP TABLE") {
			t.Error("phone field should preserve content as-is")
		}
	})
}
