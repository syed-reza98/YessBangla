DROP POLICY IF EXISTS "admins manage site pages" ON public.cms_site_pages;
CREATE POLICY "admin manage site pages" ON public.cms_site_pages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));