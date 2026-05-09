package handler

import (
	"encoding/json"
	"net/http"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthHandler struct {
	pool          *pgxpool.Pool
	otpService    *auth.OTPService
	jwtSecret     string
	refreshSecret string
}

func (h *AuthHandler) SendOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Phone == "" {
		respondError(w, http.StatusBadRequest, "phone is required")
		return
	}

	if err := h.otpService.SendOTP(r.Context(), req.Phone); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to send OTP")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "OTP sent"})
}

func (h *AuthHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone string `json:"phone"`
		Code  string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Phone == "" || req.Code == "" {
		respondError(w, http.StatusBadRequest, "phone and code are required")
		return
	}

	valid, err := h.otpService.VerifyOTP(r.Context(), req.Phone, req.Code)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "OTP verification failed")
		return
	}
	if !valid {
		respondError(w, http.StatusUnauthorized, "Invalid OTP")
		return
	}

	// Find or create profile
	var profileID string
	var roles []string

	err = h.pool.QueryRow(r.Context(),
		`SELECT profile_id, role FROM profile WHERE profile_id = (
			SELECT profile_id FROM customer WHERE phone_number = $1
			UNION
			SELECT profile_id FROM dealer_user WHERE phone_number = $1
			LIMIT 1
		)`, req.Phone,
	).Scan(&profileID, &roles)

	if err != nil {
		// No profile yet — create one
		err = h.pool.QueryRow(r.Context(),
			`INSERT INTO profile (role) VALUES ('{}') RETURNING profile_id`,
		).Scan(&profileID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create profile")
			return
		}
		roles = []string{}
	}

	tokenPair, err := auth.GenerateTokenPair(h.jwtSecret, h.refreshSecret, profileID, req.Phone, roles)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
		"expires_in":    tokenPair.ExpiresIn,
		"user": map[string]interface{}{
			"id":    profileID,
			"phone": req.Phone,
			"roles": roles,
		},
	})
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	profileID, err := auth.ValidateRefreshToken(h.refreshSecret, req.RefreshToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	var phone string
	var roles []string
	err = h.pool.QueryRow(r.Context(),
		`SELECT COALESCE(c.phone_number, du.phone_number, ''), COALESCE(p.role, '{}')
		 FROM profile p
		 LEFT JOIN customer c ON c.profile_id = p.profile_id
		 LEFT JOIN dealer_user du ON du.profile_id = p.profile_id
		 WHERE p.profile_id = $1`, profileID,
	).Scan(&phone, &roles)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Profile not found")
		return
	}

	tokenPair, err := auth.GenerateTokenPair(h.jwtSecret, h.refreshSecret, profileID, phone, roles)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, tokenPair)
}
