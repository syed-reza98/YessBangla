ALTER TABLE public.cms_menu_items
  ADD COLUMN IF NOT EXISTS visible_to text NOT NULL DEFAULT 'all';

ALTER TABLE public.cms_menu_items
  DROP CONSTRAINT IF EXISTS cms_menu_items_visible_to_check;

ALTER TABLE public.cms_menu_items
  ADD CONSTRAINT cms_menu_items_visible_to_check
  CHECK (visible_to IN ('all','guest','authenticated','admin'));