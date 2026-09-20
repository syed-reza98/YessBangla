-- ============================================================
-- YESSPOS DATABASE SEED (schema-corrected)
-- POS System for Bazar Bari Retail Outlets
-- ============================================================

USE yesspos_db;

-- ============================================================
-- Users (password: Admin@1234)
-- ============================================================
INSERT IGNORE INTO users (id, email, password_hash) VALUES
  ('aa000001-0000-0000-0000-000000000001', 'admin@bazarbari.com',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu'),
  ('aa000001-0000-0000-0000-000000000002', 'manager@bazarbari.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu'),
  ('aa000001-0000-0000-0000-000000000003', 'cashier1@bazarbari.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu'),
  ('aa000001-0000-0000-0000-000000000004', 'cashier2@bazarbari.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu');

-- profiles (actual columns: id, username, full_name, phone, role, branch_id, avatar_url, is_active)
INSERT IGNORE INTO profiles (id, full_name, phone, role, branch_id) VALUES
  ('aa000001-0000-0000-0000-000000000001', 'Super Admin',    '+8801700000001', 'super_admin', NULL),
  ('aa000001-0000-0000-0000-000000000002', 'Branch Manager', '+8801700000002', 'manager',     NULL),
  ('aa000001-0000-0000-0000-000000000003', 'Cashier One',    '+8801700000003', 'cashier',     NULL),
  ('aa000001-0000-0000-0000-000000000004', 'Cashier Two',    '+8801700000004', 'cashier',     NULL);

-- user_roles (actual columns: id, user_id, role, branch_id)
INSERT IGNORE INTO user_roles (id, user_id, role, branch_id) VALUES
  (UUID(), 'aa000001-0000-0000-0000-000000000001', 'super_admin', 'MAIN'),
  (UUID(), 'aa000001-0000-0000-0000-000000000002', 'manager',     'MAIN'),
  (UUID(), 'aa000001-0000-0000-0000-000000000003', 'cashier',     'MAIN'),
  (UUID(), 'aa000001-0000-0000-0000-000000000004', 'cashier',     'MAIN');

-- ============================================================
-- Branches
-- ============================================================
INSERT IGNORE INTO branches (id, name, code, address, phone, email, is_active) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'Bazar Bari — Uttara Main',    'BB-UTT-001', 'Shop 1-4, Sector 7 Market, Uttara, Dhaka-1230',           '+8801800000001', 'uttara@bazarbari.com',       1),
  ('bb000001-0000-0000-0000-000000000002', 'Bazar Bari — Mirpur 10',      'BB-MIR-001', 'Plot 5, Section 10, Mirpur, Dhaka-1216',                  '+8801800000002', 'mirpur@bazarbari.com',       1),
  ('bb000001-0000-0000-0000-000000000003', 'Bazar Bari — Bashundhara',    'BB-BAS-001', 'Block J, Road 23, Bashundhara R/A, Dhaka-1229',           '+8801800000003', 'bashundhara@bazarbari.com',  1),
  ('bb000001-0000-0000-0000-000000000004', 'Bazar Bari — Mohammadpur',    'BB-MOH-001', 'Geneva Camp Road, Mohammadpur, Dhaka-1207',               '+8801800000004', 'mohammadpur@bazarbari.com',  1);

-- Update manager's branch
UPDATE profiles SET branch_id='bb000001-0000-0000-0000-000000000001' WHERE id='aa000001-0000-0000-0000-000000000002';
UPDATE profiles SET branch_id='bb000001-0000-0000-0000-000000000001' WHERE id='aa000001-0000-0000-0000-000000000003';
UPDATE profiles SET branch_id='bb000001-0000-0000-0000-000000000002' WHERE id='aa000001-0000-0000-0000-000000000004';

-- ============================================================
-- Categories
-- ============================================================
INSERT IGNORE INTO categories (id, name, name_bn, slug, icon, sort_order, is_active) VALUES
  ('cc000001-0000-0000-0000-000000000001', 'Groceries & Staples',   'মুদি ও নিত্যপণ্য',          'groceries',   'ShoppingBasket', 1,  1),
  ('cc000001-0000-0000-0000-000000000002', 'Beverages',             'পানীয় ও জুস',              'beverages',   'Coffee',         2,  1),
  ('cc000001-0000-0000-0000-000000000003', 'Snacks & Confectionery','স্ন্যাকস ও বিস্কুট',        'snacks',      'Cookie',         3,  1),
  ('cc000001-0000-0000-0000-000000000004', 'Dairy & Eggs',          'দুধ ও ডিম',                 'dairy',       'Milk',           4,  1),
  ('cc000001-0000-0000-0000-000000000005', 'Personal Care',         'ব্যক্তিগত যত্ন',             'personal-care','Droplets',      5,  1),
  ('cc000001-0000-0000-0000-000000000006', 'Household Cleaning',    'গৃহস্থালি ও পরিচ্ছন্নতা',    'household',   'Sparkles',       6,  1),
  ('cc000001-0000-0000-0000-000000000007', 'Fresh Produce',         'তাজা শাকসবজি ও ফল',         'fresh',       'Leaf',           7,  1),
  ('cc000001-0000-0000-0000-000000000008', 'Frozen Foods',          'হিমায়িত খাবার',            'frozen',      'Snowflake',      8,  1),
  ('cc000001-0000-0000-0000-000000000009', 'Baby & Kids',           'শিশুর খাদ্য ও যত্ন',        'baby',        'Baby',           9,  1),
  ('cc000001-0000-0000-0000-000000000010', 'Stationery & Office',   'স্টেশনারি ও অফিস',          'stationery',  'PenLine',        10, 1);

-- ============================================================
-- Products (25 realistic Bangladeshi retail items)
-- ============================================================
INSERT IGNORE INTO products (id, name, sku, barcode, category_id, unit, cost_price, selling_price, mrp, vat_rate, description, is_active) VALUES
  ('pp000001', 'Miniket Rice 1kg',                    'GRO-RICE-001', '8901030012345', 'cc000001-0000-0000-0000-000000000001', 'kg',   55.00, 65.00, 70.00,  0.00, 'Premium miniket aromatic rice',            1),
  ('pp000002', 'Soyabean Oil 1L (Rupchanda)',         'GRO-OIL-001',  '8901030023456', 'cc000001-0000-0000-0000-000000000001', 'ltr', 140.00,160.00,165.00,  0.00, 'Rupchanda soyabean cooking oil',           1),
  ('pp000003', 'Musur Dal 500g',                      'GRO-DAL-001',  '8901030034567', 'cc000001-0000-0000-0000-000000000001', 'pcs',  58.00, 70.00, 75.00,  0.00, 'Red lentils 500g pack',                    1),
  ('pp000004', 'Flour (Atta) 2kg',                   'GRO-ATT-001',  '8901030045678', 'cc000001-0000-0000-0000-000000000001', 'pcs',  90.00,108.00,115.00,  0.00, 'Fresh wheat flour 2kg',                    1),
  ('pp000005', 'Sugar 1kg',                          'GRO-SUG-001',  '8901030056789', 'cc000001-0000-0000-0000-000000000001', 'kg',   60.00, 72.00, 75.00,  0.00, 'White refined sugar',                      1),
  ('pp000006', 'Nestlé Milo 400g Tin',               'BEV-MIL-001',  '6901030012345', 'cc000001-0000-0000-0000-000000000002', 'pcs', 320.00,380.00,395.00,  0.00, 'Milo energy drink powder tin',             1),
  ('pp000007', 'Tea Dust 250g (Ispahani)',            'BEV-TEA-001',  '6901030023456', 'cc000001-0000-0000-0000-000000000002', 'pcs',  70.00, 85.00, 90.00,  0.00, 'Ispahani Mirzapore tea dust',              1),
  ('pp000008', 'Soft Drink 500ml (Coca-Cola)',        'BEV-COK-001',  '6901030034567', 'cc000001-0000-0000-0000-000000000002', 'pcs',  28.00, 35.00, 38.00,  0.00, 'Coca-Cola carbonated drink 500ml',         1),
  ('pp000009', 'Drinking Water 1.5L (Mum)',           'BEV-WAT-001',  '6901030045678', 'cc000001-0000-0000-0000-000000000002', 'pcs',  18.00, 25.00, 28.00,  0.00, 'Mum purified drinking water 1.5L',         1),
  ('pp000010', 'Frooto Mango Juice 250ml',            'BEV-JUI-001',  '6901030056789', 'cc000001-0000-0000-0000-000000000002', 'pcs',  22.00, 28.00, 30.00,  0.00, 'Frooto mango fruit drink 250ml',           1),
  ('pp000011', 'Bombay Sweets Mix 200g',              'SNK-BSW-001',  '7901030012345', 'cc000001-0000-0000-0000-000000000003', 'pcs',  45.00, 55.00, 60.00,  0.00, 'Assorted Indian-style sweets mix',         1),
  ('pp000012', 'Potato Chips 100g (Pran)',            'SNK-CHI-001',  '7901030023456', 'cc000001-0000-0000-0000-000000000003', 'pcs',  30.00, 38.00, 40.00,  0.00, 'Pran crunchy potato chips 100g',           1),
  ('pp000013', 'Glucose Biscuit 200g (Tiger)',        'SNK-BIS-001',  '7901030034567', 'cc000001-0000-0000-0000-000000000003', 'pcs',  18.00, 25.00, 28.00,  0.00, 'Tiger glucose biscuits 200g',              1),
  ('pp000014', 'Cadbury Dairy Milk 45g',             'SNK-CHO-001',  '7901030045678', 'cc000001-0000-0000-0000-000000000003', 'pcs',  42.00, 50.00, 55.00,  0.00, 'Cadbury Dairy Milk chocolate bar',         1),
  ('pp000015', 'Pasteurized Milk 1L (Aarong)',        'DAI-MLK-001',  '8001030012345', 'cc000001-0000-0000-0000-000000000004', 'pcs',  70.00, 85.00, 90.00,  0.00, 'Aarong full-cream pasteurized milk',       1),
  ('pp000016', 'Butter 200g (Aarong)',                'DAI-BUT-001',  '8001030023456', 'cc000001-0000-0000-0000-000000000004', 'pcs', 130.00,155.00,165.00,  0.00, 'Aarong salted butter 200g',                1),
  ('pp000017', 'Yogurt 400g (Aarong)',                'DAI-YOG-001',  '8001030034567', 'cc000001-0000-0000-0000-000000000004', 'pcs',  55.00, 70.00, 75.00,  0.00, 'Aarong fresh natural yogurt 400g',         1),
  ('pp000018', 'Farm Fresh Eggs 12pcs',              'DAI-EGG-001',  '8001030045678', 'cc000001-0000-0000-0000-000000000004', 'pcs', 110.00,130.00,135.00,  0.00, 'Farm fresh eggs 12-piece pack',            1),
  ('pp000019', 'Shampoo 200ml (Clear)',               'PCS-SHP-001',  '9001030012345', 'cc000001-0000-0000-0000-000000000005', 'pcs', 120.00,145.00,155.00,  0.00, 'Clear anti-dandruff shampoo 200ml',        1),
  ('pp000020', 'Lux Soap 75g',                       'PCS-SOP-001',  '9001030023456', 'cc000001-0000-0000-0000-000000000005', 'pcs',  35.00, 45.00, 50.00,  0.00, 'Lux fragrant beauty soap 75g',             1),
  ('pp000021', 'Sensodyne Toothpaste 100g',          'PCS-TPT-001',  '9001030034567', 'cc000001-0000-0000-0000-000000000005', 'pcs', 130.00,155.00,160.00,  0.00, 'Sensodyne whitening toothpaste 100g',      1),
  ('pp000022', 'Sunscreen SPF50 50ml (Garnier)',      'PCS-SCR-001',  '9001030045678', 'cc000001-0000-0000-0000-000000000005', 'pcs', 250.00,295.00,320.00,  0.00, 'Garnier UV protect sunscreen SPF50',       1),
  ('pp000023', 'Washing Powder 500g (Wheel)',         'HLD-WSH-001',  '1001030012345', 'cc000001-0000-0000-0000-000000000006', 'pcs',  45.00, 58.00, 65.00,  0.00, 'Wheel blue washing powder 500g',           1),
  ('pp000024', 'Vim Dish Soap 500ml',                'HLD-DSH-001',  '1001030023456', 'cc000001-0000-0000-0000-000000000006', 'pcs',  65.00, 80.00, 85.00,  0.00, 'Vim liquid dishwashing soap 500ml',        1),
  ('pp000025', 'Dettol Floor Cleaner 500ml',         'HLD-FLR-001',  '1001030034567', 'cc000001-0000-0000-0000-000000000006', 'pcs',  90.00,110.00,120.00,  0.00, 'Dettol pine floor cleaner 500ml',          1);

-- ============================================================
-- Product Stock
-- ============================================================
INSERT IGNORE INTO product_stock (id, product_id, branch_id, quantity, min_stock_alert) VALUES
  (UUID(), 'pp000001', 'bb000001-0000-0000-0000-000000000001', 250.00, 50.00),
  (UUID(), 'pp000002', 'bb000001-0000-0000-0000-000000000001', 120.00, 20.00),
  (UUID(), 'pp000003', 'bb000001-0000-0000-0000-000000000001', 200.00, 30.00),
  (UUID(), 'pp000004', 'bb000001-0000-0000-0000-000000000001',  80.00, 15.00),
  (UUID(), 'pp000005', 'bb000001-0000-0000-0000-000000000001', 150.00, 25.00),
  (UUID(), 'pp000006', 'bb000001-0000-0000-0000-000000000001',  45.00, 10.00),
  (UUID(), 'pp000007', 'bb000001-0000-0000-0000-000000000001',  90.00, 20.00),
  (UUID(), 'pp000008', 'bb000001-0000-0000-0000-000000000001', 200.00, 40.00),
  (UUID(), 'pp000009', 'bb000001-0000-0000-0000-000000000001', 300.00, 50.00),
  (UUID(), 'pp000010', 'bb000001-0000-0000-0000-000000000001', 150.00, 30.00),
  (UUID(), 'pp000011', 'bb000001-0000-0000-0000-000000000001',  60.00, 15.00),
  (UUID(), 'pp000012', 'bb000001-0000-0000-0000-000000000001', 100.00, 20.00),
  (UUID(), 'pp000013', 'bb000001-0000-0000-0000-000000000001', 120.00, 25.00),
  (UUID(), 'pp000014', 'bb000001-0000-0000-0000-000000000001',  80.00, 15.00),
  (UUID(), 'pp000015', 'bb000001-0000-0000-0000-000000000001',  50.00, 10.00),
  (UUID(), 'pp000016', 'bb000001-0000-0000-0000-000000000001',  30.00,  8.00),
  (UUID(), 'pp000017', 'bb000001-0000-0000-0000-000000000001',  40.00, 10.00),
  (UUID(), 'pp000018', 'bb000001-0000-0000-0000-000000000001',  60.00, 12.00),
  (UUID(), 'pp000019', 'bb000001-0000-0000-0000-000000000001',  35.00,  8.00),
  (UUID(), 'pp000020', 'bb000001-0000-0000-0000-000000000001',  80.00, 20.00),
  (UUID(), 'pp000021', 'bb000001-0000-0000-0000-000000000001',  45.00, 10.00),
  (UUID(), 'pp000022', 'bb000001-0000-0000-0000-000000000001',  25.00,  5.00),
  (UUID(), 'pp000023', 'bb000001-0000-0000-0000-000000000001',  70.00, 15.00),
  (UUID(), 'pp000024', 'bb000001-0000-0000-0000-000000000001',  50.00, 10.00),
  (UUID(), 'pp000025', 'bb000001-0000-0000-0000-000000000001',  40.00, 10.00),
  -- Mirpur branch
  (UUID(), 'pp000001', 'bb000001-0000-0000-0000-000000000002', 180.00, 50.00),
  (UUID(), 'pp000002', 'bb000001-0000-0000-0000-000000000002',  90.00, 20.00),
  (UUID(), 'pp000006', 'bb000001-0000-0000-0000-000000000002',  30.00, 10.00),
  (UUID(), 'pp000015', 'bb000001-0000-0000-0000-000000000002',  40.00, 10.00),
  (UUID(), 'pp000018', 'bb000001-0000-0000-0000-000000000002',  50.00, 12.00);

-- ============================================================
-- Customers
-- ============================================================
INSERT IGNORE INTO customers (id, name, phone, email, address, loyalty_points) VALUES
  ('cust0001-0000-0000-0000-000000000001', 'Md. Rafiqul Islam', '+8801711111111', 'rafiq@email.com',  'House 5, Sector 4, Uttara, Dhaka', 250),
  ('cust0001-0000-0000-0000-000000000002', 'Fatema Begum',       '+8801711111112', 'fatema@email.com', 'Flat 3B, Block C, Mirpur-10, Dhaka', 180),
  ('cust0001-0000-0000-0000-000000000003', 'Karim Ahmed',        '+8801711111113', 'karim@email.com',  'Road 5, Bashundhara R/A, Dhaka', 420),
  ('cust0001-0000-0000-0000-000000000004', 'Sultana Akter',      '+8801711111114', NULL,               'Mohammadpur, Dhaka', 90),
  ('cust0001-0000-0000-0000-000000000005', 'Abdul Mannan',       '+8801711111115', NULL,               'Dhanmondi, Dhaka', 310);

-- ============================================================
-- Suppliers (actual schema: name, company, phone, email, address, balance)
-- ============================================================
INSERT IGNORE INTO suppliers (id, name, company, phone, email, address, balance) VALUES
  (UUID(), 'PRAN Trade',           'PRAN-RFL Group',     '+8801800100001', 'trade@pran.com',        'PRAN Industrial Park, Norsindhi', 0.00),
  (UUID(), 'Unilever Key Accounts','Unilever Bangladesh', '+8801800100002', 'trade@unilever.com.bd', 'Gulshan-1, Dhaka-1212',           0.00),
  (UUID(), 'Nestlé Trade',         'Nestlé Bangladesh',   '+8801800100003', 'trade@nestle.com.bd',   'Tejgaon, Dhaka-1208',             0.00),
  (UUID(), 'Aarong Distribution',  'BRAC Enterprises',    '+8801800100004', 'dairy@aarong.com',      'Mohakhali, Dhaka-1212',           0.00),
  (UUID(), 'City Group Sales',     'City Group',          '+8801800100005', 'rupchanda@city.com',    'Postagola, Dhaka-1203',           0.00);

-- ============================================================
-- Accounts (actual schema: name, type, account_number, bank_name, branch, branch_id, opening_balance, is_active)
-- ============================================================
INSERT IGNORE INTO accounts (id, name, type, opening_balance, is_active) VALUES
  ('acc00001-0000-0000-0000-000000000001', 'Cash in Hand',       'cash',    0.00, 1),
  ('acc00001-0000-0000-0000-000000000002', 'bKash Business',     'mobile',  0.00, 1),
  ('acc00001-0000-0000-0000-000000000003', 'Nagad Business',     'mobile',  0.00, 1),
  ('acc00001-0000-0000-0000-000000000004', 'Dutch Bangla Bank',  'bank',    0.00, 1),
  ('acc00001-0000-0000-0000-000000000005', 'Brac Bank',          'bank',    0.00, 1);

-- ============================================================
-- Sales
-- ============================================================
INSERT IGNORE INTO sales (id, invoice_number, customer_id, branch_id, cashier_id, subtotal, discount, tax, total, paid_amount, due_amount, payment_method, status) VALUES
  ('sale0001-0000-0000-0000-000000000001', 'INV-2026-0001', 'cust0001-0000-0000-0000-000000000001', 'bb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000003', 490.00, 0.00, 0.00, 490.00, 500.00, 0.00, 'cash',  'completed'),
  ('sale0001-0000-0000-0000-000000000002', 'INV-2026-0002', 'cust0001-0000-0000-0000-000000000002', 'bb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000003', 285.00,10.00, 0.00, 275.00, 275.00, 0.00, 'bkash', 'completed'),
  ('sale0001-0000-0000-0000-000000000003', 'INV-2026-0003', NULL,                                   'bb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000003', 173.00, 0.00, 0.00, 173.00, 200.00, 0.00, 'cash',  'completed');

-- Sale items (actual schema: id, sale_id, product_id, quantity, unit_price, discount, tax, total_price)
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, tax, total_price) VALUES
  (UUID(), 'sale0001-0000-0000-0000-000000000001', 'pp000001', 2.00,  65.00, 0.00, 0.00, 130.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000001', 'pp000002', 1.00, 160.00, 0.00, 0.00, 160.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000001', 'pp000015', 2.00,  85.00, 0.00, 0.00, 170.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000001', 'pp000020', 2.00,  15.00, 0.00, 0.00,  30.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000002', 'pp000006', 1.00, 380.00,10.00, 0.00, 370.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000002', 'pp000013', 2.00,  25.00, 0.00, 0.00,  50.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000003', 'pp000008', 2.00,  35.00, 0.00, 0.00,  70.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000003', 'pp000012', 1.00,  38.00, 0.00, 0.00,  38.00),
  (UUID(), 'sale0001-0000-0000-0000-000000000003', 'pp000007', 1.00,  85.00, 0.00, 0.00,  85.00);

-- ============================================================
-- Delivery Areas (actual: name, city, delivery_charge, estimated_time, is_active)
-- ============================================================
INSERT IGNORE INTO delivery_areas (id, name, city, delivery_charge, estimated_time, is_active) VALUES
  (UUID(), 'Uttara (All Sectors)',   'Dhaka', 50.00, '45-60 min', 1),
  (UUID(), 'Mirpur (Section 1-14)',  'Dhaka', 60.00, '60-90 min', 1),
  (UUID(), 'Bashundhara R/A',        'Dhaka', 60.00, '60-90 min', 1),
  (UUID(), 'Mohammadpur',            'Dhaka', 60.00, '60-90 min', 1),
  (UUID(), 'Dhanmondi',              'Dhaka', 70.00, '60-90 min', 1),
  (UUID(), 'Gulshan & Banani',       'Dhaka', 80.00, '60-90 min', 1),
  (UUID(), 'Rampura & Badda',        'Dhaka', 70.00, '60-90 min', 1),
  (UUID(), 'Tejgaon & Farmgate',     'Dhaka', 65.00, '60-90 min', 1);

-- ============================================================
-- Loyalty Rewards (actual: title, points_required, reward_type, reward_value, is_active)
-- ============================================================
INSERT IGNORE INTO loyalty_rewards (id, title, points_required, reward_type, reward_value, is_active) VALUES
  (UUID(), '৳50 Discount Voucher',  500,  'discount',  50.00, 1),
  (UUID(), '৳100 Discount Voucher', 1000, 'discount', 100.00, 1),
  (UUID(), '৳200 Discount Voucher', 2000, 'discount', 200.00, 1),
  (UUID(), 'Free Grocery Bag',       300, 'free_item',   0.00, 1);

-- ============================================================
-- Site Content (actual: key, title, content, data)
-- ============================================================
INSERT IGNORE INTO site_content (id, `key`, title, content) VALUES
  (UUID(), 'hero_title',    'Hero Title',     'Bazar Bari — আপনার পাড়ার সুপারশপ'),
  (UUID(), 'hero_subtitle', 'Hero Subtitle',  'তাজা মুদিখানা, মানসম্পন্ন পণ্য, দ্রুত ডেলিভারি'),
  (UUID(), 'phone',         'Contact Phone',  '+88 01800-000000'),
  (UUID(), 'email',         'Contact Email',  'hello@bazarbari.com'),
  (UUID(), 'address',       'Address',        'Sector 7, Uttara, Dhaka-1230'),
  (UUID(), 'delivery_hours','Delivery Hours', '8:00 AM – 10:00 PM'),
  (UUID(), 'tagline',       'Tagline',        'ঢাকায় ৬০ মিনিটে ডেলিভারি');

SELECT 'yesspos_db seed complete ✅' AS status;
