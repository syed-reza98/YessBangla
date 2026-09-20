ALTER TABLE public.cms_menu_items
  ADD COLUMN IF NOT EXISTS accent text,
  ADD COLUMN IF NOT EXISTS item_style text,
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS badge_bn text;