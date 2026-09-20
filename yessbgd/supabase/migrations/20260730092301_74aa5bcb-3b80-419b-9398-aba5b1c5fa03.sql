CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section_key text NOT NULL,
  sort_order int DEFAULT 0,
  title text, title_bn text,
  subtitle text, subtitle_bn text,
  body text, body_bn text,
  cta_label text, cta_href text,
  image_url text,
  data jsonb DEFAULT '{}'::jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (page, section_key)
);

CREATE TABLE public.cms_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text,
  "group" text DEFAULT 'general',
  value jsonb DEFAULT '{}'::jsonb,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.cms_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL DEFAULT 'header',
  label text NOT NULL,
  label_bn text,
  href text NOT NULL,
  group_label text,
  sort_order int DEFAULT 0,
  is_external boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  url text NOT NULL,
  path text,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  folder text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT ON public.cms_settings TO anon;
GRANT SELECT ON public.cms_menu_items TO anon;
GRANT SELECT ON public.cms_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_menu_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media TO authenticated;
GRANT ALL ON public.cms_pages TO service_role;
GRANT ALL ON public.cms_settings TO service_role;
GRANT ALL ON public.cms_menu_items TO service_role;
GRANT ALL ON public.cms_media TO service_role;

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published pages" ON public.cms_pages FOR SELECT USING (is_published = true);
CREATE POLICY "public read settings" ON public.cms_settings FOR SELECT USING (true);
CREATE POLICY "public read published menu items" ON public.cms_menu_items FOR SELECT USING (is_published = true);
CREATE POLICY "public read media" ON public.cms_media FOR SELECT USING (true);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cms_pages','cms_settings','cms_menu_items','cms_media']
  LOOP
    EXECUTE format($f$
      CREATE POLICY "admin manage %1$s" ON public.%1$I
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
    $f$, t);
  END LOOP;
END $$;

CREATE TRIGGER cms_pages_updated BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();
CREATE TRIGGER cms_settings_updated BEFORE UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();
CREATE TRIGGER cms_menu_items_updated BEFORE UPDATE ON public.cms_menu_items FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();
CREATE TRIGGER cms_media_updated BEFORE UPDATE ON public.cms_media FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();

CREATE INDEX cms_pages_page_idx ON public.cms_pages (page, sort_order);
CREATE INDEX cms_menu_items_loc_idx ON public.cms_menu_items (location, sort_order);

CREATE POLICY "read media bucket" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "admin upload media bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin update media bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin delete media bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.cms_settings (key, label, "group", value, sort_order) VALUES
  ('company_name','Company name','general','{"text":"Yess Bangla Private Limited"}'::jsonb,1),
  ('company_tagline','Tagline','general','{"text":"Building ventures that move Bangladesh forward"}'::jsonb,2),
  ('contact_email','Contact email','contact','{"text":"info@yessbangla.com"}'::jsonb,3),
  ('contact_phone','Contact phone','contact','{"text":"+880 1XXXXXXXXX"}'::jsonb,4),
  ('contact_address','Address','contact','{"text":"Dhaka, Bangladesh"}'::jsonb,5),
  ('social_links','Social links','social','{"facebook":"","linkedin":"","youtube":""}'::jsonb,6),
  ('seo_default','Default SEO','seo','{"title":"Yess Bangla Private Limited","description":"A Bangladeshi holding company building ventures across media, agriculture, software and tourism."}'::jsonb,7),
  ('logo_url','Logo URL','branding','{"text":""}'::jsonb,8)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.cms_menu_items (location, label, label_bn, href, sort_order) VALUES
  ('header','Home','হোম','/',1),
  ('header','Ventures','ভেঞ্চার','/ventures',2),
  ('header','Services','সার্ভিস','/services',3),
  ('header','Industries','ইন্ডাস্ট্রি','/industries',4),
  ('header','Insights','ইনসাইট','/insights',5),
  ('header','About','আমাদের সম্পর্কে','/about',6),
  ('header','Contact','যোগাযোগ','/contact',7),
  ('footer','About','আমাদের সম্পর্কে','/about',1),
  ('footer','Careers','ক্যারিয়ার','/careers',2),
  ('footer','Insights','ইনসাইট','/insights',3),
  ('footer','Contact','যোগাযোগ','/contact',4),
  ('footer','Privacy','প্রাইভেসি','/privacy',5),
  ('footer','Terms','শর্তাবলি','/terms',6);

INSERT INTO public.cms_pages (page, section_key, sort_order, title, title_bn, subtitle, body, cta_label, cta_href) VALUES
  ('home','hero',1,'Yess Bangla Private Limited','ইয়েস বাংলা প্রাইভেট লিমিটেড','Building ventures that move Bangladesh forward','A diversified holding company operating across media, agriculture, software, food and tourism.','Explore ventures','/ventures'),
  ('home','ventures',2,'Our Ventures','আমাদের ভেঞ্চার','Twelve businesses, one standard of excellence',NULL,'View all','/ventures'),
  ('about','intro',1,'About Yess Bangla','আমাদের সম্পর্কে','Who we are',NULL,NULL,NULL),
  ('contact','intro',1,'Contact us','যোগাযোগ করুন','We usually reply within one business day',NULL,NULL,NULL)
ON CONFLICT (page, section_key) DO NOTHING;