DELETE FROM public.cms_menu_items WHERE location='header' AND label='New submenu' AND href='/';
UPDATE public.cms_menu_items SET sort_order = 1 WHERE location='header' AND href='/' AND parent_id IS NULL;
UPDATE public.cms_menu_items SET sort_order = 2 WHERE location='header' AND href='/about';
UPDATE public.cms_menu_items SET sort_order = 3 WHERE location='header' AND href='/services';
UPDATE public.cms_menu_items SET sort_order = 4 WHERE location='header' AND href='/ventures';
UPDATE public.cms_menu_items SET sort_order = 5 WHERE location='header' AND href='/industries';
UPDATE public.cms_menu_items SET sort_order = 6 WHERE location='header' AND href='/insights';
UPDATE public.cms_menu_items SET sort_order = 7 WHERE location='header' AND href='/careers';
UPDATE public.cms_menu_items SET sort_order = 8 WHERE location='header' AND href='/contact';