package handler

import (
	"net/http"

	"github.com/abinashstack/warrantly-go/internal/auth"
	"github.com/abinashstack/warrantly-go/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CatalogHandler struct {
	pool *pgxpool.Pool
}

func (h *CatalogHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := h.pool.Query(r.Context(),
		`SELECT category_id, category_name FROM categories ORDER BY category_name`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var c model.Category
		if err := rows.Scan(&c.CategoryID, &c.CategoryName); err != nil {
			continue
		}
		categories = append(categories, c)
	}

	if categories == nil {
		categories = []model.Category{}
	}
	respondJSON(w, http.StatusOK, categories)
}

func (h *CatalogHandler) ListItems(w http.ResponseWriter, r *http.Request) {
	categoryID := r.URL.Query().Get("category_id")
	if categoryID == "" {
		respondError(w, http.StatusBadRequest, "category_id is required")
		return
	}

	rows, err := h.pool.Query(r.Context(),
		`SELECT item_id, category_id, item_name, item_image_url FROM items WHERE category_id = $1 ORDER BY item_name`,
		categoryID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch items")
		return
	}
	defer rows.Close()

	var items []model.Item
	for rows.Next() {
		var i model.Item
		if err := rows.Scan(&i.ItemID, &i.CategoryID, &i.ItemName, &i.ItemImageURL); err != nil {
			continue
		}
		items = append(items, i)
	}

	if items == nil {
		items = []model.Item{}
	}
	respondJSON(w, http.StatusOK, items)
}

func (h *CatalogHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	itemID := r.URL.Query().Get("item_id")
	if itemID == "" {
		respondError(w, http.StatusBadRequest, "item_id is required")
		return
	}

	rows, err := h.pool.Query(r.Context(),
		`SELECT p.product_id, p.brand_id, p.item_id, p.product_name, p.registration_required
		 FROM product p WHERE p.item_id = $1 ORDER BY p.product_name`,
		itemID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}
	defer rows.Close()

	type ProductWithBrand struct {
		model.Product
		BrandName string `json:"brand_name"`
	}

	var products []map[string]interface{}
	for rows.Next() {
		var p model.Product
		if err := rows.Scan(&p.ProductID, &p.BrandID, &p.ItemID, &p.ProductName, &p.RegistrationRequired); err != nil {
			continue
		}
		products = append(products, map[string]interface{}{
			"product_id":            p.ProductID,
			"brand_id":              p.BrandID,
			"item_id":              p.ItemID,
			"product_name":          p.ProductName,
			"registration_required": p.RegistrationRequired,
		})
	}

	_ = auth.UserIDFromContext(r.Context()) // auth verified by middleware
	if products == nil {
		products = []map[string]interface{}{}
	}
	respondJSON(w, http.StatusOK, products)
}
