ALTER TABLE public.cms_menu_items
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS depth integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS description_bn text;

CREATE INDEX IF NOT EXISTS cms_menu_items_parent_idx ON public.cms_menu_items(parent_id);
CREATE INDEX IF NOT EXISTS cms_menu_items_location_sort_idx ON public.cms_menu_items(location, sort_order);