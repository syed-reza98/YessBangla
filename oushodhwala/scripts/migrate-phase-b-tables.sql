-- ============================================================
-- Phase B Schema Expansion & Integrity Migration for Oushodhwala
-- Applies missing 27 tables/views, deduplicates user_roles,
-- adds composite indexes and constraints
-- ============================================================

USE oushodhwala_db;

-- 1. Deduplicate user_roles and enforce unique constraint
DELETE FROM user_roles WHERE id NOT IN (
  SELECT min_id FROM (SELECT MIN(id) AS min_id FROM user_roles GROUP BY user_id, role) t
);

-- Drop duplicate index if exists, then add unique constraint
SET @exist := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE table_schema='oushodhwala_db' AND table_name='user_roles' AND index_name='uq_user_role');
SET @sql := IF(@exist > 0, 'SELECT 1', 'ALTER TABLE user_roles ADD CONSTRAINT uq_user_role UNIQUE (user_id, role)');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Delivery & Riders
CREATE TABLE IF NOT EXISTS riders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE,
  name VARCHAR(150) NOT NULL DEFAULT '',
  phone VARCHAR(50) NOT NULL DEFAULT '',
  vehicle VARCHAR(50) NOT NULL DEFAULT 'bike',
  zone VARCHAR(100) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  base_fee DECIMAL(10,2) NOT NULL DEFAULT 60.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_events (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  actor VARCHAR(50) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_notifications (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Stock Operations & Counts
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id VARCHAR(36) PRIMARY KEY,
  adj_no VARCHAR(100) NOT NULL UNIQUE,
  reason VARCHAR(100) NOT NULL DEFAULT 'correction',
  note TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'applied',
  branch_id VARCHAR(36),
  created_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_adjustment_items (
  id VARCHAR(36) PRIMARY KEY,
  adj_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL DEFAULT '',
  change_qty INT NOT NULL DEFAULT 0,
  before_qty INT NOT NULL DEFAULT 0,
  after_qty INT NOT NULL DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS stock_counts (
  id VARCHAR(36) PRIMARY KEY,
  count_no VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  note TEXT,
  branch_id VARCHAR(36),
  created_by VARCHAR(36),
  applied_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_count_items (
  id VARCHAR(36) PRIMARY KEY,
  count_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  system_qty INT NOT NULL DEFAULT 0,
  counted_qty INT NOT NULL DEFAULT 0,
  discrepancy INT NOT NULL DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id VARCHAR(36) PRIMARY KEY,
  transfer_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  received_qty INT NOT NULL DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  branch_id VARCHAR(36),
  type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Clinical, Appointments & Telehealth
CREATE TABLE IF NOT EXISTS doctor_blackouts (
  id VARCHAR(36) PRIMARY KEY,
  doctor_id VARCHAR(36) NOT NULL,
  day DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_reviews (
  id VARCHAR(36) PRIMARY KEY,
  doctor_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_messages (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  sender_role VARCHAR(50) NOT NULL DEFAULT 'patient',
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_media (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL DEFAULT 'image',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_prescriptions (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  prescription_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customer Operations & Auditing
CREATE TABLE IF NOT EXISTS order_returns (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  order_no VARCHAR(100) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL DEFAULT 5,
  comment TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription_audit (
  id VARCHAR(36) PRIMARY KEY,
  prescription_id VARCHAR(36) NOT NULL,
  actor_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  details JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_image_audit (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_logs (
  id VARCHAR(36) PRIMARY KEY,
  source VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  context JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. API Hub & Integrations
CREATE TABLE IF NOT EXISTS api_endpoints (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'GET',
  url TEXT NOT NULL,
  headers JSON,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_integrations (
  id VARCHAR(36) PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  api_key TEXT,
  config JSON,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_test_logs (
  id VARCHAR(36) PRIMARY KEY,
  endpoint_id VARCHAR(36) NOT NULL,
  status_code INT,
  response_body TEXT,
  duration_ms INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_audit_log (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_import_failures (
  id VARCHAR(36) PRIMARY KEY,
  run_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36),
  error TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_import_runs (
  id VARCHAR(36) PRIMARY KEY,
  total INT NOT NULL DEFAULT 0,
  successful INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image_revisions (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  image_url TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create medicine_directory VIEW for legacy and directory queries
CREATE OR REPLACE VIEW medicine_directory AS
SELECT 
  p.id,
  p.name,
  p.name AS en,
  COALESCE(p.manufacturer, '') AS brand,
  COALESCE(p.generic_name, '') AS generic,
  COALESCE(p.strength, '') AS strength,
  COALESCE(p.dosage_form, 'Tablet') AS form,
  '10 pcs' AS pack,
  p.unit_price AS price,
  COALESCE(p.mrp, p.unit_price) AS mrp,
  p.requires_prescription AS rx,
  COALESCE(p.category_id, 'medicine') AS category,
  p.image_url,
  COALESCE(p.manufacturer, '') AS company,
  COALESCE(gi.indication, '') AS grp_bn,
  COALESCE(gi.indication, 'General') AS grp_en
FROM products p
LEFT JOIN generic_info gi ON LOWER(TRIM(gi.generic_name)) = LOWER(TRIM(p.generic_name))
WHERE p.is_active = 1;

-- 8. Performance Composite Indexes
ALTER TABLE products ADD INDEX idx_products_search (is_active, category_id, name);
ALTER TABLE orders ADD INDEX idx_orders_customer (customer_id, created_at);
ALTER TABLE order_items ADD INDEX idx_order_items_order (order_id);
ALTER TABLE pos_sale_items ADD INDEX idx_pos_sale_items_sale (sale_id);
ALTER TABLE appointments ADD INDEX idx_appointments_doc (doctor_id, appointment_date);
ALTER TABLE prescriptions ADD INDEX idx_prescriptions_user (user_id, status);
