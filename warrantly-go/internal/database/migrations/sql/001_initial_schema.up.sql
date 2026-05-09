CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profile
CREATE TABLE IF NOT EXISTS profile (
    profile_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name   TEXT,
    last_name    TEXT,
    email_address TEXT,
    address      TEXT,
    profile_image TEXT,
    role         TEXT[] NOT NULL DEFAULT '{}',
    notification_preference TEXT,
    timezone     TEXT DEFAULT 'IST',
    created_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer
CREATE TABLE IF NOT EXISTS customer (
    customer_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id   UUID REFERENCES profile(profile_id),
    phone_number TEXT NOT NULL,
    is_active    BOOLEAN DEFAULT true,
    created_by   UUID,
    changed_by   UUID,
    changed_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customer(phone_number);
CREATE INDEX IF NOT EXISTS idx_customer_profile ON customer(profile_id);

-- Dealer
CREATE TABLE IF NOT EXISTS dealer (
    dealer_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_name     TEXT NOT NULL,
    dealer_address  TEXT,
    phone_number    TEXT,
    gst_number      TEXT,
    approval_status TEXT DEFAULT 'pending',
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealer User
CREATE TABLE IF NOT EXISTS dealer_user (
    dealer_user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id      UUID NOT NULL REFERENCES dealer(dealer_id),
    profile_id     UUID REFERENCES profile(profile_id),
    phone_number   TEXT NOT NULL,
    role           TEXT NOT NULL DEFAULT 'OWNER',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dealer_user_profile ON dealer_user(profile_id);
CREATE INDEX IF NOT EXISTS idx_dealer_user_phone ON dealer_user(phone_number);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    category_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT NOT NULL
);

-- Items
CREATE TABLE IF NOT EXISTS items (
    item_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id    UUID NOT NULL REFERENCES categories(category_id),
    item_name      TEXT NOT NULL,
    item_image_url TEXT
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
    brand_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name TEXT NOT NULL
);

-- Products (global catalog)
CREATE TABLE IF NOT EXISTS product (
    product_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id              UUID REFERENCES brands(brand_id),
    item_id               UUID REFERENCES items(item_id),
    product_name          TEXT NOT NULL,
    registration_required BOOLEAN DEFAULT false
);

-- Dealer Products
CREATE TABLE IF NOT EXISTS dealer_product (
    dealer_product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id         UUID NOT NULL REFERENCES dealer(dealer_id),
    product_id        UUID NOT NULL REFERENCES product(product_id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dealer Product Models
CREATE TABLE IF NOT EXISTS dealer_product_model (
    dealer_product_model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_product_id       UUID NOT NULL REFERENCES dealer_product(dealer_product_id),
    model_name              TEXT,
    model_number            TEXT NOT NULL,
    mrp                     NUMERIC(12,2),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Products
CREATE TABLE IF NOT EXISTS user_products (
    user_product_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id               UUID REFERENCES product(product_id),
    owner_id                 UUID,
    user_product_name        TEXT,
    serial_number            TEXT,
    warranty_start_date      DATE,
    warranty_end_date        DATE,
    extended_warranty_end_date DATE,
    is_warranty_activated    BOOLEAN DEFAULT false,
    created_by               UUID,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_products_owner ON user_products(owner_id);

-- Warranties
CREATE TABLE IF NOT EXISTS warranties (
    warranty_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id                UUID REFERENCES brands(brand_id),
    item_id                 UUID REFERENCES items(item_id),
    warranty_type           TEXT NOT NULL,
    base_warranty_duration  INT NOT NULL,
    terms_and_conditions    TEXT
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_product_id     UUID REFERENCES user_products(user_product_id),
    invoice_number      TEXT NOT NULL UNIQUE,
    invoice_date        DATE,
    dealer_id           UUID REFERENCES dealer(dealer_id),
    dealer_name         TEXT,
    dealer_address      TEXT,
    dealer_gstin        TEXT,
    customer_name       TEXT,
    customer_phone      TEXT,
    customer_address    TEXT,
    product_name        TEXT,
    model_number        TEXT,
    serial_number       TEXT,
    taxable_amount      NUMERIC(12,2),
    gst_percentage      NUMERIC(5,2) DEFAULT 18.00,
    cgst_amount         NUMERIC(12,2),
    sgst_amount         NUMERIC(12,2),
    igst_amount         NUMERIC(12,2) DEFAULT 0,
    total_amount        NUMERIC(12,2),
    currency            TEXT DEFAULT 'INR',
    source_type         TEXT DEFAULT 'DEALER',
    is_verified         BOOLEAN DEFAULT false,
    verification_method TEXT,
    invoice_url         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_dealer ON invoices(dealer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_product ON invoices(user_product_id);

-- OTP codes (for phone auth)
CREATE TABLE IF NOT EXISTS otp_codes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    code         TEXT NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    verified     BOOLEAN DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone_number);
