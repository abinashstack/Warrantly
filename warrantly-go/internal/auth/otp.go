package auth

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type OTPService struct {
	pool    *pgxpool.Pool
	mode    string // "mock" or "msg91"
	apiKey  string
}

func NewOTPService(pool *pgxpool.Pool, mode, apiKey string) *OTPService {
	return &OTPService{pool: pool, mode: mode, apiKey: apiKey}
}

func (s *OTPService) SendOTP(ctx context.Context, phone string) error {
	code := s.generateCode()

	expiresAt := time.Now().Add(5 * time.Minute)

	_, err := s.pool.Exec(ctx,
		`INSERT INTO otp_codes (phone_number, code, expires_at) VALUES ($1, $2, $3)`,
		phone, code, expiresAt,
	)
	if err != nil {
		return fmt.Errorf("store OTP: %w", err)
	}

	if s.mode == "mock" {
		fmt.Printf("[OTP-MOCK] Code for %s: %s\n", phone, code)
		return nil
	}

	// TODO: integrate MSG91/Twilio for production
	return nil
}

func (s *OTPService) VerifyOTP(ctx context.Context, phone, code string) (bool, error) {
	if s.mode == "mock" && code == "123456" {
		return true, nil
	}

	var id string
	err := s.pool.QueryRow(ctx,
		`SELECT id FROM otp_codes
		 WHERE phone_number = $1 AND code = $2 AND expires_at > NOW() AND verified = false
		 ORDER BY created_at DESC LIMIT 1`,
		phone, code,
	).Scan(&id)

	if err != nil {
		return false, nil
	}

	_, err = s.pool.Exec(ctx,
		`UPDATE otp_codes SET verified = true WHERE id = $1`, id,
	)
	if err != nil {
		return false, fmt.Errorf("mark OTP verified: %w", err)
	}

	return true, nil
}

func (s *OTPService) generateCode() string {
	if s.mode == "mock" {
		return "123456"
	}
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	return fmt.Sprintf("%06d", n.Int64()+100000)
}
