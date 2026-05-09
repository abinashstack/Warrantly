package handler

import (
	"encoding/json"
	"net/http"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CustomerHandler struct {
	pool *pgxpool.Pool
}

func (h *CustomerHandler) FindByPhone(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		respondError(w, http.StatusBadRequest, "phone is required")
		return
	}

	var customer struct {
		CustomerID  string `json:"customer_id"`
		ProfileID   *string `json:"profile_id"`
		PhoneNumber string `json:"phone_number"`
		IsActive    bool   `json:"is_active"`
	}

	err := h.pool.QueryRow(r.Context(),
		`SELECT customer_id, profile_id, phone_number, is_active FROM customer WHERE phone_number = $1`,
		phone,
	).Scan(&customer.CustomerID, &customer.ProfileID, &customer.PhoneNumber, &customer.IsActive)

	if err != nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{"found": false})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"found": true, "customer": customer})
}

func (h *CustomerHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var customerID string
	err := h.pool.QueryRow(r.Context(),
		`INSERT INTO customer (phone_number, created_by) VALUES ($1, $2) RETURNING customer_id`,
		req.Phone, userID,
	).Scan(&customerID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create customer")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "customer_id": customerID})
}

type DealerHandler struct {
	pool *pgxpool.Pool
}

func (h *DealerHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		DealerName    string `json:"dealer_name"`
		DealerAddress string `json:"dealer_address"`
		Phone         string `json:"phone"`
		GSTNumber     string `json:"gst_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var dealerID string
	err := h.pool.QueryRow(r.Context(),
		`INSERT INTO dealer (dealer_name, dealer_address, phone_number, gst_number, created_by)
		 VALUES ($1, $2, $3, $4, $5) RETURNING dealer_id`,
		req.DealerName, req.DealerAddress, req.Phone, req.GSTNumber, userID,
	).Scan(&dealerID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create dealer")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "dealer_id": dealerID})
}

type DealerUserHandler struct {
	pool *pgxpool.Pool
}

func (h *DealerUserHandler) CheckByPhone(w http.ResponseWriter, r *http.Request) {
	phone := r.URL.Query().Get("phone")
	if phone == "" {
		respondError(w, http.StatusBadRequest, "phone is required")
		return
	}

	var dealerUser struct {
		DealerUserID string `json:"dealer_user_id"`
		DealerID     string `json:"dealer_id"`
		Role         string `json:"role"`
	}

	err := h.pool.QueryRow(r.Context(),
		`SELECT dealer_user_id, dealer_id, role FROM dealer_user WHERE phone_number = $1`,
		phone,
	).Scan(&dealerUser.DealerUserID, &dealerUser.DealerID, &dealerUser.Role)

	if err != nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{"found": false})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"found": true, "dealer_user": dealerUser})
}
