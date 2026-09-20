-- ============================================================
-- YESS Bangla Portal - Baseline Database Schema DDL
-- Compatible with MySQL 8.0+ and MariaDB 10.3+
-- Corresponds to src/db/schema.ts
-- ============================================================

CREATE DATABASE IF NOT EXISTS yessbgd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yessbgd_db;

-- 1. Authentication & Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  job_title VARCHAR(150) NULL,
  avatar_url TEXT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  theme VARCHAR(20) NOT NULL DEFAULT 'light',
  items_per_page INT NOT NULL DEFAULT 20,
  notify_new_application BOOLEAN NOT NULL DEFAULT TRUE,
  notify_new_message BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('admin', 'moderator', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_roles_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Dynamic Site Pages (Custom Pages & Overrides)
CREATE TABLE IF NOT EXISTS cms_site_pages (
  id VARCHAR(36) PRIMARY KEY,
  page VARCHAR(100) NOT NULL UNIQUE,
  path VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  name_bn VARCHAR(150) NULL,
  hero_eyebrow TEXT NULL,
  hero_eyebrow_bn TEXT NULL,
  hero_title TEXT NULL,
  hero_title_bn TEXT NULL,
  hero_subtitle TEXT NULL,
  hero_subtitle_bn TEXT NULL,
  hero_image TEXT NULL,
  body TEXT NULL,
  body_bn TEXT NULL,
  seo_title TEXT NULL,
  seo_title_bn TEXT NULL,
  seo_description TEXT NULL,
  seo_description_bn TEXT NULL,
  og_image TEXT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  data JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_site_pages_path (path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ventures & Companies
CREATE TABLE IF NOT EXISTS cms_ventures (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  name_bn VARCHAR(150) NULL,
  tag VARCHAR(100) NULL,
  tag_bn VARCHAR(100) NULL,
  category VARCHAR(100) DEFAULT 'tech',
  status VARCHAR(50) DEFAULT 'active',
  summary TEXT NULL,
  summary_bn TEXT NULL,
  description TEXT NULL,
  description_bn TEXT NULL,
  metrics JSON NULL,
  hero_image TEXT NULL,
  logo_image TEXT NULL,
  link_url TEXT NULL,
  sort_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_ventures_category (category),
  INDEX idx_cms_ventures_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Services
CREATE TABLE IF NOT EXISTS cms_services (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  name_bn VARCHAR(150) NULL,
  summary TEXT NULL,
  summary_bn TEXT NULL,
  description TEXT NULL,
  description_bn TEXT NULL,
  icon VARCHAR(50) NULL,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Industries
CREATE TABLE IF NOT EXISTS cms_industries (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  name_bn VARCHAR(150) NULL,
  summary TEXT NULL,
  summary_bn TEXT NULL,
  description TEXT NULL,
  description_bn TEXT NULL,
  icon VARCHAR(50) NULL,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Insights & Articles
CREATE TABLE IF NOT EXISTS cms_insights (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(150) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  title_bn VARCHAR(255) NULL,
  category VARCHAR(100) DEFAULT 'Strategy',
  excerpt TEXT NULL,
  excerpt_bn TEXT NULL,
  content TEXT NULL,
  content_bn TEXT NULL,
  author VARCHAR(150) DEFAULT 'Yess Editorial Team',
  read_time VARCHAR(50) DEFAULT '5 min read',
  cover_image TEXT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_insights_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Navigation Menu Items
CREATE TABLE IF NOT EXISTS cms_menu_items (
  id VARCHAR(36) PRIMARY KEY,
  location VARCHAR(50) NOT NULL DEFAULT 'header',
  label VARCHAR(100) NOT NULL,
  label_bn VARCHAR(100) NULL,
  href VARCHAR(255) NOT NULL,
  group_label VARCHAR(100) NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_external BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  parent_id VARCHAR(36) NULL,
  depth INT DEFAULT 0,
  icon VARCHAR(50) NULL,
  description TEXT NULL,
  description_bn TEXT NULL,
  accent VARCHAR(50) NULL,
  item_style VARCHAR(50) NULL,
  badge VARCHAR(50) NULL,
  badge_bn VARCHAR(50) NULL,
  visible_to VARCHAR(30) DEFAULT 'all',
  target VARCHAR(20) DEFAULT '_self',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_menu_location (location),
  INDEX idx_menu_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Media Uploads
CREATE TABLE IF NOT EXISTS cms_media (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100) NULL,
  size INT DEFAULT 0,
  alt_text VARCHAR(255) NULL,
  folder VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_folder (folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. System / CMS Settings
CREATE TABLE IF NOT EXISTS cms_settings (
  id VARCHAR(36) PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  value JSON NULL,
  label VARCHAR(255) NULL,
  `group` VARCHAR(100) NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_settings_group (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Page Section Blocks (hero, intro, custom sections)
CREATE TABLE IF NOT EXISTS cms_pages (
  id VARCHAR(36) PRIMARY KEY,
  page VARCHAR(100) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  title TEXT NULL,
  title_bn TEXT NULL,
  subtitle TEXT NULL,
  subtitle_bn TEXT NULL,
  body TEXT NULL,
  body_bn TEXT NULL,
  cta_label VARCHAR(150) NULL,
  cta_href VARCHAR(255) NULL,
  image_url TEXT NULL,
  data JSON NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_pages_lookup (page, section_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Contact Inquiries
CREATE TABLE IF NOT EXISTS contact_messages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'new',
  status_note TEXT NULL,
  status_updated_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_status (status),
  INDEX idx_contact_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id VARCHAR(36) PRIMARY KEY,
  job_slug VARCHAR(100) NOT NULL,
  job_title VARCHAR(150) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  linkedin TEXT NULL,
  cover_letter TEXT NOT NULL,
  resume_path TEXT NOT NULL,
  resume_name VARCHAR(255) NOT NULL,
  resume_size INT NOT NULL,
  resume_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  status_note TEXT NULL,
  status_updated_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_app_slug (job_slug),
  INDEX idx_job_app_email (email),
  INDEX idx_job_app_status (status),
  INDEX idx_job_app_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NULL,
  entity_id VARCHAR(36) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
