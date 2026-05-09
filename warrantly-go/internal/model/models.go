package model

import "time"

type Profile struct {
	ProfileID              string    `json:"profile_id" db:"profile_id"`
	FirstName              string    `json:"first_name" db:"first_name"`
	LastName               string    `json:"last_name" db:"last_name"`
	EmailAddress           string    `json:"email_address" db:"email_address"`
	Address                string    `json:"address" db:"address"`
	ProfileImage           string    `json:"profile_image" db:"profile_image"`
	Role                   []string  `json:"role" db:"role"`
	NotificationPreference string    `json:"notification_preference" db:"notification_preference"`
	Timezone               string    `json:"timezone" db:"timezone"`
	CreatedAt              time.Time `json:"created_at" db:"created_at"`
}

type Customer struct {
	CustomerID  string    `json:"customer_id" db:"customer_id"`
	ProfileID   string    `json:"profile_id" db:"profile_id"`
	PhoneNumber string    `json:"phone_number" db:"phone_number"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Dealer struct {
	DealerID       string    `json:"dealer_id" db:"dealer_id"`
	DealerName     string    `json:"dealer_name" db:"dealer_name"`
	DealerAddress  string    `json:"dealer_address" db:"dealer_address"`
	PhoneNumber    string    `json:"phone_number" db:"phone_number"`
	GSTNumber      string    `json:"gst_number" db:"gst_number"`
	ApprovalStatus string    `json:"approval_status" db:"approval_status"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

type DealerUser struct {
	DealerUserID string    `json:"dealer_user_id" db:"dealer_user_id"`
	DealerID     string    `json:"dealer_id" db:"dealer_id"`
	ProfileID    string    `json:"profile_id" db:"profile_id"`
	PhoneNumber  string    `json:"phone_number" db:"phone_number"`
	Role         string    `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Category struct {
	CategoryID   string `json:"category_id" db:"category_id"`
	CategoryName string `json:"category_name" db:"category_name"`
}

type Item struct {
	ItemID       string `json:"item_id" db:"item_id"`
	CategoryID   string `json:"category_id" db:"category_id"`
	ItemName     string `json:"item_name" db:"item_name"`
	ItemImageURL string `json:"item_image_url" db:"item_image_url"`
}

type Brand struct {
	BrandID   string `json:"brand_id" db:"brand_id"`
	BrandName string `json:"brand_name" db:"brand_name"`
}

type Product struct {
	ProductID            string `json:"product_id" db:"product_id"`
	BrandID              string `json:"brand_id" db:"brand_id"`
	ItemID               string `json:"item_id" db:"item_id"`
	ProductName          string `json:"product_name" db:"product_name"`
	RegistrationRequired bool   `json:"registration_required" db:"registration_required"`
}

type DealerProduct struct {
	DealerProductID string    `json:"dealer_product_id" db:"dealer_product_id"`
	DealerID        string    `json:"dealer_id" db:"dealer_id"`
	ProductID       string    `json:"product_id" db:"product_id"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type DealerProductModel struct {
	DealerProductModelID string  `json:"dealer_product_model_id" db:"dealer_product_model_id"`
	DealerProductID      string  `json:"dealer_product_id" db:"dealer_product_id"`
	ModelName            string  `json:"model_name" db:"model_name"`
	ModelNumber          string  `json:"model_number" db:"model_number"`
	MRP                  float64 `json:"mrp" db:"mrp"`
}

type UserProduct struct {
	UserProductID           string  `json:"user_product_id" db:"user_product_id"`
	ProductID               string  `json:"product_id" db:"product_id"`
	OwnerID                 string  `json:"owner_id" db:"owner_id"`
	UserProductName         string  `json:"user_product_name" db:"user_product_name"`
	SerialNumber            string  `json:"serial_number" db:"serial_number"`
	WarrantyStartDate       *string `json:"warranty_start_date" db:"warranty_start_date"`
	WarrantyEndDate         *string `json:"warranty_end_date" db:"warranty_end_date"`
	ExtendedWarrantyEndDate *string `json:"extended_warranty_end_date" db:"extended_warranty_end_date"`
	IsWarrantyActivated     bool    `json:"is_warranty_activated" db:"is_warranty_activated"`
	CreatedBy               string  `json:"created_by" db:"created_by"`
}

type UserProductDetails struct {
	UserProduct
	ProductName  string `json:"product_name"`
	BrandName    string `json:"brand_name"`
	ItemName     string `json:"item_name"`
}

type Warranty struct {
	WarrantyID            string `json:"warranty_id" db:"warranty_id"`
	BrandID               string `json:"brand_id" db:"brand_id"`
	ItemID                string `json:"item_id" db:"item_id"`
	WarrantyType          string `json:"warranty_type" db:"warranty_type"`
	BaseWarrantyDuration  int    `json:"base_warranty_duration" db:"base_warranty_duration"`
	TermsAndConditions    string `json:"terms_and_conditions" db:"terms_and_conditions"`
}

type Invoice struct {
	InvoiceID          string  `json:"invoice_id" db:"invoice_id"`
	UserProductID      string  `json:"user_product_id" db:"user_product_id"`
	InvoiceNumber      string  `json:"invoice_number" db:"invoice_number"`
	InvoiceDate        string  `json:"invoice_date" db:"invoice_date"`
	DealerID           string  `json:"dealer_id" db:"dealer_id"`
	DealerName         string  `json:"dealer_name" db:"dealer_name"`
	DealerAddress      string  `json:"dealer_address" db:"dealer_address"`
	DealerGSTIN        string  `json:"dealer_gstin" db:"dealer_gstin"`
	CustomerName       string  `json:"customer_name" db:"customer_name"`
	CustomerPhone      string  `json:"customer_phone" db:"customer_phone"`
	CustomerAddress    string  `json:"customer_address" db:"customer_address"`
	ProductName        string  `json:"product_name" db:"product_name"`
	ModelNumber        string  `json:"model_number" db:"model_number"`
	SerialNumber       string  `json:"serial_number" db:"serial_number"`
	TaxableAmount      float64 `json:"taxable_amount" db:"taxable_amount"`
	GSTPercentage      float64 `json:"gst_percentage" db:"gst_percentage"`
	CGSTAmount         float64 `json:"cgst_amount" db:"cgst_amount"`
	SGSTAmount         float64 `json:"sgst_amount" db:"sgst_amount"`
	IGSTAmount         float64 `json:"igst_amount" db:"igst_amount"`
	TotalAmount        float64 `json:"total_amount" db:"total_amount"`
	Currency           string  `json:"currency" db:"currency"`
	SourceType         string  `json:"source_type" db:"source_type"`
	IsVerified         bool    `json:"is_verified" db:"is_verified"`
	VerificationMethod string  `json:"verification_method" db:"verification_method"`
	InvoiceURL         string  `json:"invoice_url" db:"invoice_url"`
	CreatedAt          string  `json:"created_at" db:"created_at"`
}

type GSTResult struct {
	TaxableAmount float64 `json:"taxable_amount"`
	GSTPercentage float64 `json:"gst_percentage"`
	CGSTAmount    float64 `json:"cgst_amount"`
	SGSTAmount    float64 `json:"sgst_amount"`
	IGSTAmount    float64 `json:"igst_amount"`
	TotalAmount   float64 `json:"total_amount"`
}
