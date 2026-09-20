CREATE TABLE public.cms_site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL UNIQUE,
  path text NOT NULL,
  name text NOT NULL,
  name_bn text,
  hero_eyebrow text,
  hero_eyebrow_bn text,
  hero_title text,
  hero_title_bn text,
  hero_subtitle text,
  hero_subtitle_bn text,
  hero_image text,
  body text,
  body_bn text,
  seo_title text,
  seo_title_bn text,
  seo_description text,
  seo_description_bn text,
  og_image text,
  is_custom boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.cms_site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_site_pages TO authenticated;
GRANT ALL ON public.cms_site_pages TO service_role;

ALTER TABLE public.cms_site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published site pages" ON public.cms_site_pages
  FOR SELECT USING (is_published = true);
CREATE POLICY "admins manage site pages" ON public.cms_site_pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER cms_site_pages_updated BEFORE UPDATE ON public.cms_site_pages
  FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();

CREATE INDEX cms_site_pages_sort_idx ON public.cms_site_pages (sort_order);

INSERT INTO public.cms_site_pages (page, path, name, name_bn, sort_order) VALUES
  ('home', '/', 'Home', 'হোম', 1),
  ('ventures', '/ventures', 'Ventures', 'ভেঞ্চার', 2),
  ('services', '/services', 'Services', 'সার্ভিস', 3),
  ('industries', '/industries', 'Industries', 'ইন্ডাস্ট্রি', 4),
  ('projects', '/projects', 'Projects', 'প্রজেক্ট', 5),
  ('insights', '/insights', 'Insights', 'ইনসাইট', 6),
  ('careers', '/careers', 'Careers', 'ক্যারিয়ার', 7),
  ('about', '/about', 'About', 'আমাদের সম্পর্কে', 8),
  ('contact', '/contact', 'Contact', 'যোগাযোগ', 9),
  ('faq', '/faq', 'FAQ', 'সাধারণ জিজ্ঞাসা', 10),
  ('privacy', '/privacy', 'Privacy policy', 'প্রাইভেসি নীতি', 11),
  ('terms', '/terms', 'Terms', 'শর্তাবলি', 12)
ON CONFLICT (page) DO NOTHING;