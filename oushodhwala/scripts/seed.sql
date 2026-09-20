-- ============================================================
-- OUSHODHWALA DATABASE SEED (schema-corrected)
-- Online Pharmacy Platform
-- ============================================================

USE oushodhwala_db;

-- ============================================================
-- Users (password: Admin@1234)
-- ============================================================
INSERT IGNORE INTO users (id, email, password_hash) VALUES
  ('ow000001-0000-0000-0000-000000000001', 'admin@oushodhwala.com',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu'),
  ('ow000001-0000-0000-0000-000000000002', 'pharmacist@oushodhwala.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu'),
  ('ow000001-0000-0000-0000-000000000003', 'support@oushodhwala.com',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu'),
  ('ow000001-0000-0000-0000-000000000004', 'customer@demo.com',          '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6Td.dkOOh3eJCRcOspvJu');

-- profiles (actual: id, phone, full_name, role, branch_id, avatar_url, is_active)
INSERT IGNORE INTO profiles (id, full_name, phone, role) VALUES
  ('ow000001-0000-0000-0000-000000000001', 'Super Admin',     '+8801700000001', 'super_admin'),
  ('ow000001-0000-0000-0000-000000000002', 'Head Pharmacist', '+8801700000002', 'pharmacist'),
  ('ow000001-0000-0000-0000-000000000003', 'Support Agent',   '+8801700000003', 'support_agent'),
  ('ow000001-0000-0000-0000-000000000004', 'Demo Customer',   '+8801700000099', 'customer');

-- user_roles (actual: id, user_id, role)
INSERT IGNORE INTO user_roles (id, user_id, role) VALUES
  (UUID(), 'ow000001-0000-0000-0000-000000000001', 'super_admin'),
  (UUID(), 'ow000001-0000-0000-0000-000000000002', 'pharmacist'),
  (UUID(), 'ow000001-0000-0000-0000-000000000003', 'support_agent'),
  (UUID(), 'ow000001-0000-0000-0000-000000000004', 'user');

-- ============================================================
-- Branches (actual: id, name, code, address, phone, is_active)
-- ============================================================
INSERT IGNORE INTO branches (id, name, code, address, phone, is_active) VALUES
  ('ow-br-001', 'Oushodhwala — Uttara Hub',    'OW-UTT', 'Sector 7, Uttara, Dhaka-1230',       '+8801800200001', 1),
  ('ow-br-002', 'Oushodhwala — Mirpur Depot',  'OW-MIR', 'Section 10, Mirpur, Dhaka-1216',     '+8801800200002', 1),
  ('ow-br-003', 'Oushodhwala — Dhanmondi Hub', 'OW-DHA', 'Road 8, Dhanmondi, Dhaka-1209',      '+8801800200003', 1);

-- ============================================================
-- Categories (actual: id, name, slug, icon, sort_order, is_active)
-- ============================================================
INSERT IGNORE INTO categories (id, name, slug, icon, sort_order, is_active) VALUES
  ('ow-cat-01', 'Antibiotics',                 'antibiotics',        'Pill',           1,  1),
  ('ow-cat-02', 'Cardiovascular',               'cardiovascular',     'Heart',          2,  1),
  ('ow-cat-03', 'Diabetes & Endocrine',         'diabetes',           'Activity',       3,  1),
  ('ow-cat-04', 'Gastrointestinal',             'gastrointestinal',   'Stethoscope',    4,  1),
  ('ow-cat-05', 'Pain Relief & Analgesics',     'pain-relief',        'Zap',            5,  1),
  ('ow-cat-06', 'Vitamins & Supplements',       'vitamins',           'Leaf',           6,  1),
  ('ow-cat-07', 'Respiratory & Allergy',        'respiratory',        'Wind',           7,  1),
  ('ow-cat-08', 'Skin & Dermatology',           'dermatology',        'Droplets',       8,  1),
  ('ow-cat-09', 'Eye, Ear & Dental',            'ent',                'Eye',            9,  1),
  ('ow-cat-10', 'Women''s Health',              'womens-health',      'HeartHandshake', 10, 1),
  ('ow-cat-11', 'Surgical & Medical Supplies',  'surgical',           'Syringe',        11, 1),
  ('ow-cat-12', 'Diagnostic Devices',           'diagnostic-devices', 'Microscope',     12, 1),
  ('ow-cat-13', 'Baby & Mother Care',           'baby-care',          'Baby',           13, 1),
  ('ow-cat-14', 'Herbal & Unani',               'herbal',             'Sprout',         14, 1);

-- ============================================================
-- Products (36 realistic medicines & devices)
-- ============================================================
INSERT IGNORE INTO products (id, name, generic_name, strength, dosage_form, manufacturer, category_id, unit_price, mrp, cost_price, stock, min_stock_alert, requires_prescription, description, is_active) VALUES
  ('ow-pro-001', 'Azithrocin 250',      'Azithromycin',          '250mg',    'Tablet',  'Square Pharmaceuticals',   'ow-cat-01', 15.00,  16.00,  10.00,  500, 50, 1, 'Azithromycin 250mg — bacterial infections, pneumonia', 1),
  ('ow-pro-002', 'Azithrocin 500',      'Azithromycin',          '500mg',    'Tablet',  'Square Pharmaceuticals',   'ow-cat-01', 25.00,  27.00,  18.00,  400, 50, 1, 'Azithromycin 500mg 3-day Z-pack course', 1),
  ('ow-pro-003', 'Amoxil 250',          'Amoxicillin',           '250mg',    'Capsule', 'Beximco Pharmaceuticals',  'ow-cat-01',  8.00,   9.00,   5.50,  600, 60, 1, 'Amoxicillin 250mg — broad spectrum antibiotic', 1),
  ('ow-pro-004', 'Ciproflox 500',       'Ciprofloxacin',         '500mg',    'Tablet',  'Incepta Pharmaceuticals',  'ow-cat-01', 12.00,  13.00,   8.00,  450, 50, 1, 'Ciprofloxacin 500mg — UTI, respiratory & GI infections', 1),
  ('ow-pro-005', 'Atrovas 10',          'Atorvastatin',          '10mg',     'Tablet',  'ACI Pharmaceuticals',      'ow-cat-02',  8.00,   9.00,   5.50,  800, 80, 1, 'Atorvastatin 10mg — cholesterol management', 1),
  ('ow-pro-006', 'Atrovas 20',          'Atorvastatin',          '20mg',     'Tablet',  'ACI Pharmaceuticals',      'ow-cat-02', 12.00,  13.00,   8.50,  700, 70, 1, 'Atorvastatin 20mg — high cholesterol', 1),
  ('ow-pro-007', 'Losacor 50',          'Losartan Potassium',    '50mg',     'Tablet',  'Square Pharmaceuticals',   'ow-cat-02', 10.00,  11.00,   7.00,  900, 90, 1, 'Losartan 50mg — hypertension (ARB)', 1),
  ('ow-pro-008', 'Amlodil 5',           'Amlodipine',            '5mg',      'Tablet',  'Incepta Pharmaceuticals',  'ow-cat-02',  6.00,   7.00,   4.00, 1000,100, 1, 'Amlodipine 5mg — hypertension and angina', 1),
  ('ow-pro-009', 'Metformin 500',       'Metformin HCl',         '500mg',    'Tablet',  'Beximco Pharmaceuticals',  'ow-cat-03',  4.00,   5.00,   2.50, 1200,120, 1, 'Metformin 500mg — type 2 diabetes first-line', 1),
  ('ow-pro-010', 'Glucovance',          'Metformin+Glibenclamide','500/5mg', 'Tablet',  'Square Pharmaceuticals',   'ow-cat-03',  8.00,   9.00,   5.50,  600, 60, 1, 'Combination tablet for uncontrolled T2DM', 1),
  ('ow-pro-011', 'Gliboral 5',          'Glibenclamide',         '5mg',      'Tablet',  'ACI Pharmaceuticals',      'ow-cat-03',  3.00,   4.00,   2.00,  800, 80, 1, 'Glibenclamide 5mg — sulfonylurea for T2DM', 1),
  ('ow-pro-012', 'Omepral 20',          'Omeprazole',            '20mg',     'Capsule', 'Square Pharmaceuticals',   'ow-cat-04',  5.00,   6.00,   3.50, 1500,150, 1, 'Omeprazole 20mg — PPI for acid reflux, ulcer', 1),
  ('ow-pro-013', 'Antacid Plus',        'Aluminium Hydroxide',   '200mg',    'Tablet',  'Renata Limited',           'ow-cat-04',  2.00,   3.00,   1.20, 2000,200, 0, 'Antacid for heartburn and indigestion', 1),
  ('ow-pro-014', 'Dompy 10',            'Domperidone',           '10mg',     'Tablet',  'ACI Pharmaceuticals',      'ow-cat-04',  4.00,   5.00,   2.50, 1000,100, 1, 'Domperidone 10mg — nausea & vomiting', 1),
  ('ow-pro-015', 'Napa 500',            'Paracetamol',           '500mg',    'Tablet',  'Beximco Pharmaceuticals',  'ow-cat-05',  1.50,   2.00,   0.90, 5000,500, 0, 'Paracetamol 500mg — fever & mild pain relief', 1),
  ('ow-pro-016', 'Napa Extra',          'Paracetamol+Caffeine',  '500/65mg', 'Tablet',  'Beximco Pharmaceuticals',  'ow-cat-05',  2.50,   3.00,   1.50, 3000,300, 0, 'Paracetamol+Caffeine — headache & migraine', 1),
  ('ow-pro-017', 'Ibufen 400',          'Ibuprofen',             '400mg',    'Tablet',  'Incepta Pharmaceuticals',  'ow-cat-05',  4.00,   5.00,   2.50, 2000,200, 0, 'Ibuprofen 400mg — NSAID pain & fever', 1),
  ('ow-pro-018', 'Voltalin Gel 30g',    'Diclofenac Sodium',     '1%',       'Gel',     'Renata Limited',           'ow-cat-05', 90.00, 100.00,  65.00,  300, 30, 0, 'Diclofenac gel — topical muscle & joint pain', 1),
  ('ow-pro-019', 'Vitamin C 500mg',     'Ascorbic Acid',         '500mg',    'Tablet',  'ACI Pharmaceuticals',      'ow-cat-06',  3.00,   4.00,   1.80, 3000,300, 0, 'Vitamin C 500mg — immunity boost', 1),
  ('ow-pro-020', 'Vitamin D3 1000IU',   'Cholecalciferol',       '1000IU',   'Capsule', 'Square Pharmaceuticals',   'ow-cat-06',  8.00,  10.00,   5.00, 1500,150, 0, 'Vitamin D3 1000IU — bone health & immunity', 1),
  ('ow-pro-021', 'Calcium Plus',        'Calcium Carbonate',     '500mg',    'Tablet',  'Renata Limited',           'ow-cat-06',  5.00,   6.00,   3.00, 2000,200, 0, 'Calcium 500mg + D3 for bone strength', 1),
  ('ow-pro-022', 'Zincovit',            'Multivitamin+Zinc',     'Standard', 'Tablet',  'ACI Pharmaceuticals',      'ow-cat-06',  6.00,   8.00,   4.00, 1800,180, 0, 'Multivitamin & Zinc — general wellness', 1),
  ('ow-pro-023', 'Omega-3 Fish Oil 1000mg','Omega-3 Fatty Acids','1000mg',   'Softgel', 'Imported (USA)',            'ow-cat-06', 18.00,  22.00,  12.00,  800, 80, 0, 'Omega-3 fish oil for heart & brain health', 1),
  ('ow-pro-024', 'Fexo 120',            'Fexofenadine',          '120mg',    'Tablet',  'Beximco Pharmaceuticals',  'ow-cat-07', 10.00,  12.00,   7.00,  900, 90, 0, 'Fexofenadine 120mg — non-drowsy antihistamine', 1),
  ('ow-pro-025', 'Montek 10',           'Montelukast',           '10mg',     'Tablet',  'ACI Pharmaceuticals',      'ow-cat-07', 15.00,  17.00,  10.00,  700, 70, 1, 'Montelukast 10mg — asthma & allergic rhinitis', 1),
  ('ow-pro-026', 'Salbutamol Inhaler',  'Salbutamol',            '100mcg',   'Inhaler', 'GlaxoSmithKline BD',       'ow-cat-07',180.00, 200.00, 130.00,  300, 30, 1, 'Ventolin salbutamol inhaler 200 doses', 1),
  ('ow-pro-027', 'Ambrox 30',           'Ambroxol HCl',          '30mg',     'Tablet',  'Square Pharmaceuticals',   'ow-cat-07',  4.00,   5.00,   2.50, 1500,150, 0, 'Ambroxol 30mg — mucolytic for productive cough', 1),
  ('ow-pro-028', 'Betnovate Cream',     'Betamethasone',         '0.1%',     'Cream',   'GlaxoSmithKline BD',       'ow-cat-08', 60.00,  70.00,  42.00,  400, 40, 1, 'Betamethasone 0.1% cream — eczema, dermatitis', 1),
  ('ow-pro-029', 'Clotrimazole Cream',  'Clotrimazole',          '1%',       'Cream',   'Renata Limited',           'ow-cat-08', 45.00,  50.00,  30.00,  500, 50, 0, 'Antifungal cream for ringworm, athlete''s foot', 1),
  ('ow-pro-030', 'Accu-Chek Glucometer','Blood Glucose Monitor', 'Standard', 'Device',  'Roche Diagnostics',        'ow-cat-12',1200.00,1400.00, 900.00,  50,  5, 0, 'Accu-Chek blood glucose monitoring kit', 1),
  ('ow-pro-031', 'Omron BP Monitor',    'Sphygmomanometer',      'Standard', 'Device',  'Omron',                    'ow-cat-12',2500.00,2800.00,1900.00,  30,  5, 0, 'Omron automatic upper arm blood pressure monitor', 1),
  ('ow-pro-032', 'Pulse Oximeter',      'SpO2 Monitor',          'Standard', 'Device',  'Contec Medical',           'ow-cat-12', 800.00, 950.00, 600.00,  60, 10, 0, 'Finger pulse oximeter for SpO2 & heart rate', 1),
  ('ow-pro-033', 'Digital Thermometer', 'Clinical Thermometer',  'Standard', 'Device',  'Beurer',                   'ow-cat-12', 350.00, 400.00, 250.00, 100, 15, 0, 'Digital clinical thermometer with fever alert', 1),
  ('ow-pro-034', 'Glucometer Strips 50','Test Strips',           'Standard', 'Strip',   'Roche Diagnostics',        'ow-cat-12', 550.00, 600.00, 400.00, 200, 20, 0, 'Accu-Chek Instant test strips 50-piece pack', 1),
  ('ow-pro-035', 'Saline Nasal Drops',  'Normal Saline',         '0.9%',     'Drops',   'Incepta Pharmaceuticals',  'ow-cat-13',  45.00,  50.00,  30.00, 600, 60, 0, 'Saline drops for infants — nasal congestion', 1),
  ('ow-pro-036', 'Baby Paracetamol Syrup','Paracetamol',         '120mg/5ml','Syrup',   'ACI Pharmaceuticals',      'ow-cat-13',  30.00,  35.00,  20.00, 800, 80, 0, 'Paracetamol syrup 60ml for infants & children', 1);

-- ============================================================
-- Generic Info
-- ============================================================
INSERT IGNORE INTO generic_info (id, generic_name, indication, dosage) VALUES
  (UUID(), 'Azithromycin',       'Macrolide Antibiotic — broad-spectrum against Gram-positive bacteria', 'As prescribed'),
  (UUID(), 'Atorvastatin',       'HMG-CoA Reductase Inhibitor — reduces LDL cholesterol', 'As prescribed'),
  (UUID(), 'Metformin HCl',      'Biguanide Antidiabetic — first-line T2DM treatment', 'As prescribed'),
  (UUID(), 'Omeprazole',         'Proton Pump Inhibitor — peptic ulcers and GERD', 'As prescribed'),
  (UUID(), 'Paracetamol',        'Analgesic/Antipyretic — pain and fever', 'As prescribed'),
  (UUID(), 'Ibuprofen',          'NSAID — pain and inflammation', 'As prescribed'),
  (UUID(), 'Fexofenadine',       'Antihistamine (H1-blocker) — allergic rhinitis', 'As prescribed'),
  (UUID(), 'Montelukast',        'Leukotriene Receptor Antagonist — asthma', 'As prescribed'),
  (UUID(), 'Salbutamol',         'Beta-2 Agonist Bronchodilator — acute asthma', 'As prescribed'),
  (UUID(), 'Losartan Potassium', 'Angiotensin II Receptor Blocker — hypertension', 'As prescribed'),
  (UUID(), 'Amlodipine',         'Calcium Channel Blocker — hypertension and angina', 'As prescribed');

-- ============================================================
-- Doctors
-- ============================================================
INSERT IGNORE INTO doctors (id, name, specialty, degrees, hospital, consultation_fee, available_days, rating, is_active) VALUES
  ('ow-doc-001', 'Dr. Md. Anisur Rahman',  'Internal Medicine',        'MBBS, MD (Medicine), FCPS',       'Dhaka Medical College Hospital',    600.00, '["Sat","Mon","Wed"]', 4.8, 1),
  ('ow-doc-002', 'Dr. Farhana Islam',       'Cardiology',               'MBBS, MD (Cardiology), FRCP',     'National Heart Foundation',         1000.00,'["Sun","Tue","Thu"]', 4.9, 1),
  ('ow-doc-003', 'Dr. Nazrul Hossain',      'Endocrinology & Diabetes', 'MBBS, MD, FRCP (Edin)',           'BIRDEM General Hospital',            800.00,'["Sat","Sun","Tue"]', 4.7, 1),
  ('ow-doc-004', 'Dr. Shamima Akter',       'Gastroenterology',         'MBBS, MD (Gastro), FCPS',         'Square Hospital',                    750.00,'["Mon","Wed","Fri"]', 4.8, 1),
  ('ow-doc-005', 'Dr. Rezaul Karim',        'Pulmonology & Allergy',    'MBBS, MD (Chest), FCPS',          'Chest Disease Hospital',             600.00,'["Sat","Mon","Thu"]', 4.6, 1),
  ('ow-doc-006', 'Dr. Tania Sultana',       'Dermatology',              'MBBS, DDV (Dermatology), FCPS',   'Bangabandhu Sheikh Mujib Med Univ',  700.00,'["Sun","Tue","Fri"]', 4.7, 1),
  ('ow-doc-007', 'Dr. Mamunur Rashid',      'Orthopedics',              'MBBS, MS (Orthopedics)',          'Rajshahi Medical College Hospital',  650.00,'["Mon","Wed","Sat"]', 4.5, 1),
  ('ow-doc-008', 'Dr. Parveen Akter',       'Gynecology & Obstetrics',  'MBBS, FCPS (Gynae), DGO',         'Evercare Hospital Dhaka',            900.00,'["Sun","Tue","Thu"]', 4.9, 1),
  ('ow-doc-009', 'Dr. Aminul Islam',        'Pediatrics',               'MBBS, DCH, FCPS (Pediatrics)',    'Dhaka Shishu Hospital',              550.00,'["Sat","Mon","Wed"]', 4.8, 1),
  ('ow-doc-010', 'Dr. Taslima Khanam',      'Neurology',                'MBBS, MD (Neurology), FRCP',      'National Institute of Neurosciences',850.00,'["Sun","Wed","Fri"]', 4.7, 1);

-- ============================================================
-- Lab Tests
-- ============================================================
INSERT IGNORE INTO lab_tests (id, name, category, price, turnaround_time, description, is_active) VALUES
  ('ow-lab-001', 'Complete Blood Count (CBC)',           'Hematology',   350.00, '6 hours',   'Full blood count — WBC, RBC, Hgb, Hct, Platelets', 1),
  ('ow-lab-002', 'Fasting Blood Sugar (FBS)',            'Biochemistry', 150.00, '3 hours',   'Fasting glucose — diabetes screening', 1),
  ('ow-lab-003', 'HbA1c (Glycated Hemoglobin)',          'Biochemistry', 800.00, '6 hours',   '3-month average blood sugar control', 1),
  ('ow-lab-004', 'Lipid Profile',                        'Biochemistry', 600.00, '6 hours',   'Total cholesterol, LDL, HDL, Triglycerides', 1),
  ('ow-lab-005', 'Liver Function Test (LFT)',            'Biochemistry', 700.00, '6 hours',   'AST, ALT, ALP, Bilirubin, Albumin', 1),
  ('ow-lab-006', 'Kidney Function Test (KFT)',           'Biochemistry', 650.00, '6 hours',   'Creatinine, BUN, Uric Acid, eGFR', 1),
  ('ow-lab-007', 'Thyroid Function Test (TFT)',          'Endocrinology',900.00, '12 hours',  'TSH, Free T3, Free T4', 1),
  ('ow-lab-008', 'Urine R/E & C/S',                     'Microbiology', 300.00, '24 hours',  'Routine urine examination with culture', 1),
  ('ow-lab-009', 'COVID-19 Antigen Rapid Test',          'Virology',     600.00, '30 min',    'SARS-CoV-2 rapid antigen detection', 1),
  ('ow-lab-010', 'Dengue NS1 Antigen',                   'Serology',     700.00, '3 hours',   'Dengue fever rapid antigen detection', 1),
  ('ow-lab-011', 'Hepatitis B Surface Antigen (HBsAg)', 'Serology',     400.00, '3 hours',   'Hepatitis B surface antigen screening', 1),
  ('ow-lab-012', 'Vitamin D (25-OH)',                    'Biochemistry',1200.00, '24 hours',  'Vitamin D3 level — bone health assessment', 1),
  ('ow-lab-013', 'Iron Studies (Serum Ferritin)',        'Biochemistry', 800.00, '6 hours',   'Ferritin, Serum Iron, TIBC', 1),
  ('ow-lab-014', 'ECG (Electrocardiogram)',              'Cardiology',   250.00, 'Immediate', '12-lead ECG for heart rhythm assessment', 1),
  ('ow-lab-015', 'Blood Pressure Monitoring (ABPM)',     'Cardiology',  2500.00, '24 hours',  'Ambulatory 24-hour blood pressure monitoring', 1);

-- ============================================================
-- Stock Batches (actual: id, product_id, batch_number, expiry_date, quantity, cost_price, branch_id)
-- ============================================================
INSERT IGNORE INTO stock_batches (id, product_id, branch_id, batch_number, quantity, expiry_date, cost_price) VALUES
  (UUID(), 'ow-pro-001', 'ow-br-001', 'AZI-2026-001', 200, '2028-06-30', 10.00),
  (UUID(), 'ow-pro-003', 'ow-br-001', 'AMX-2026-001', 300, '2027-12-31',  5.50),
  (UUID(), 'ow-pro-005', 'ow-br-001', 'ATR-2026-001', 400, '2028-03-31',  5.50),
  (UUID(), 'ow-pro-009', 'ow-br-001', 'MET-2026-001', 600, '2027-09-30',  2.50),
  (UUID(), 'ow-pro-012', 'ow-br-001', 'OMP-2026-001', 500, '2027-06-30',  3.50),
  (UUID(), 'ow-pro-015', 'ow-br-001', 'PAR-2026-001',2000, '2027-12-31',  0.90),
  (UUID(), 'ow-pro-017', 'ow-br-001', 'IBU-2026-001',1000, '2027-09-30',  2.50),
  (UUID(), 'ow-pro-019', 'ow-br-001', 'VTC-2026-001',1500, '2028-06-30',  1.80),
  (UUID(), 'ow-pro-020', 'ow-br-001', 'VTD-2026-001', 800, '2028-03-31',  5.00),
  (UUID(), 'ow-pro-024', 'ow-br-001', 'FEX-2026-001', 500, '2027-12-31',  7.00),
  (UUID(), 'ow-pro-026', 'ow-br-001', 'SAL-2026-001', 150, '2027-06-30',130.00),
  (UUID(), 'ow-pro-030', 'ow-br-001', 'GLU-2026-001',  25, '2029-01-31',900.00),
  (UUID(), 'ow-pro-031', 'ow-br-001', 'BPM-2026-001',  15, '2030-01-31',1900.00),
  (UUID(), 'ow-pro-032', 'ow-br-001', 'POX-2026-001',  30, '2030-01-31',600.00),
  (UUID(), 'ow-pro-034', 'ow-br-001', 'GLS-2026-001', 100, '2027-09-30',400.00);

-- ============================================================
-- Sample Orders
-- ============================================================
INSERT IGNORE INTO orders (id, order_number, customer_id, customer_name, customer_phone, delivery_address, subtotal, discount, delivery_fee, total, status, payment_method, payment_status, branch_id, tracking_token) VALUES
  ('ow-ord-001', 'OW-2026-0001', 'ow000001-0000-0000-0000-000000000004', 'Demo Customer', '+8801700000099',
   'House 5, Road 3, Dhanmondi, Dhaka-1205', 71.50, 0.00, 60.00, 131.50, 'delivered', 'bkash', 'paid', 'ow-br-001', 'TRK-OW-ABC001'),
  ('ow-ord-002', 'OW-2026-0002', 'ow000001-0000-0000-0000-000000000004', 'Demo Customer', '+8801700000099',
   'House 5, Road 3, Dhanmondi, Dhaka-1205', 240.00, 0.00, 60.00, 300.00, 'processing', 'cod', 'unpaid', 'ow-br-001', 'TRK-OW-ABC002');

-- order_items (actual: id, order_id, product_id, quantity, unit_price, total_price)
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
  (UUID(), 'ow-ord-001', 'ow-pro-015', 10, 1.50,  15.00),
  (UUID(), 'ow-ord-001', 'ow-pro-016', 10, 2.50,  25.00),
  (UUID(), 'ow-ord-001', 'ow-pro-019',  5, 3.00,  15.00),
  (UUID(), 'ow-ord-001', 'ow-pro-021',  3, 5.50,  16.50),
  (UUID(), 'ow-ord-002', 'ow-pro-005', 30, 8.00, 240.00);

-- ============================================================
-- Chart of Accounts (actual: id, name, code, type, balance)
-- ============================================================
INSERT IGNORE INTO chart_accounts (id, name, code, type, balance) VALUES
  ('ow-coa-001', 'Cash & Bank',               '1100', 'asset',     0.00),
  ('ow-coa-002', 'Accounts Receivable',        '1200', 'asset',     0.00),
  ('ow-coa-003', 'Inventory',                  '1300', 'asset',     0.00),
  ('ow-coa-004', 'Accounts Payable',           '2100', 'liability', 0.00),
  ('ow-coa-005', 'Sales Revenue',              '3100', 'revenue',   0.00),
  ('ow-coa-006', 'Delivery Revenue',           '3200', 'revenue',   0.00),
  ('ow-coa-007', 'Cost of Goods Sold',         '4000', 'expense',   0.00),
  ('ow-coa-008', 'Staff Salaries',             '5100', 'expense',   0.00),
  ('ow-coa-009', 'Delivery Expenses',          '5200', 'expense',   0.00),
  ('ow-coa-010', 'Rent & Utilities',           '5300', 'expense',   0.00),
  ('ow-coa-011', 'Marketing & Advertising',    '5400', 'expense',   0.00);

SELECT 'oushodhwala_db seed complete ✅' AS status;
