INSERT INTO public.cms_settings (key, label, "group", value, sort_order)
SELECT 'footer_config', 'Footer', 'footer', '{}'::jsonb, 90
WHERE NOT EXISTS (SELECT 1 FROM public.cms_settings WHERE key = 'footer_config');