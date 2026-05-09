package handler

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserProductHandler struct {
	pool *pgxpool.Pool
}

func (h *UserProductHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	// Get customer_id from profile
	var customerID string
	err := h.pool.QueryRow(r.Context(),
		`SELECT customer_id FROM customer WHERE profile_id = $1`, userID,
	).Scan(&customerID)
	if err != nil {
		respondJSON(w, http.StatusOK, []interface{}{})
		return
	}

	rows, err := h.pool.Query(r.Context(),
		`SELECT user_product_id, user_product_name, warranty_start_date, warranty_end_date,
		        extended_warranty_end_date, is_warranty_activated
		 FROM user_products WHERE owner_id = $1 ORDER BY created_at DESC`, customerID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}
	defer rows.Close()

	var products []map[string]interface{}
	for rows.Next() {
		var id, name string
		var startDate, endDate, extEndDate *string
		var activated bool
		if err := rows.Scan(&id, &name, &startDate, &endDate, &extEndDate, &activated); err != nil {
			continue
		}
		products = append(products, map[string]interface{}{
			"user_product_id":           id,
			"user_product_name":         name,
			"warranty_start_date":       startDate,
			"warranty_end_date":         endDate,
			"extended_warranty_end_date": extEndDate,
			"is_warranty_activated":      activated,
		})
	}

	respondJSON(w, http.StatusOK, products)
}

func (h *UserProductHandler) GetDetails(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var result struct {
		UserProductID   string  `json:"user_product_id"`
		ProductID       string  `json:"product_id"`
		UserProductName string  `json:"user_product_name"`
		SerialNumber    *string `json:"serial_number"`
		WarrantyStart   *string `json:"warranty_start_date"`
		WarrantyEnd     *string `json:"warranty_end_date"`
		ProductName     *string `json:"product_name"`
		BrandName       *string `json:"brand_name"`
		ItemName        *string `json:"item_name"`
	}

	err := h.pool.QueryRow(r.Context(),
		`SELECT up.user_product_id, up.product_id, up.user_product_name, up.serial_number,
		        up.warranty_start_date::text, up.warranty_end_date::text,
		        p.product_name, b.brand_name, i.item_name
		 FROM user_products up
		 LEFT JOIN product p ON p.product_id = up.product_id
		 LEFT JOIN brands b ON b.brand_id = p.brand_id
		 LEFT JOIN items i ON i.item_id = p.item_id
		 WHERE up.user_product_id = $1`, id,
	).Scan(&result.UserProductID, &result.ProductID, &result.UserProductName, &result.SerialNumber,
		&result.WarrantyStart, &result.WarrantyEnd, &result.ProductName, &result.BrandName, &result.ItemName)

	if err != nil {
		respondError(w, http.StatusNotFound, "Product not found")
		return
	}

	respondJSON(w, http.StatusOK, result)
}

func (h *UserProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		ProductID         string `json:"product_id"`
		OwnerID           string `json:"owner_id"`
		UserProductName   string `json:"user_product_name"`
		SerialNumber      string `json:"serial_number"`
		WarrantyStartDate string `json:"warranty_start_date"`
		WarrantyEndDate   string `json:"warranty_end_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var id string
	err := h.pool.QueryRow(r.Context(),
		`INSERT INTO user_products (product_id, owner_id, user_product_name, serial_number, warranty_start_date, warranty_end_date, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_product_id`,
		req.ProductID, req.OwnerID, req.UserProductName, req.SerialNumber, req.WarrantyStartDate, req.WarrantyEndDate, userID,
	).Scan(&id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create product")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{"success": true, "user_product_id": id})
}

func (h *UserProductHandler) DealerUpload(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		OwnerID              string `json:"owner_id"`
		DealerProductID      string `json:"dealer_product_id"`
		DealerProductModelID string `json:"dealer_product_model_id"`
		PurchaseDate         string `json:"purchase_date"`
		PurchasePrice        float64 `json:"purchase_price"`
		SerialNumber         string `json:"serial_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Resolve dealer
	var dealerID string
	err := h.pool.QueryRow(r.Context(),
		`SELECT dealer_id FROM dealer_user WHERE profile_id = $1`, userID,
	).Scan(&dealerID)
	if err != nil {
		respondError(w, http.StatusForbidden, "Dealer not found")
		return
	}

	// Resolve product from dealer_product
	var productID, productName string
	var brandID, itemID string
	err = h.pool.QueryRow(r.Context(),
		`SELECT dp.product_id, p.product_name, p.brand_id, p.item_id
		 FROM dealer_product dp
		 JOIN product p ON p.product_id = dp.product_id
		 WHERE dp.dealer_product_id = $1 AND dp.dealer_id = $2`,
		req.DealerProductID, dealerID,
	).Scan(&productID, &productName, &brandID, &itemID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid dealer product")
		return
	}

	// Find warranty config
	var warrantyDuration int
	err = h.pool.QueryRow(r.Context(),
		`SELECT base_warranty_duration FROM warranties
		 WHERE brand_id = $1 AND item_id = $2 AND warranty_type = 'product' LIMIT 1`,
		brandID, itemID,
	).Scan(&warrantyDuration)
	if err != nil {
		warrantyDuration = 12 // default 1 year
	}

	// Calculate warranty end
	startDate, _ := time.Parse("2006-01-02", req.PurchaseDate)
	endDate := startDate.AddDate(0, warrantyDuration, -1)

	// Create user product
	var userProductID string
	err = h.pool.QueryRow(r.Context(),
		`INSERT INTO user_products (product_id, owner_id, user_product_name, serial_number, warranty_start_date, warranty_end_date, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_product_id`,
		productID, req.OwnerID, productName, req.SerialNumber, req.PurchaseDate, endDate.Format("2006-01-02"), dealerID,
	).Scan(&userProductID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create user product")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":         true,
		"user_product_id": userProductID,
	})
}

// Invoice handler
type InvoiceHandler struct {
	pool    *pgxpool.Pool
	baseURL string
}

func (h *InvoiceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserProductID   string  `json:"user_product_id"`
		SalePrice       float64 `json:"sale_price"`
		CustomerName    string  `json:"customer_name"`
		CustomerPhone   string  `json:"customer_phone"`
		CustomerAddress string  `json:"customer_address"`
		DealerName      string  `json:"dealer_name"`
		DealerAddress   string  `json:"dealer_address"`
		DealerGSTIN     string  `json:"dealer_gstin"`
		ProductName     string  `json:"product_name"`
		ModelNumber     string  `json:"model_number"`
		SerialNumber    string  `json:"serial_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	gst := calculateGST(req.SalePrice)
	invoiceNumber := generateInvoiceNumber()

	var invoiceID string
	err := h.pool.QueryRow(r.Context(),
		`INSERT INTO invoices (user_product_id, invoice_number, invoice_date, dealer_name, dealer_address, dealer_gstin,
		   customer_name, customer_phone, customer_address, product_name, model_number, serial_number,
		   taxable_amount, gst_percentage, cgst_amount, sgst_amount, igst_amount, total_amount, currency, source_type, is_verified, verification_method)
		 VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, $16, 'INR', 'DEALER', true, 'SYSTEM')
		 RETURNING invoice_id`,
		req.UserProductID, invoiceNumber, req.DealerName, req.DealerAddress, req.DealerGSTIN,
		req.CustomerName, req.CustomerPhone, req.CustomerAddress, req.ProductName, req.ModelNumber, req.SerialNumber,
		gst.TaxableAmount, gst.GSTPercentage, gst.CGSTAmount, gst.SGSTAmount, req.SalePrice,
	).Scan(&invoiceID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create invoice")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":        true,
		"invoice_id":     invoiceID,
		"invoice_number": invoiceNumber,
	})
}

func (h *InvoiceHandler) Get(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoiceId")

	var invoice map[string]interface{}
	var invID, invNumber, invDate, dealerName, customerName, productName string
	var totalAmount float64
	var invoiceURL *string

	err := h.pool.QueryRow(r.Context(),
		`SELECT invoice_id, invoice_number, invoice_date::text, dealer_name, customer_name, product_name, total_amount, invoice_url
		 FROM invoices WHERE invoice_id = $1`, invoiceID,
	).Scan(&invID, &invNumber, &invDate, &dealerName, &customerName, &productName, &totalAmount, &invoiceURL)

	if err != nil {
		respondError(w, http.StatusNotFound, "Invoice not found")
		return
	}

	invoice = map[string]interface{}{
		"invoice_id":     invID,
		"invoice_number": invNumber,
		"invoice_date":   invDate,
		"dealer_name":    dealerName,
		"customer_name":  customerName,
		"product_name":   productName,
		"total_amount":   totalAmount,
		"invoice_url":    invoiceURL,
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "invoice": invoice})
}

func (h *InvoiceHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	// Resolve dealer
	var dealerID string
	err := h.pool.QueryRow(r.Context(),
		`SELECT dealer_id FROM dealer_user WHERE profile_id = $1`, userID,
	).Scan(&dealerID)
	if err != nil {
		respondError(w, http.StatusForbidden, "Unauthorized")
		return
	}

	rows, err := h.pool.Query(r.Context(),
		`SELECT invoice_id, invoice_number, invoice_date::text, customer_name, product_name, total_amount, invoice_url, created_at::text
		 FROM invoices WHERE dealer_id = $1 ORDER BY invoice_date DESC`, dealerID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch invoices")
		return
	}
	defer rows.Close()

	var invoices []map[string]interface{}
	for rows.Next() {
		var id, number, date, custName, prodName, createdAt string
		var amount float64
		var url *string
		if err := rows.Scan(&id, &number, &date, &custName, &prodName, &amount, &url, &createdAt); err != nil {
			continue
		}
		invoices = append(invoices, map[string]interface{}{
			"invoice_id":     id,
			"invoice_number": number,
			"invoice_date":   date,
			"customer_name":  custName,
			"product_name":   prodName,
			"total_amount":   amount,
			"invoice_url":    url,
			"created_at":     createdAt,
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "invoices": invoices})
}

// Upload handler (full dealer sale flow)
type UploadHandler struct {
	pool    *pgxpool.Pool
	baseURL string
}

func (h *UploadHandler) DealerSaleFlow(w http.ResponseWriter, r *http.Request) {
	// This is the full orchestration endpoint — delegates to the invoice Create internally
	// For now, redirect to the upload/dealer logic in user_product DealerUpload + invoice Create
	respondError(w, http.StatusNotImplemented, "Use POST /api/upload/dealer via the combined flow")
}

// Business logic helpers
type gstResult struct {
	TaxableAmount float64
	GSTPercentage float64
	CGSTAmount    float64
	SGSTAmount    float64
}

func calculateGST(baseAmount float64) gstResult {
	gstPercent := 18.0
	gstAmount := baseAmount * (gstPercent / 100)
	half := math.Round(gstAmount/2*100) / 100
	return gstResult{
		TaxableAmount: math.Round(baseAmount*100) / 100,
		GSTPercentage: gstPercent,
		CGSTAmount:    half,
		SGSTAmount:    half,
	}
}

func generateInvoiceNumber() string {
	year := time.Now().Year()
	num := rand.Intn(9000) + 1000
	return fmt.Sprintf("WAR-INV-%d-%04d", year, num)
}
