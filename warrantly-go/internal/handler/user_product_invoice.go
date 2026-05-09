package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/abinashstack/warrantly-go/internal/auth"
	invoicepdf "github.com/abinashstack/warrantly-go/internal/pdf"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgconn"
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
		`SELECT user_product_id, user_product_name, warranty_start_date::text, warranty_end_date::text,
		        extended_warranty_end_date::text, is_warranty_activated
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

	if products == nil {
		products = []map[string]interface{}{}
	}

	respondJSON(w, http.StatusOK, products)
}

func (h *UserProductHandler) GetDetails(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var result struct {
		UserProductID   string  `json:"user_product_id"`
		ProductID       *string `json:"product_id"`
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
		ProductID         *string `json:"product_id"`
		OwnerID           string  `json:"owner_id"`
		UserProductName   string  `json:"user_product_name"`
		SerialNumber      string  `json:"serial_number"`
		WarrantyStartDate string  `json:"warranty_start_date"`
		WarrantyEndDate   string  `json:"warranty_end_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Auto-resolve owner_id from logged-in user's customer record if not provided
	if req.OwnerID == "" {
		var customerID string
		err := h.pool.QueryRow(r.Context(),
			`SELECT customer_id FROM customer WHERE profile_id = $1`, userID,
		).Scan(&customerID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "Customer profile not found")
			return
		}
		req.OwnerID = customerID
	}

	// Convert empty date strings to nil for proper NULL handling
	var startDate, endDate interface{}
	if req.WarrantyStartDate != "" {
		startDate = req.WarrantyStartDate
	}
	if req.WarrantyEndDate != "" {
		endDate = req.WarrantyEndDate
	}

	var id string
	err := h.pool.QueryRow(r.Context(),
		`INSERT INTO user_products (product_id, owner_id, user_product_name, serial_number, warranty_start_date, warranty_end_date, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_product_id`,
		req.ProductID, req.OwnerID, req.UserProductName, req.SerialNumber, startDate, endDate, userID,
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

	// Validate price: must be non-negative and within NUMERIC(12,2) range
	if req.SalePrice < 0 {
		respondError(w, http.StatusBadRequest, "sale_price cannot be negative")
		return
	}
	if req.SalePrice > 9999999999.99 {
		respondError(w, http.StatusBadRequest, "sale_price exceeds maximum allowed value")
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
		if isFKViolation(err) {
			respondError(w, http.StatusBadRequest, "Invalid user_product_id")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create invoice")
		return
	}

	// Generate PDF
	invoiceURL := ""
	pdfBytes, pdfErr := invoicepdf.GenerateInvoicePDF(invoicepdf.InvoicePDFData{
		InvoiceNumber:   invoiceNumber,
		DealerName:      req.DealerName,
		DealerAddress:   req.DealerAddress,
		DealerGSTIN:     req.DealerGSTIN,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		ProductName:     req.ProductName,
		ModelNumber:     req.ModelNumber,
		SerialNumber:    req.SerialNumber,
		TaxableAmount:   gst.TaxableAmount,
		GSTPercentage:   gst.GSTPercentage,
		CGSTAmount:      gst.CGSTAmount,
		SGSTAmount:      gst.SGSTAmount,
		TotalAmount:     req.SalePrice,
	})
	if pdfErr == nil {
		_ = os.MkdirAll("./storage/invoices", 0755)
		pdfPath := fmt.Sprintf("./storage/invoices/%s.pdf", invoiceID)
		if writeErr := os.WriteFile(pdfPath, pdfBytes, 0644); writeErr == nil {
			invoiceURL = fmt.Sprintf("%s/storage/invoices/%s.pdf", h.baseURL, invoiceID)
			h.pool.Exec(r.Context(), `UPDATE invoices SET invoice_url = $1 WHERE invoice_id = $2`, invoiceURL, invoiceID)
		}
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":        true,
		"invoice_id":     invoiceID,
		"invoice_number": invoiceNumber,
		"invoice_url":    invoiceURL,
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

	if invoices == nil {
		invoices = []map[string]interface{}{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "invoices": invoices})
}

// Upload handler (full dealer sale flow)
type UploadHandler struct {
	pool    *pgxpool.Pool
	baseURL string
}

func (h *UploadHandler) DealerSaleFlow(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req struct {
		OwnerID              string  `json:"owner_id"`
		CustomerName         string  `json:"customer_name"`
		CustomerPhone        string  `json:"customer_phone"`
		CustomerAddress      string  `json:"customer_address"`
		DealerProductID      string  `json:"dealer_product_id"`
		DealerProductModelID string  `json:"dealer_product_model_id"`
		SerialNumber         string  `json:"serial_number"`
		PurchaseDate         string  `json:"purchase_date"`
		BasePrice            float64 `json:"base_price"`
		ProductName          string  `json:"product_name"`
		ModelNumber          string  `json:"model_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate price
	if req.BasePrice < 0 {
		respondError(w, http.StatusBadRequest, "base_price cannot be negative")
		return
	}
	if req.BasePrice > 9999999999.99 {
		respondError(w, http.StatusBadRequest, "base_price exceeds maximum allowed value")
		return
	}

	// 1. Resolve dealer
	var dealerID, dealerName, dealerAddress, dealerGSTIN string
	err := h.pool.QueryRow(r.Context(),
		`SELECT d.dealer_id, d.dealer_name, COALESCE(d.dealer_address,''), COALESCE(d.gst_number,'')
		 FROM dealer d
		 JOIN dealer_user du ON du.dealer_id = d.dealer_id
		 WHERE du.profile_id = $1`, userID,
	).Scan(&dealerID, &dealerName, &dealerAddress, &dealerGSTIN)
	if err != nil {
		respondError(w, http.StatusForbidden, "Dealer not found")
		return
	}

	// 2. Resolve product from dealer_product
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

	// Use provided product name if available
	if req.ProductName != "" {
		productName = req.ProductName
	}

	// 3. Find warranty duration
	var warrantyDuration int
	err = h.pool.QueryRow(r.Context(),
		`SELECT base_warranty_duration FROM warranties
		 WHERE brand_id = $1 AND item_id = $2 AND warranty_type = 'product' LIMIT 1`,
		brandID, itemID,
	).Scan(&warrantyDuration)
	if err != nil {
		warrantyDuration = 12
	}

	// 4. Calculate warranty dates
	startDate, _ := time.Parse("2006-01-02", req.PurchaseDate)
	endDate := startDate.AddDate(0, warrantyDuration, -1)

	// 5. Create user product
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

	// 6. Calculate GST and create invoice
	gst := calculateGST(req.BasePrice)
	invoiceNumber := generateInvoiceNumber()

	var invoiceID string
	err = h.pool.QueryRow(r.Context(),
		`INSERT INTO invoices (user_product_id, invoice_number, invoice_date, dealer_id, dealer_name, dealer_address, dealer_gstin,
		   customer_name, customer_phone, customer_address, product_name, model_number, serial_number,
		   taxable_amount, gst_percentage, cgst_amount, sgst_amount, igst_amount, total_amount, currency, source_type, is_verified, verification_method)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 0, $18, 'INR', 'DEALER', true, 'SYSTEM')
		 RETURNING invoice_id`,
		userProductID, invoiceNumber, req.PurchaseDate, dealerID, dealerName, dealerAddress, dealerGSTIN,
		req.CustomerName, req.CustomerPhone, req.CustomerAddress, productName, req.ModelNumber, req.SerialNumber,
		gst.TaxableAmount, gst.GSTPercentage, gst.CGSTAmount, gst.SGSTAmount, req.BasePrice,
	).Scan(&invoiceID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create invoice")
		return
	}

	// 7. Generate PDF
	invoiceURL := ""
	pdfBytes, pdfErr := invoicepdf.GenerateInvoicePDF(invoicepdf.InvoicePDFData{
		InvoiceNumber:   invoiceNumber,
		InvoiceDate:     req.PurchaseDate,
		DealerName:      dealerName,
		DealerAddress:   dealerAddress,
		DealerGSTIN:     dealerGSTIN,
		CustomerName:    req.CustomerName,
		CustomerPhone:   req.CustomerPhone,
		CustomerAddress: req.CustomerAddress,
		ProductName:     productName,
		ModelNumber:     req.ModelNumber,
		SerialNumber:    req.SerialNumber,
		TaxableAmount:   gst.TaxableAmount,
		GSTPercentage:   gst.GSTPercentage,
		CGSTAmount:      gst.CGSTAmount,
		SGSTAmount:      gst.SGSTAmount,
		TotalAmount:     req.BasePrice,
		WarrantyEndDate: endDate.Format("2006-01-02"),
	})
	if pdfErr == nil {
		_ = os.MkdirAll("./storage/invoices", 0755)
		pdfPath := fmt.Sprintf("./storage/invoices/%s.pdf", invoiceID)
		if writeErr := os.WriteFile(pdfPath, pdfBytes, 0644); writeErr == nil {
			invoiceURL = fmt.Sprintf("%s/storage/invoices/%s.pdf", h.baseURL, invoiceID)
			h.pool.Exec(r.Context(), `UPDATE invoices SET invoice_url = $1 WHERE invoice_id = $2`, invoiceURL, invoiceID)
		}
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":         true,
		"user_product_id": userProductID,
		"invoice_id":      invoiceID,
		"invoice_number":  invoiceNumber,
		"invoice_url":     invoiceURL,
	})
}

func (h *UploadHandler) ConsumerUpload(w http.ResponseWriter, r *http.Request) {
	// Enforce 10MB body size limit at the reader level
	const maxUploadSize = 10 << 20 // 10MB
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	// Parse multipart form (max 10MB)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		respondError(w, http.StatusRequestEntityTooLarge, "File too large (max 10MB)")
		return
	}

	file, header, err := r.FormFile("invoiceImage")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Missing invoiceImage field")
		return
	}
	defer file.Close()

	// Save file to local storage
	_ = os.MkdirAll("./storage/invoices", 0755)
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), header.Filename)
	dst, err := os.Create(fmt.Sprintf("./storage/invoices/%s", filename))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

	imageURL := fmt.Sprintf("%s/storage/invoices/%s", h.baseURL, filename)

	// Return preview structure (no OCR — user fills in details)
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"product_preview": map[string]interface{}{
			"product_name": "",
			"product_id":   nil,
			"item_url":     imageURL,
		},
		"invoice_preview": map[string]interface{}{
			"total_amount":  "",
			"invoice_date":  time.Now().Format("2006-01-02"),
		},
		"warranty_preview": map[string]interface{}{
			"warranty_end_date": time.Now().AddDate(1, 0, 0).Format("2006-01-02"),
		},
	})
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

func isFKViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}

func isNumericOverflow(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && strings.Contains(pgErr.Message, "numeric field overflow")
}
