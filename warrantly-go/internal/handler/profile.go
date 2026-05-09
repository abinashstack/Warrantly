package handler

import (
	"encoding/json"
	"net/http"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProfileHandler struct {
	pool *pgxpool.Pool
}

func (h *ProfileHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var profile struct {
		ProfileID              string   `json:"profile_id"`
		FirstName              *string  `json:"first_name"`
		LastName               *string  `json:"last_name"`
		EmailAddress           *string  `json:"email_address"`
		Address                *string  `json:"address"`
		ProfileImage           *string  `json:"profile_image"`
		Role                   []string `json:"role"`
		NotificationPreference *string  `json:"notification_preference"`
		Timezone               *string  `json:"timezone"`
	}

	err := h.pool.QueryRow(r.Context(),
		`SELECT profile_id, first_name, last_name, email_address, address, profile_image, role, notification_preference, timezone
		 FROM profile WHERE profile_id = $1`, userID,
	).Scan(&profile.ProfileID, &profile.FirstName, &profile.LastName, &profile.EmailAddress,
		&profile.Address, &profile.ProfileImage, &profile.Role, &profile.NotificationPreference, &profile.Timezone)

	if err != nil {
		respondError(w, http.StatusNotFound, "Profile not found")
		return
	}

	respondJSON(w, http.StatusOK, profile)
}

func (h *ProfileHandler) CreateOrUpdate(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	_, err := h.pool.Exec(r.Context(),
		`INSERT INTO profile (profile_id, first_name, last_name, email_address, address, role)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (profile_id) DO UPDATE SET
		   first_name = COALESCE(EXCLUDED.first_name, profile.first_name),
		   last_name = COALESCE(EXCLUDED.last_name, profile.last_name),
		   email_address = COALESCE(EXCLUDED.email_address, profile.email_address),
		   address = COALESCE(EXCLUDED.address, profile.address)`,
		userID, req["first_name"], req["last_name"], req["email_address"], req["address"], req["role"],
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save profile")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true})
}
