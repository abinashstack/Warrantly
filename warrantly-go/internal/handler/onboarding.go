package handler

import (
	"encoding/json"
	"net/http"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OnboardingHandler struct {
	pool *pgxpool.Pool
}

func (h *OnboardingHandler) OnboardUser(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Phone     string `json:"phone"`
		Role      string `json:"role"` // "consumer" or "dealer-owner"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer tx.Rollback(r.Context())

	// Upsert profile
	_, err = tx.Exec(r.Context(),
		`INSERT INTO profile (profile_id, first_name, last_name, role)
		 VALUES ($1, $2, $3, ARRAY[$4]::text[])
		 ON CONFLICT (profile_id) DO UPDATE SET
		   first_name = $2, last_name = $3, role = ARRAY[$4]::text[]`,
		userID, req.FirstName, req.LastName, req.Role,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create profile")
		return
	}

	// Create customer record if consumer role
	if req.Role == "consumer" {
		_, err = tx.Exec(r.Context(),
			`INSERT INTO customer (profile_id, phone_number, created_by)
			 VALUES ($1, $2, $1)
			 ON CONFLICT DO NOTHING`,
			userID, req.Phone,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to create customer")
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to commit")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":    true,
		"profile_id": userID,
	})
}

func (h *OnboardingHandler) OnboardDealer(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		DealerName    string `json:"dealer_name"`
		DealerAddress string `json:"dealer_address"`
		Phone         string `json:"phone"`
		GSTNumber     string `json:"gst_number"`
		FirstName     string `json:"first_name"`
		LastName      string `json:"last_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	tx, err := h.pool.Begin(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer tx.Rollback(r.Context())

	// Upsert profile with dealer-owner role
	_, err = tx.Exec(r.Context(),
		`INSERT INTO profile (profile_id, first_name, last_name, role)
		 VALUES ($1, $2, $3, ARRAY['dealer-owner']::text[])
		 ON CONFLICT (profile_id) DO UPDATE SET
		   first_name = $2, last_name = $3, role = ARRAY['dealer-owner']::text[]`,
		userID, req.FirstName, req.LastName,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create profile")
		return
	}

	// Create dealer
	var dealerID string
	err = tx.QueryRow(r.Context(),
		`INSERT INTO dealer (dealer_name, dealer_address, phone_number, gst_number, created_by)
		 VALUES ($1, $2, $3, $4, $5) RETURNING dealer_id`,
		req.DealerName, req.DealerAddress, req.Phone, req.GSTNumber, userID,
	).Scan(&dealerID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create dealer")
		return
	}

	// Create dealer_user link
	_, err = tx.Exec(r.Context(),
		`INSERT INTO dealer_user (dealer_id, profile_id, phone_number, role)
		 VALUES ($1, $2, $3, 'OWNER')`,
		dealerID, userID, req.Phone,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create dealer user")
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to commit")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":   true,
		"dealer_id": dealerID,
	})
}
