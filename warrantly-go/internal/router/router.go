package router

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/abinashstack/warrantly-go/internal/handler"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func New(h *handler.Handlers, authMW func(http.Handler) http.Handler) chi.Router {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:8081", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Public auth routes
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/send-otp", h.Auth.SendOTP)
		r.Post("/verify-otp", h.Auth.VerifyOTP)
		r.Post("/refresh", h.Auth.RefreshToken)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(authMW)

		r.Route("/api/onboarding", func(r chi.Router) {
			r.Post("/user", h.Onboarding.OnboardUser)
			r.Post("/dealer", h.Onboarding.OnboardDealer)
		})

		r.Route("/api/profile", func(r chi.Router) {
			r.Get("/", h.Profile.Get)
			r.Post("/", h.Profile.CreateOrUpdate)
		})

		r.Get("/api/categories", h.Catalog.ListCategories)
		r.Get("/api/items", h.Catalog.ListItems)
		r.Get("/api/products", h.Catalog.ListProducts)

		r.Route("/api/customers", func(r chi.Router) {
			r.Get("/", h.Customer.FindByPhone)
			r.Post("/", h.Customer.Create)
		})

		r.Post("/api/dealers", h.Dealer.Create)
		r.Get("/api/dealerUsers", h.DealerUser.CheckByPhone)

		r.Route("/api/dealerProducts", func(r chi.Router) {
			r.Get("/", h.DealerProduct.List)
			r.Get("/{id}", h.DealerProduct.GetWithModels)
			r.Post("/", h.DealerProduct.Create)
		})

		r.Route("/api/dealerModels", func(r chi.Router) {
			r.Get("/", h.DealerModel.List)
			r.Post("/", h.DealerModel.Create)
		})

		r.Route("/api/user-products", func(r chi.Router) {
			r.Get("/", h.UserProduct.List)
			r.Get("/{id}", h.UserProduct.GetDetails)
			r.Post("/", h.UserProduct.Create)
			r.Post("/dealer-upload", h.UserProduct.DealerUpload)
		})

		r.Route("/api/invoices", func(r chi.Router) {
			r.Get("/", h.Invoice.List)
			r.Get("/{invoiceId}", h.Invoice.Get)
			r.Post("/", h.Invoice.Create)
		})

		r.Post("/api/upload", h.Upload.ConsumerUpload)
		r.Post("/api/upload/dealer", h.Upload.DealerSaleFlow)
	})

	// Serve stored PDFs
	r.Handle("/storage/*", http.StripPrefix("/storage/", http.FileServer(http.Dir("./storage"))))

	return r
}
