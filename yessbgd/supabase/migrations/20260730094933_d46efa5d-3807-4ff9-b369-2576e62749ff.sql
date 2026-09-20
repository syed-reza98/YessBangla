-- Careers link back in the header menu + Bangla labels for every menu item
INSERT INTO public.cms_menu_items (location, label, label_bn, href, sort_order, is_published)
SELECT 'header', 'Careers', 'ক্যারিয়ার', '/careers', 6, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_menu_items WHERE location = 'header' AND href = '/careers'
);

UPDATE public.cms_menu_items SET sort_order = 7 WHERE location = 'header' AND href = '/about';
UPDATE public.cms_menu_items SET sort_order = 8 WHERE location = 'header' AND href = '/contact';

UPDATE public.cms_menu_items SET label_bn = v.bn
FROM (VALUES
  ('/', 'হোম'),
  ('/ventures', 'ভেঞ্চার'),
  ('/services', 'সার্ভিস'),
  ('/industries', 'ইন্ডাস্ট্রি'),
  ('/insights', 'ইনসাইট'),
  ('/careers', 'ক্যারিয়ার'),
  ('/about', 'আমাদের সম্পর্কে'),
  ('/contact', 'যোগাযোগ'),
  ('/privacy', 'প্রাইভেসি'),
  ('/terms', 'শর্তাবলি')
) AS v(href, bn)
WHERE public.cms_menu_items.href = v.href
  AND (public.cms_menu_items.label_bn IS NULL OR public.cms_menu_items.label_bn = '');

-- Store venture artwork as plain file names so the site can serve bundled assets
UPDATE public.cms_ventures
SET image_path = regexp_replace(image_path, '^/src/assets/ventures/', '')
WHERE image_path LIKE '/src/assets/ventures/%';