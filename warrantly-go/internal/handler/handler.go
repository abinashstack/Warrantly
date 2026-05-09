package handler

import (
	"encoding/json"
	"net/http"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handlers aggregates all handler groups
type Handlers struct {
	Auth         *AuthHandler
	Onboarding   *OnboardingHandler
	Profile      *ProfileHandler
	Catalog      *CatalogHandler
	Customer     *CustomerHandler
	Dealer       *DealerHandler
	DealerUser   *DealerUserHandler
	DealerProduct *DealerProductHandler
	DealerModel  *DealerModelHandler
	UserProduct  *UserProductHandler
	Invoice      *InvoiceHandler
	Upload       *UploadHandler
}

func NewHandlers(pool *pgxpool.Pool, otpService *auth.OTPService, jwtSecret, refreshSecret, baseURL string) *Handlers {
	return &Handlers{
		Auth:          &AuthHandler{pool: pool, otpService: otpService, jwtSecret: jwtSecret, refreshSecret: refreshSecret},
		Onboarding:    &OnboardingHandler{pool: pool},
		Profile:       &ProfileHandler{pool: pool},
		Catalog:       &CatalogHandler{pool: pool},
		Customer:      &CustomerHandler{pool: pool},
		Dealer:        &DealerHandler{pool: pool},
		DealerUser:    &DealerUserHandler{pool: pool},
		DealerProduct: &DealerProductHandler{pool: pool},
		DealerModel:   &DealerModelHandler{pool: pool},
		UserProduct:   &UserProductHandler{pool: pool},
		Invoice:       &InvoiceHandler{pool: pool, baseURL: baseURL},
		Upload:        &UploadHandler{pool: pool, baseURL: baseURL},
	}
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}
