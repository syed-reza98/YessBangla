
-- Phase 1: Dynamic CMS foundation tables
-- Public read (cached), admin-only write

CREATE TABLE public.cms_ventures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  tagline text,
  description text,
  icon text,
  image_path text,
  category text,
  status text DEFAULT 'active',
  sort_order int DEFAULT 0,
  data jsonb DEFAULT '{}'::jsonb,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.cms_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  bullets jsonb DEFAULT '[]'::jsonb,
  pricing jsonb DEFAULT '{}'::jsonb,
  data jsonb DEFAULT '{}'::jsonb,
  sort_order int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.cms_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  outcomes jsonb DEFAULT '[]'::jsonb,
  data jsonb DEFAULT '{}'::jsonb,
  sort_order int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.cms_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  body_md text,
  cover_image text,
  category text,
  author text,
  tags jsonb DEFAULT '[]'::jsonb,
  data jsonb DEFAULT '{}'::jsonb,
  published_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cms_ventures   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_services   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_insights   ENABLE ROW LEVEL SECURITY;

-- Public can read published rows
CREATE POLICY "public read published ventures"   ON public.cms_ventures   FOR SELECT USING (is_published = true);
CREATE POLICY "public read published services"   ON public.cms_services   FOR SELECT USING (is_published = true);
CREATE POLICY "public read published industries" ON public.cms_industries FOR SELECT USING (is_published = true);
CREATE POLICY "public read published insights"   ON public.cms_insights   FOR SELECT USING (is_published = true);

-- Admin-only write policies (uses existing has_role + app_role enum)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cms_ventures','cms_services','cms_industries','cms_insights']
  LOOP
    EXECUTE format($f$
      CREATE POLICY "admin manage %1$s" ON public.%1$I
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
    $f$, t);
  END LOOP;
END $$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.cms_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER cms_ventures_updated   BEFORE UPDATE ON public.cms_ventures   FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();
CREATE TRIGGER cms_services_updated   BEFORE UPDATE ON public.cms_services   FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();
CREATE TRIGGER cms_industries_updated BEFORE UPDATE ON public.cms_industries FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();
CREATE TRIGGER cms_insights_updated   BEFORE UPDATE ON public.cms_insights   FOR EACH ROW EXECUTE FUNCTION public.cms_touch_updated_at();

CREATE INDEX cms_ventures_sort_idx   ON public.cms_ventures   (sort_order);
CREATE INDEX cms_services_sort_idx   ON public.cms_services   (sort_order);
CREATE INDEX cms_industries_sort_idx ON public.cms_industries (sort_order);
CREATE INDEX cms_insights_published_idx ON public.cms_insights (published_at DESC);
