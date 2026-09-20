-- ============================================================
-- YESSBGD DATABASE SEED
-- Corporate Portal for YESS Bangla Private Limited
-- ============================================================

USE yessbgd_db;

-- Admin user (password: Admin@1234)
-- bcrypt hash generated for 'Admin@1234' (verified with bcryptjs)
INSERT INTO users (id, email, password_hash) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@yessbangla.com', '$2b$12$7wuR94/HZJBkgPx0CA9Jf.A9yyJ92UO0ZyhhfuD0j4O8g/6v3Zdhq'),
  ('550e8400-e29b-41d4-a716-446655440002', 'content@yessbangla.com', '$2b$12$7wuR94/HZJBkgPx0CA9Jf.A9yyJ92UO0ZyhhfuD0j4O8g/6v3Zdhq'),
  ('550e8400-e29b-41d4-a716-446655440003', 'hr@yessbangla.com', '$2b$12$7wuR94/HZJBkgPx0CA9Jf.A9yyJ92UO0ZyhhfuD0j4O8g/6v3Zdhq')
ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);

-- Profiles
INSERT INTO profiles (id, full_name, phone, job_title, language, theme) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Super Admin', '+8801700000001', 'Chief Technology Officer', 'en', 'light'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Content Manager', '+8801700000002', 'Content Lead', 'en', 'light'),
  ('550e8400-e29b-41d4-a716-446655440003', 'HR Manager', '+8801700000003', 'HR Lead', 'en', 'light')
ON DUPLICATE KEY UPDATE full_name=full_name;

-- Roles
INSERT INTO user_roles (id, user_id, role) VALUES
  (UUID(), '550e8400-e29b-41d4-a716-446655440001', 'admin'),
  (UUID(), '550e8400-e29b-41d4-a716-446655440002', 'moderator'),
  (UUID(), '550e8400-e29b-41d4-a716-446655440003', 'moderator')
ON DUPLICATE KEY UPDATE role=VALUES(role);

-- ============================================================
-- CMS Site Pages (key pages pre-populated)
-- ============================================================
INSERT INTO cms_site_pages (id, page, path, name, name_bn, seo_title, seo_description, is_published) VALUES
  (UUID(), 'home', '/', 'Home', 'হোম',
   'YESS Bangla — Technology Conglomerate Bangladesh', 'YESS Bangla Private Limited | ইয়েস বাংলা', 1),

  (UUID(), 'about', '/about', 'About Us', 'আমাদের সম্পর্কে',
   'About YESS Bangla | Technology Company Bangladesh', 'Learn about YESS Bangla Private Limited — our mission, vision, and team.', 1),

  (UUID(), 'contact', '/contact', 'Contact Us', 'যোগাযোগ',
   'Contact YESS Bangla | Corporate Inquiries', 'Contact YESS Bangla Private Limited for business inquiries, partnerships, and support.', 1),

  (UUID(), 'careers', '/careers', 'Careers', 'ক্যারিয়ার',
   'Careers at YESS Bangla | Join Our Tech Team', 'Explore career opportunities at YESS Bangla — engineers, designers, marketers, and more.', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);
-- Hero copy intentionally omitted: public UI uses src/i18n (legacy defaults).
-- Editors can fill hero_* via the CMS dashboard when ready.

-- ============================================================
-- CMS Ventures (Sister Concerns)
-- NOTE: Public homepage catalog comes from src/data/ventures.ts.
-- These rows are seeded unpublished so incomplete CMS data cannot
-- override the legacy bundled venture lineup (no hero images yet).
-- ============================================================
INSERT INTO cms_ventures (id, slug, name, name_bn, tag, tag_bn, category, status, summary, summary_bn, sort_order, is_featured, is_published) VALUES
  (UUID(), 'bazarbari', 'Bazar Bari', 'বাজার বাড়ি', 'Retail & E-Commerce', 'খুচরা ও ই-কমার্স', 'retail', 'active',
   'Bangladesh''s growing neighborhood convenience store chain powered by our proprietary POS system (YessPOS).',
   'আমাদের নিজস্ব POS সিস্টেম দ্বারা পরিচালিত বাংলাদেশের বর্ধনশীল পাড়ার সুপারশপ চেইন।', 1, 1, 0),

  (UUID(), 'oushodhwala', 'Oushodhwala', 'ঔষধওয়ালা', 'Online Pharmacy', 'অনলাইন ফার্মেসি', 'health', 'active',
   'DGDA-licensed online pharmacy delivering authentic medicines and healthcare products nationwide.',
   'সারাদেশে খাঁটি ওষুধ ও স্বাস্থ্যসেবা পণ্য ডেলিভারিকারী DGDA-লাইসেন্সপ্রাপ্ত অনলাইন ফার্মেসি।', 2, 1, 0),

  (UUID(), 'shondhaan', 'Shondhaan', 'সন্ধান', 'B2B Marketplace', 'বি২বি মার্কেটপ্লেস', 'tech', 'active',
   'A B2B sourcing and supply chain platform connecting manufacturers, wholesalers, and retailers across Bangladesh.',
   'বাংলাদেশ জুড়ে প্রস্তুতকারক, পাইকারি বিক্রেতা এবং খুচরা বিক্রেতাদের সংযুক্তকারী একটি বি২বি সোর্সিং ও সাপ্লাই চেইন প্ল্যাটফর্ম।', 3, 1, 0),

  (UUID(), 'yesstech', 'YESS Tech', 'ইয়েস টেক', 'Software Development', 'সফটওয়্যার ডেভেলপমেন্ট', 'tech', 'active',
   'Our in-house software wing building enterprise ERP, POS, e-commerce, and fintech solutions.',
   'আমাদের ইন-হাউস সফটওয়্যার বিভাগ যা এন্টারপ্রাইজ ERP, POS, ই-কমার্স এবং ফিনটেক সমাধান তৈরি করে।', 4, 0, 0),

  (UUID(), 'yesslogistics', 'YESS Logistics', 'ইয়েস লজিস্টিক্স', 'Last-Mile Delivery', 'লাস্ট-মাইল ডেলিভারি', 'logistics', 'active',
   'Last-mile delivery infrastructure serving our own brands and third-party e-commerce businesses in Dhaka and beyond.',
   'ঢাকা এবং তার বাইরে আমাদের নিজস্ব ব্র্যান্ড এবং তৃতীয় পক্ষের ই-কমার্স ব্যবসার সেবায় লাস্ট-মাইল ডেলিভারি অবকাঠামো।', 5, 0, 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), is_published=VALUES(is_published);

-- ============================================================
-- CMS Services
-- Unpublished until curated to match src/data/services.ts slugs.
-- ============================================================
INSERT INTO cms_services (id, slug, name, name_bn, summary, summary_bn, icon, sort_order, is_published) VALUES
  (UUID(), 'pos-systems', 'POS & Retail Technology', 'পিওএস ও রিটেইল প্রযুক্তি',
   'End-to-end point-of-sale solutions for retail shops, pharmacies, and supermarkets with inventory, billing, and reporting.',
   'ইনভেন্টরি, বিলিং এবং রিপোর্টিং সহ খুচরা দোকান, ফার্মেসি এবং সুপারমার্কেটের জন্য এন্ড-টু-এন্ড পয়েন্ট-অফ-সেল সমাধান।',
   'ShoppingCart', 1, 0),

  (UUID(), 'ecommerce-platform', 'E-Commerce Platform', 'ই-কমার্স প্ল্যাটফর্ম',
   'Custom e-commerce storefronts with multi-vendor support, mobile apps, payment gateways (bKash, Nagad, Card), and logistics integration.',
   'মাল্টি-ভেন্ডর সমর্থন, মোবাইল অ্যাপ, পেমেন্ট গেটওয়ে (বিকাশ, নগদ, কার্ড) এবং লজিস্টিক্স ইন্টিগ্রেশন সহ কাস্টম ই-কমার্স স্টোরফ্রন্ট।',
   'Store', 2, 0),

  (UUID(), 'erp-solutions', 'Enterprise ERP', 'এন্টারপ্রাইজ ERP',
   'Modular ERP covering HR, payroll, accounting, supply chain, and operations for mid to large enterprises.',
   'মধ্যম থেকে বড় উদ্যোগের জন্য HR, পে-রোল, অ্যাকাউন্টিং, সাপ্লাই চেইন এবং অপারেশন কভার করে মডুলার ERP।',
   'BarChart', 3, 0),

  (UUID(), 'digital-health', 'Digital Health Solutions', 'ডিজিটাল স্বাস্থ্যসেবা সমাধান',
   'Online pharmacy management, prescription processing, doctor consultation booking, and diagnostic home service platforms.',
   'অনলাইন ফার্মেসি ম্যানেজমেন্ট, প্রেসক্রিপশন প্রসেসিং, ডাক্তার পরামর্শ বুকিং এবং ডায়াগনস্টিক হোম সার্ভিস প্ল্যাটফর্ম।',
   'Stethoscope', 4, 0),

  (UUID(), 'logistics-tech', 'Logistics & Delivery Tech', 'লজিস্টিক্স ও ডেলিভারি টেক',
   'Rider management, route optimization, real-time tracking, and delivery dispatch systems for e-commerce and retail operations.',
   'ই-কমার্স এবং খুচরা অপারেশনের জন্য রাইডার ম্যানেজমেন্ট, রুট অপটিমাইজেশন, রিয়েল-টাইম ট্র্যাকিং এবং ডেলিভারি ডিসপ্যাচ সিস্টেম।',
   'Truck', 5, 0),

  (UUID(), 'fintech-payments', 'Fintech & Payments', 'ফিনটেক ও পেমেন্ট',
   'Payment gateway integration, loyalty programs, digital wallets, and mobile financial service (MFS) connectivity for Bangladeshi businesses.',
   'বাংলাদেশি ব্যবসার জন্য পেমেন্ট গেটওয়ে ইন্টিগ্রেশন, লয়্যালটি প্রোগ্রাম, ডিজিটাল ওয়ালেট এবং মোবাইল ফিনান্সিয়াল সার্ভিস (MFS) সংযোগ।',
   'CreditCard', 6, 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), is_published=VALUES(is_published);

-- ============================================================
-- CMS Insights (Blog Posts)
-- ============================================================
INSERT INTO cms_insights (id, slug, title, title_bn, category, excerpt, excerpt_bn, author, read_time, is_published) VALUES
  (UUID(), 'rise-of-digital-commerce-bangladesh-2026',
   'The Rise of Digital Commerce in Bangladesh: 2026 Outlook',
   'বাংলাদেশে ডিজিটাল কমার্সের উত্থান: ২০২৬ দৃষ্টিভঙ্গি',
   'Strategy',
   'Bangladesh''s e-commerce sector crossed $3 billion in 2025. Here''s how technology conglomerates like YESS Bangla are positioning themselves for the next wave.',
   'বাংলাদেশের ই-কমার্স খাত ২০২৫ সালে $৩ বিলিয়ন অতিক্রম করেছে। ইয়েস বাংলার মতো প্রযুক্তি সমষ্টিগুলো কীভাবে পরবর্তী তরঙ্গের জন্য নিজেদের প্রস্তুত করছে।',
   'YESS Editorial Team', '6 min read', 1),

  (UUID(), 'pharmacy-digital-transformation-bangladesh',
   'Digitizing Pharmacy: How Oushodhwala Is Changing Healthcare Access',
   'ফার্মেসি ডিজিটাইজিং: ঔষধওয়ালা কীভাবে স্বাস্থ্যসেবার অ্যাক্সেস পরিবর্তন করছে',
   'Health Tech',
   'From prescription uploads to 30-minute deliveries, Oushodhwala is redefining how Bangladeshis buy medicine. A look at the technology behind the platform.',
   'প্রেসক্রিপশন আপলোড থেকে ৩০ মিনিটের ডেলিভারি পর্যন্ত, ঔষধওয়ালা বাংলাদেশিদের ওষুধ কেনার পদ্ধতি পুনর্নির্ধারণ করছে।',
   'Tech Team', '5 min read', 1),

  (UUID(), 'modern-pos-retail-bangladesh-2026',
   'Why Modern POS Systems Are the Backbone of Retail in Bangladesh',
   'কেন আধুনিক POS সিস্টেম বাংলাদেশের খুচরা বাণিজ্যের মেরুদণ্ড',
   'Retail Tech',
   'YessPOS processes thousands of transactions daily across Bazar Bari outlets. We explore what makes a great retail technology stack in the Bangladeshi context.',
   'YessPOS প্রতিদিন বাজার বাড়ি আউটলেটগুলিতে হাজার হাজার লেনদেন প্রক্রিয়া করে। আমরা বাংলাদেশের প্রেক্ষাপটে একটি দুর্দান্ত রিটেইল প্রযুক্তি স্ট্যাক কী তৈরি করে তা অন্বেষণ করি।',
   'YessTech Team', '7 min read', 1),

  (UUID(), 'logistics-last-mile-dhaka',
   'Cracking Last-Mile Delivery in Dhaka: Lessons from YESS Logistics',
   'ঢাকায় লাস্ট-মাইল ডেলিভারি সমাধান: ইয়েস লজিস্টিক্স থেকে শিক্ষা',
   'Logistics',
   'Dhaka''s traffic is notorious. Here''s how YESS Logistics uses route optimization, zone clustering, and rider incentive models to deliver on time.',
   'ঢাকার ট্রাফিক কুখ্যাত। ইয়েস লজিস্টিক্স কীভাবে রুট অপ্টিমাইজেশন, জোন ক্লাস্টারিং এবং রাইডার ইনসেনটিভ মডেল ব্যবহার করে সময়মতো ডেলিভারি দেয়।',
   'Operations Team', '8 min read', 1)
ON DUPLICATE KEY UPDATE slug=slug;

-- ============================================================
-- CMS Settings (value is JSON — store strings as JSON strings)
-- ============================================================
INSERT INTO cms_settings (id, `key`, value) VALUES
  (UUID(), 'company_name', JSON_QUOTE('YESS Bangla Private Limited')),
  (UUID(), 'company_name_bn', JSON_QUOTE('ইয়েস বাংলা প্রাইভেট লিমিটেড')),
  (UUID(), 'company_tagline', JSON_QUOTE('Where Solution Begins')),
  (UUID(), 'company_tagline_bn', JSON_QUOTE('যেখানে সমাধান শুরু হয়')),
  (UUID(), 'company_email', JSON_QUOTE('yessbangla.bd@gmail.com')),
  (UUID(), 'company_phone', JSON_QUOTE('+880 1805-464343')),
  (UUID(), 'company_address', JSON_QUOTE('Block-A, Road-3, House-127 (Green View), 1st Floor, Mirpur-12, Dhaka-1216')),
  (UUID(), 'company_address_bn', JSON_QUOTE('ব্লক-এ, রোড-৩, বাড়ি-১২৭ (গ্রিন ভিউ), ১ম তলা, মিরপুর-১২, ঢাকা-১২১৬')),
  (UUID(), 'founded_year', JSON_QUOTE('2018')),
  (UUID(), 'linkedin_url', JSON_QUOTE('https://linkedin.com/company/yessbangla')),
  (UUID(), 'facebook_url', JSON_QUOTE('https://facebook.com/yessbangla')),
  (UUID(), 'twitter_url', JSON_QUOTE('https://twitter.com/yessbangla')),
  (UUID(), 'total_employees', JSON_QUOTE('200+')),
  (UUID(), 'total_ventures', JSON_QUOTE('5')),
  (UUID(), 'countries_served', JSON_QUOTE('1')),
  (UUID(), 'total_customers', JSON_QUOTE('50,000+'))
ON DUPLICATE KEY UPDATE value=VALUES(value);

SELECT 'yessbgd_db seed complete' AS status;
