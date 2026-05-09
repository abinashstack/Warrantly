package handler

import (
	"encoding/json"
	"net/http"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DealerProductHandler struct {
	pool *pgxpool.Pool
}

func (h *DealerProductHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	rows, err := h.pool.Query(r.Context(),
		`SELECT dp.dealer_product_id, dp.product_id, p.product_name, b.brand_name
		 FROM dealer_product dp
		 JOIN product p ON p.product_id = dp.product_id
		 LEFT JOIN brands b ON b.brand_id = p.brand_id
		 JOIN dealer_user du ON du.dealer_id = dp.dealer_id
		 WHERE du.profile_id = $1`, userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch dealer products")
		return
	}
	defer rows.Close()

	var products []map[string]interface{}
	for rows.Next() {
		var dpID, productID, productName string
		var brandName *string
		if err := rows.Scan(&dpID, &productID, &productName, &brandName); err != nil {
			continue
		}
		products = append(products, map[string]interface{}{
			"dealer_product_id": dpID,
			"product_id":        productID,
			"product_name":      productName,
			"brand_name":        brandName,
		})
	}

	respondJSON(w, http.StatusOK, products)
}

func (h *DealerProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		ProductID string `json:"product_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Resolve dealer_id from profile
	var dealerID string
	err := h.pool.QueryRow(r.Context(),
		`SELECT dealer_id FROM dealer_user WHERE profile_id = $1`, userID,
	).Scan(&dealerID)
	if err != nil {
		respondError(w, http.StatusForbidden, "Dealer not found for user")
		return
	}

	var dpID string
	err = h.pool.QueryRow(r.Context(),
		`INSERT INTO dealer_product (dealer_id, product_id) VALUES ($1, $2) RETURNING dealer_product_id`,
		dealerID, req.ProductID,
	).Scan(&dpID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add dealer product")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "dealer_product_id": dpID})
}

type DealerModelHandler struct {
	pool *pgxpool.Pool
}

func (h *DealerModelHandler) List(w http.ResponseWriter, r *http.Request) {
	dpID := r.URL.Query().Get("dealer_product_id")
	if dpID == "" {
		respondError(w, http.StatusBadRequest, "dealer_product_id is required")
		return
	}

	rows, err := h.pool.Query(r.Context(),
		`SELECT dealer_product_model_id, model_name, model_number, mrp
		 FROM dealer_product_model WHERE dealer_product_id = $1`, dpID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch models")
		return
	}
	defer rows.Close()

	var models []map[string]interface{}
	for rows.Next() {
		var id, modelNumber string
		var modelName *string
		var mrp *float64
		if err := rows.Scan(&id, &modelName, &modelNumber, &mrp); err != nil {
			continue
		}
		models = append(models, map[string]interface{}{
			"dealer_product_model_id": id,
			"model_name":              modelName,
			"model_number":            modelNumber,
			"mrp":                     mrp,
		})
	}

	respondJSON(w, http.StatusOK, models)
}

func (h *DealerModelHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DealerProductID string  `json:"dealer_product_id"`
		ModelName       string  `json:"model_name"`
		ModelNumber     string  `json:"model_number"`
		MRP             float64 `json:"mrp"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var id string
	err := h.pool.QueryRow(r.Context(),
		`INSERT INTO dealer_product_model (dealer_product_id, model_name, model_number, mrp)
		 VALUES ($1, $2, $3, $4) RETURNING dealer_product_model_id`,
		req.DealerProductID, req.ModelName, req.ModelNumber, req.MRP,
	).Scan(&id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create model")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "dealer_product_model_id": id})
}
