-- yesspos schema alignment for UI + delivery/checkout (XAMPP / cPanel)
USE yesspos_db;

-- Products: UI expects name_en / price; Drizzle uses name / selling_price
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_bn VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS pack_size VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS stock DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS low_stock_at DECIMAL(12,2) NULL;

UPDATE products SET name_en = name WHERE name_en IS NULL OR name_en = '';

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS name_bn VARCHAR(150) NULL;
UPDATE categories SET name_en = name WHERE name_en IS NULL OR name_en = '';

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS name_bn VARCHAR(150) NULL;
UPDATE brands SET name_en = name WHERE name_en IS NULL OR name_en = '';

-- Delivery orders: expand to checkout fields
ALTER TABLE delivery_orders
  ADD COLUMN IF NOT EXISTS order_no INT NULL,
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS slot_date VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS slot VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS area VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS note TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS eta_minutes INT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS address TEXT NULL,
  ADD COLUMN IF NOT EXISTS branch_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS zone_id VARCHAR(36) NULL;

-- Backfill address from delivery_address
UPDATE delivery_orders SET address = delivery_address WHERE (address IS NULL OR address = '') AND delivery_address IS NOT NULL;

-- Assign order_no where missing
SET @n := (SELECT IFNULL(MAX(order_no), 1000) FROM delivery_orders);
UPDATE delivery_orders SET order_no = (@n := @n + 1) WHERE order_no IS NULL;

CREATE TABLE IF NOT EXISTS delivery_order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NULL,
  name_snapshot VARCHAR(255) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  INDEX (order_id)
);

CREATE TABLE IF NOT EXISTS delivery_feedback (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  order_no INT NULL,
  phone VARCHAR(50) NULL,
  kind VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (order_id)
);

CREATE TABLE IF NOT EXISTS delivery_proofs (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  kind VARCHAR(50) NOT NULL DEFAULT 'photo',
  file_path TEXT NOT NULL,
  receiver_name VARCHAR(150) NULL,
  note TEXT,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  status VARCHAR(50) DEFAULT 'ok',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (order_id)
);

CREATE TABLE IF NOT EXISTS delivery_order_events (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  actor_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (order_id)
);

ALTER TABLE delivery_zones
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS name_bn VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(12,2) NULL,
  ADD COLUMN IF NOT EXISTS free_delivery_above DECIMAL(12,2) NULL,
  ADD COLUMN IF NOT EXISTS eta_minutes INT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branch_id VARCHAR(36) NULL;
UPDATE delivery_zones SET name_en = name WHERE name_en IS NULL OR name_en = '';
UPDATE delivery_zones SET delivery_fee = fee WHERE delivery_fee IS NULL;

ALTER TABLE delivery_riders
  ADD COLUMN IF NOT EXISTS nid VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS branch_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS note TEXT NULL,
  ADD COLUMN IF NOT EXISTS current_lat DECIMAL(10,7) NULL,
  ADD COLUMN IF NOT EXISTS current_lng DECIMAL(10,7) NULL,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS api_settings (
  id VARCHAR(36) PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  meta JSON,
  provider VARCHAR(100) NULL,
  label VARCHAR(150) NULL,
  category VARCHAR(100) NULL,
  enabled BOOLEAN DEFAULT TRUE,
  base_url TEXT,
  api_key TEXT,
  api_secret TEXT,
  sender_id VARCHAR(100) NULL,
  extra JSON,
  notes TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cart: migrate to JSON lines shape if still line-rows
CREATE TABLE IF NOT EXISTS user_carts_v2 (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  lines JSON,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Prefer v2 if empty and old table has rows — leave both; Actions use user_carts with lines JSON
-- Recreate user_carts only when it lacks `lines`
SET @has_lines := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'yesspos_db' AND TABLE_NAME = 'user_carts' AND COLUMN_NAME = 'lines'
);
-- If no lines column, rename old and create new
-- (MariaDB procedural workaround via prepared statement)
SET @sql := IF(@has_lines = 0,
  'RENAME TABLE user_carts TO user_carts_legacy_lines; CREATE TABLE user_carts (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL UNIQUE, `lines` JSON, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- customer_notifications: ensure all required columns exist
ALTER TABLE customer_notifications
  ADD COLUMN IF NOT EXISTS order_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT 'inapp',
  ADD COLUMN IF NOT EXISTS is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS send_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS send_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS last_error TEXT NULL;

-- Loyalty membership flags on contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS is_member BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMP NULL;

-- Delivery feedback SLA columns
ALTER TABLE delivery_feedback
  ADD COLUMN IF NOT EXISTS severity VARCHAR(50) NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(36) NULL;

UPDATE delivery_feedback
SET due_at = created_at + INTERVAL 24 HOUR
WHERE due_at IS NULL AND kind <> 'issue';

UPDATE delivery_feedback
SET due_at = created_at + INTERVAL 2 HOUR,
    severity = 'high'
WHERE due_at IS NULL AND kind = 'issue';

-- Slot capacity for delivery windows
CREATE TABLE IF NOT EXISTS delivery_slot_capacity (
  id VARCHAR(36) PRIMARY KEY,
  slot_id VARCHAR(50) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 25,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO delivery_slot_capacity (id, slot_id, capacity, is_active)
VALUES
  (UUID(), '08:00-11:00', 25, TRUE),
  (UUID(), '11:00-14:00', 30, TRUE),
  (UUID(), '14:00-17:00', 30, TRUE),
  (UUID(), '17:00-20:00', 25, TRUE)
ON DUPLICATE KEY UPDATE capacity = VALUES(capacity);


-- UI column alignment for Server Actions migration (eliminate /api/db shim)
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP NULL;

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS name_snapshot VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS line_total DECIMAL(12,2) NULL;
UPDATE sale_items SET line_total = total_price WHERE line_total IS NULL;

ALTER TABLE expense_categories
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS name_bn VARCHAR(150) NULL;
UPDATE expense_categories SET name_en = name WHERE name_en IS NULL OR name_en = '';

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS spent_on TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NULL;
UPDATE expenses SET spent_on = expense_date WHERE spent_on IS NULL;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS purchased_on TIMESTAMP NULL;
UPDATE purchases SET purchased_on = created_at WHERE purchased_on IS NULL;

ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
UPDATE product_reviews SET is_approved = (status = 'approved') WHERE is_approved IS NULL OR is_approved = 0;

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS title_en VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS title_bn VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS body TEXT NULL,
  ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE promotions MODIFY COLUMN code VARCHAR(50) NULL;

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS shop_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS address TEXT NULL,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10) DEFAULT '৳',
  ADD COLUMN IF NOT EXISTS default_tax_pct DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS receipt_footer TEXT NULL;
ALTER TABLE business_settings MODIFY COLUMN `key` VARCHAR(100) NULL;

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) NULL;

ALTER TABLE ledger_accounts
  ADD COLUMN IF NOT EXISTS name_en VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS `class` VARCHAR(50) NULL;
UPDATE ledger_accounts SET name_en = name WHERE name_en IS NULL OR name_en = '';
UPDATE ledger_accounts SET `class` = type WHERE `class` IS NULL OR `class` = '';

ALTER TABLE site_content
  ADD COLUMN IF NOT EXISTS group_name VARCHAR(100) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS label VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS kind VARCHAR(50) DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS value_bn TEXT NULL,
  ADD COLUMN IF NOT EXISTS value_en TEXT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
