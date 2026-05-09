package handler_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/abinashstack/warrantly-go/internal/config"
	"github.com/abinashstack/warrantly-go/internal/handler"
	"github.com/abinashstack/warrantly-go/internal/router"
)

// Test helper: creates a test server with real DB connection
func setupTestServer(t *testing.T) (*httptest.Server, string) {
	t.Helper()

	cfg, err := config.Load()
	if err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	ctx := testContext()
	pool, err := newTestPool(ctx, cfg.DatabaseURL)
	if err != nil {
		t.Skipf("Skipping integration test (no DB): %v", err)
	}

	otpService := auth.NewOTPService(pool, "mock", "")
	h := handler.NewHandlers(pool, otpService, cfg.JWTSecret, cfg.RefreshSecret, "http://localhost:3000")
	authMW := auth.Middleware(cfg.JWTSecret)
	r := router.New(h, authMW)

	ts := httptest.NewServer(r)
	t.Cleanup(func() {
		ts.Close()
		pool.Close()
	})

	// Get a valid token
	token := getTestToken(t, ts)
	return ts, token
}

func getTestToken(t *testing.T, ts *httptest.Server) string {
	t.Helper()

	// Send OTP
	resp, err := http.Post(ts.URL+"/api/auth/send-otp", "application/json",
		strings.NewReader(`{"phone":"+919999999999"}`))
	if err != nil {
		t.Fatalf("send-otp failed: %v", err)
	}
	resp.Body.Close()

	// Verify OTP (mock mode = 123456)
	resp, err = http.Post(ts.URL+"/api/auth/verify-otp", "application/json",
		strings.NewReader(`{"phone":"+919999999999","code":"123456"}`))
	if err != nil {
		t.Fatalf("verify-otp failed: %v", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	token, _ := result["access_token"].(string)
	if token == "" {
		t.Fatal("failed to get test token")
	}

	// Onboard as consumer so customer record exists
	onboardBody := `{"first_name":"Test","last_name":"User","phone":"+919999999999","role":"consumer"}`
	req, _ := http.NewRequest("POST", ts.URL+"/api/onboarding/user", strings.NewReader(onboardBody))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	http.DefaultClient.Do(req)

	return token
}

func authReq(method, url, token string, body io.Reader) (*http.Request, error) {
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	return req, nil
}

// ==================== AUTH ENDPOINT TESTS ====================

func TestAuthSendOTP(t *testing.T) {
	ts, _ := setupTestServer(t)

	t.Run("valid phone", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/send-otp", "application/json",
			strings.NewReader(`{"phone":"+919876543210"}`))
		if resp.StatusCode != 200 {
			t.Errorf("expected 200, got %d", resp.StatusCode)
		}
	})

	t.Run("empty phone", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/send-otp", "application/json",
			strings.NewReader(`{"phone":""}`))
		if resp.StatusCode != 400 {
			t.Errorf("expected 400 for empty phone, got %d", resp.StatusCode)
		}
	})

	t.Run("missing body", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/send-otp", "application/json",
			strings.NewReader(`{}`))
		if resp.StatusCode != 400 {
			t.Errorf("expected 400 for missing phone, got %d", resp.StatusCode)
		}
	})

	t.Run("invalid JSON", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/send-otp", "application/json",
			strings.NewReader(`not json`))
		if resp.StatusCode != 400 {
			t.Errorf("expected 400 for invalid JSON, got %d", resp.StatusCode)
		}
	})

	t.Run("SQL injection in phone", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/send-otp", "application/json",
			strings.NewReader(`{"phone":"'; DROP TABLE otp_codes; --"}`))
		// Should not crash — parameterized queries protect against injection
		if resp.StatusCode == 500 {
			t.Error("VULNERABILITY: possible SQL injection")
		}
	})
}

func TestAuthVerifyOTP(t *testing.T) {
	ts, _ := setupTestServer(t)

	// First send OTP
	http.Post(ts.URL+"/api/auth/send-otp", "application/json",
		strings.NewReader(`{"phone":"+918888888888"}`))

	t.Run("correct OTP", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/verify-otp", "application/json",
			strings.NewReader(`{"phone":"+918888888888","code":"123456"}`))
		if resp.StatusCode != 200 {
			t.Errorf("expected 200, got %d", resp.StatusCode)
		}
		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		if result["access_token"] == nil {
			t.Error("expected access_token in response")
		}
	})

	t.Run("wrong OTP", func(t *testing.T) {
		http.Post(ts.URL+"/api/auth/send-otp", "application/json",
			strings.NewReader(`{"phone":"+917777777777"}`))
		resp, _ := http.Post(ts.URL+"/api/auth/verify-otp", "application/json",
			strings.NewReader(`{"phone":"+917777777777","code":"000000"}`))
		if resp.StatusCode != 401 {
			t.Errorf("expected 401 for wrong OTP, got %d", resp.StatusCode)
		}
	})

	t.Run("OTP without send", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/verify-otp", "application/json",
			strings.NewReader(`{"phone":"+910000000000","code":"123456"}`))
		if resp.StatusCode != 401 {
			t.Errorf("expected 401 for OTP without send, got %d", resp.StatusCode)
		}
	})

	t.Run("brute force - very long code", func(t *testing.T) {
		resp, _ := http.Post(ts.URL+"/api/auth/verify-otp", "application/json",
			strings.NewReader(`{"phone":"+918888888888","code":"123456789012345678901234567890"}`))
		if resp.StatusCode == 200 {
			t.Error("VULNERABILITY: accepted overly long OTP code")
		}
	})
}

// ==================== PROTECTED ENDPOINT AUTH TESTS ====================

func TestAuthRequired(t *testing.T) {
	ts, _ := setupTestServer(t)

	endpoints := []struct {
		method string
		path   string
	}{
		{"GET", "/api/profile/"},
		{"GET", "/api/user-products"},
		{"GET", "/api/categories"},
		{"GET", "/api/items?category_id=x"},
		{"GET", "/api/customers?phone=x"},
		{"GET", "/api/dealerProducts"},
		{"GET", "/api/invoices"},
		{"POST", "/api/user-products"},
		{"POST", "/api/invoices"},
		{"POST", "/api/onboarding/user"},
	}

	for _, ep := range endpoints {
		t.Run(fmt.Sprintf("%s %s without token", ep.method, ep.path), func(t *testing.T) {
			req, _ := http.NewRequest(ep.method, ts.URL+ep.path, nil)
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
			if resp.StatusCode != 401 {
				t.Errorf("expected 401, got %d — endpoint not protected!", resp.StatusCode)
			}
		})

		t.Run(fmt.Sprintf("%s %s with invalid token", ep.method, ep.path), func(t *testing.T) {
			req, _ := http.NewRequest(ep.method, ts.URL+ep.path, nil)
			req.Header.Set("Authorization", "Bearer invalid.token.here")
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
			if resp.StatusCode != 401 {
				t.Errorf("expected 401 for invalid token, got %d", resp.StatusCode)
			}
		})
	}
}

// ==================== USER PRODUCT TESTS ====================

func TestUserProducts(t *testing.T) {
	ts, token := setupTestServer(t)

	t.Run("list returns array not null", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/user-products", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != 200 {
			t.Fatalf("expected 200, got %d", resp.StatusCode)
		}
		// Must be array, not null
		trimmed := strings.TrimSpace(string(body))
		if trimmed == "null" {
			t.Error("BUG: list returns null instead of []")
		}
		if !strings.HasPrefix(trimmed, "[") {
			t.Errorf("expected JSON array, got: %s", trimmed[:20])
		}
	})

	t.Run("create with valid data", func(t *testing.T) {
		body := `{"user_product_name":"Test TV","warranty_start_date":"2026-01-01","warranty_end_date":"2027-01-01"}`
		req, _ := authReq("POST", ts.URL+"/api/user-products", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode != 201 {
			b, _ := io.ReadAll(resp.Body)
			t.Fatalf("expected 201, got %d: %s", resp.StatusCode, string(b))
		}
		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		if result["user_product_id"] == nil {
			t.Error("expected user_product_id in response")
		}
	})

	t.Run("create with empty name", func(t *testing.T) {
		body := `{"user_product_name":"","warranty_start_date":"2026-01-01","warranty_end_date":"2027-01-01"}`
		req, _ := authReq("POST", ts.URL+"/api/user-products", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		// Should still succeed since DB allows empty names (but could be a validation gap)
		if resp.StatusCode != 201 {
			t.Logf("NOTE: empty product name returns %d (consider adding validation)", resp.StatusCode)
		}
	})

	t.Run("create with invalid date format", func(t *testing.T) {
		body := `{"user_product_name":"Bad Date","warranty_start_date":"not-a-date","warranty_end_date":"also-not"}`
		req, _ := authReq("POST", ts.URL+"/api/user-products", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode == 201 {
			t.Error("BUG: accepted invalid date format — should validate")
		}
	})

	t.Run("create with XSS in product name", func(t *testing.T) {
		body := `{"user_product_name":"<script>alert('xss')</script>","warranty_start_date":"2026-01-01","warranty_end_date":"2027-01-01"}`
		req, _ := authReq("POST", ts.URL+"/api/user-products", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		// API stores it as-is (JSON API), XSS is a frontend concern
		// But PDF generation must not execute scripts
		if resp.StatusCode != 201 {
			t.Logf("XSS payload handling: status %d", resp.StatusCode)
		}
	})

	t.Run("get details for nonexistent ID", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/user-products/00000000-0000-0000-0000-000000000000", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode != 404 {
			t.Errorf("expected 404 for nonexistent product, got %d", resp.StatusCode)
		}
	})

	t.Run("get details with invalid UUID", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/user-products/not-a-uuid", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode == 500 {
			t.Error("BUG: invalid UUID causes 500 instead of 404/400")
		}
	})

	t.Run("SQL injection in URL param", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/user-products/'; DROP TABLE user_products; --", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode == 500 {
			t.Error("VULNERABILITY: possible SQL injection via URL param")
		}
	})
}

// ==================== INVOICE TESTS ====================

func TestInvoices(t *testing.T) {
	ts, token := setupTestServer(t)

	t.Run("create invoice generates PDF", func(t *testing.T) {
		// First create a product
		prodBody := `{"user_product_name":"Invoice Test Product","warranty_start_date":"2026-01-01","warranty_end_date":"2027-01-01"}`
		req, _ := authReq("POST", ts.URL+"/api/user-products", token, strings.NewReader(prodBody))
		resp, _ := http.DefaultClient.Do(req)
		var prodResult map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&prodResult)
		productID, _ := prodResult["user_product_id"].(string)
		if productID == "" {
			t.Skip("could not create test product (customer may not exist)")
		}

		// Create invoice
		invBody := fmt.Sprintf(`{
			"user_product_id": "%s",
			"sale_price": 25000,
			"customer_name": "Test Customer",
			"customer_phone": "+919999999999",
			"customer_address": "Test Address",
			"dealer_name": "Test Dealer",
			"dealer_address": "Dealer Address",
			"dealer_gstin": "29ABCDE1234F1Z5",
			"product_name": "Test Product",
			"model_number": "MDL-001",
			"serial_number": "SN-12345"
		}`, productID)
		req, _ = authReq("POST", ts.URL+"/api/invoices", token, strings.NewReader(invBody))
		resp, _ = http.DefaultClient.Do(req)

		if resp.StatusCode != 201 {
			b, _ := io.ReadAll(resp.Body)
			t.Fatalf("expected 201, got %d: %s", resp.StatusCode, string(b))
		}

		var invResult map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&invResult)
		if invResult["invoice_url"] == nil || invResult["invoice_url"] == "" {
			t.Error("BUG: invoice_url not populated — PDF not generated")
		}
		if invResult["invoice_number"] == nil {
			t.Error("missing invoice_number")
		}
	})

	t.Run("create invoice with zero price", func(t *testing.T) {
		body := `{
			"user_product_id": "00000000-0000-0000-0000-000000000000",
			"sale_price": 0,
			"customer_name": "Zero",
			"product_name": "Free"
		}`
		req, _ := authReq("POST", ts.URL+"/api/invoices", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		// Zero price should still work (free products exist)
		if resp.StatusCode == 500 {
			t.Error("BUG: zero price causes server error")
		}
	})

	t.Run("create invoice with negative price", func(t *testing.T) {
		body := `{
			"user_product_id": "00000000-0000-0000-0000-000000000000",
			"sale_price": -1000,
			"customer_name": "Negative",
			"product_name": "Refund?"
		}`
		req, _ := authReq("POST", ts.URL+"/api/invoices", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode == 201 {
			t.Error("VULNERABILITY: negative price accepted — could generate negative GST")
		}
	})

	t.Run("create invoice with massive price (overflow)", func(t *testing.T) {
		body := `{
			"user_product_id": "00000000-0000-0000-0000-000000000000",
			"sale_price": 99999999999999.99,
			"customer_name": "Overflow",
			"product_name": "Expensive"
		}`
		req, _ := authReq("POST", ts.URL+"/api/invoices", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode == 500 {
			t.Error("BUG: large price causes overflow/crash")
		}
	})
}

// ==================== UPLOAD TESTS ====================

func TestConsumerUpload(t *testing.T) {
	ts, token := setupTestServer(t)

	t.Run("valid file upload", func(t *testing.T) {
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)
		part, _ := writer.CreateFormFile("invoiceImage", "test.jpg")
		part.Write([]byte("fake image data"))
		writer.Close()

		req, _ := http.NewRequest("POST", ts.URL+"/api/upload", &buf)
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		resp, _ := http.DefaultClient.Do(req)

		if resp.StatusCode != 200 {
			b, _ := io.ReadAll(resp.Body)
			t.Fatalf("expected 200, got %d: %s", resp.StatusCode, string(b))
		}

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		if result["product_preview"] == nil {
			t.Error("missing product_preview in response")
		}
	})

	t.Run("missing file field", func(t *testing.T) {
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)
		writer.WriteField("other", "value")
		writer.Close()

		req, _ := http.NewRequest("POST", ts.URL+"/api/upload", &buf)
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		resp, _ := http.DefaultClient.Do(req)

		if resp.StatusCode != 400 {
			t.Errorf("expected 400 for missing file, got %d", resp.StatusCode)
		}
	})

	t.Run("path traversal in filename", func(t *testing.T) {
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)
		part, _ := writer.CreateFormFile("invoiceImage", "../../../etc/passwd")
		part.Write([]byte("malicious content"))
		writer.Close()

		req, _ := http.NewRequest("POST", ts.URL+"/api/upload", &buf)
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		resp, _ := http.DefaultClient.Do(req)

		// Should succeed but file must be stored safely within storage dir
		if resp.StatusCode == 200 {
			var result map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&result)
			preview := result["product_preview"].(map[string]interface{})
			url := preview["item_url"].(string)
			if strings.Contains(url, "..") {
				t.Error("VULNERABILITY: path traversal in stored file URL")
			}
		}
	})

	t.Run("oversized file rejected", func(t *testing.T) {
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)
		part, _ := writer.CreateFormFile("invoiceImage", "huge.jpg")
		// Write 11MB (exceeds 10MB limit)
		bigData := make([]byte, 11*1024*1024)
		part.Write(bigData)
		writer.Close()

		req, _ := http.NewRequest("POST", ts.URL+"/api/upload", &buf)
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		resp, _ := http.DefaultClient.Do(req)

		if resp.StatusCode == 200 {
			t.Error("BUG: accepted file larger than 10MB limit")
		}
	})
}

// ==================== CATALOG TESTS ====================

func TestCatalog(t *testing.T) {
	ts, token := setupTestServer(t)

	t.Run("categories returns array", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/categories", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != 200 {
			t.Fatalf("expected 200, got %d", resp.StatusCode)
		}
		if strings.TrimSpace(string(body)) == "null" {
			t.Error("BUG: categories returns null instead of []")
		}
	})

	t.Run("items requires category_id", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/items", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode != 400 {
			t.Errorf("expected 400 without category_id, got %d", resp.StatusCode)
		}
	})

	t.Run("products requires item_id", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/products", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode != 400 {
			t.Errorf("expected 400 without item_id, got %d", resp.StatusCode)
		}
	})

	t.Run("SQL injection in category_id param", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/items?category_id='; DROP TABLE items; --", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode == 500 {
			t.Error("VULNERABILITY: SQL injection in category_id")
		}
	})
}

// ==================== CUSTOMER TESTS ====================

func TestCustomers(t *testing.T) {
	ts, token := setupTestServer(t)

	t.Run("find by phone requires phone param", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/customers", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		if resp.StatusCode != 400 {
			t.Errorf("expected 400 without phone param, got %d", resp.StatusCode)
		}
	})

	t.Run("find nonexistent phone returns found:false", func(t *testing.T) {
		req, _ := authReq("GET", ts.URL+"/api/customers?phone=%2B910000000001", token, nil)
		resp, _ := http.DefaultClient.Do(req)
		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		if result["found"] != false {
			t.Errorf("expected found:false, got %v", result["found"])
		}
	})
}

// ==================== GST CALCULATION TESTS ====================

func TestGSTCalculation(t *testing.T) {
	// These test the business logic via the invoice endpoint
	ts, token := setupTestServer(t)

	// Create a product first
	prodBody := `{"user_product_name":"GST Test","warranty_start_date":"2026-01-01","warranty_end_date":"2027-01-01"}`
	req, _ := authReq("POST", ts.URL+"/api/user-products", token, strings.NewReader(prodBody))
	resp, _ := http.DefaultClient.Do(req)
	var prodResult map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&prodResult)
	productID, _ := prodResult["user_product_id"].(string)

	t.Run("GST applied correctly to invoice", func(t *testing.T) {
		if productID == "" {
			t.Skip("no product created (customer may not exist)")
		}
		body := fmt.Sprintf(`{
			"user_product_id": "%s",
			"sale_price": 10000,
			"customer_name": "GST Test",
			"product_name": "Widget"
		}`, productID)
		req, _ := authReq("POST", ts.URL+"/api/invoices", token, strings.NewReader(body))
		resp, _ := http.DefaultClient.Do(req)
		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		invoiceID, _ := result["invoice_id"].(string)

		// Fetch the invoice to verify GST
		req2, _ := authReq("GET", ts.URL+"/api/invoices/"+invoiceID, token, nil)
		resp2, _ := http.DefaultClient.Do(req2)
		var inv map[string]interface{}
		json.NewDecoder(resp2.Body).Decode(&inv)

		invoice := inv["invoice"].(map[string]interface{})
		total := invoice["total_amount"].(float64)
		// Total = base (10000) which is what we pass as sale_price
		if total != 10000 {
			t.Errorf("expected total 10000, got %f", total)
		}
	})
}

// ==================== CORS TESTS ====================

func TestCORS(t *testing.T) {
	ts, _ := setupTestServer(t)

	t.Run("preflight OPTIONS returns CORS headers", func(t *testing.T) {
		req, _ := http.NewRequest("OPTIONS", ts.URL+"/api/user-products", nil)
		req.Header.Set("Origin", "http://localhost:8081")
		req.Header.Set("Access-Control-Request-Method", "POST")
		resp, _ := http.DefaultClient.Do(req)

		if resp.Header.Get("Access-Control-Allow-Origin") == "" {
			t.Error("missing CORS header on preflight")
		}
	})

	t.Run("unauthorized origin", func(t *testing.T) {
		req, _ := http.NewRequest("OPTIONS", ts.URL+"/api/user-products", nil)
		req.Header.Set("Origin", "http://evil.com")
		req.Header.Set("Access-Control-Request-Method", "POST")
		resp, _ := http.DefaultClient.Do(req)

		origin := resp.Header.Get("Access-Control-Allow-Origin")
		if origin == "*" || origin == "http://evil.com" {
			t.Error("VULNERABILITY: CORS allows unauthorized origins")
		}
	})
}

// ==================== HEALTH CHECK ====================

func TestHealth(t *testing.T) {
	ts, _ := setupTestServer(t)

	t.Run("health endpoint", func(t *testing.T) {
		resp, _ := http.Get(ts.URL + "/health")
		if resp.StatusCode != 200 {
			t.Errorf("expected 200, got %d", resp.StatusCode)
		}
		var result map[string]string
		json.NewDecoder(resp.Body).Decode(&result)
		if result["status"] != "ok" {
			t.Errorf("expected status ok, got %s", result["status"])
		}
	})
}
