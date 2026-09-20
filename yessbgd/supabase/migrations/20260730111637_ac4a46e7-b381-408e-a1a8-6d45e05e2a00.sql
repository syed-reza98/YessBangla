INSERT INTO public.cms_media (file_name, url, path, folder, mime_type, alt_text)
SELECT v.file_name, v.url, NULL, v.folder, v.mime, replace(regexp_replace(v.file_name, '\.[a-zA-Z]+$', ''), '-', ' ')
FROM (VALUES
  ('about-team-bd.jpg','/src/assets/about-team-bd.jpg','site','image/jpeg'),
  ('contact-welcome-bd.jpg','/src/assets/contact-welcome-bd.jpg','site','image/jpeg'),
  ('hero-business.jpg','/src/assets/hero-business.jpg','site','image/jpeg'),
  ('services-tech-bd.jpg','/src/assets/services-tech-bd.jpg','site','image/jpeg'),
  ('trust-handshake-bd.jpg','/src/assets/trust-handshake-bd.jpg','site','image/jpeg'),
  ('ventures-dhaka-bd.jpg','/src/assets/ventures-dhaka-bd.jpg','site','image/jpeg'),
  ('yess-bangla-letterhead.jpeg','/src/assets/yess-bangla-letterhead.jpeg','site','image/jpeg'),
  ('yess-bangla-logo.png','/src/assets/yess-bangla-logo.png','site','image/png'),
  ('akash-ott.jpg','/src/assets/ventures/akash-ott.jpg','ventures','image/jpeg'),
  ('akash-tv.jpg','/src/assets/ventures/akash-tv.jpg','ventures','image/jpeg'),
  ('the-daily-akash.jpg','/src/assets/ventures/the-daily-akash.jpg','ventures','image/jpeg'),
  ('yess-all-in-one-solution.jpg','/src/assets/ventures/yess-all-in-one-solution.jpg','ventures','image/jpeg'),
  ('yess-event.jpg','/src/assets/ventures/yess-event.jpg','ventures','image/jpeg'),
  ('yess-food.jpg','/src/assets/ventures/yess-food.jpg','ventures','image/jpeg'),
  ('yess-host.jpg','/src/assets/ventures/yess-host.jpg','ventures','image/jpeg'),
  ('yess-model.jpg','/src/assets/ventures/yess-model.jpg','ventures','image/jpeg'),
  ('yess-organic-haat.jpg','/src/assets/ventures/yess-organic-haat.jpg','ventures','image/jpeg'),
  ('yess-service.jpg','/src/assets/ventures/yess-service.jpg','ventures','image/jpeg'),
  ('yess-soft.jpg','/src/assets/ventures/yess-soft.jpg','ventures','image/jpeg'),
  ('yess-tourism.jpg','/src/assets/ventures/yess-tourism.jpg','ventures','image/jpeg'),
  ('favicon.png','/favicon.png','public','image/png'),
  ('letterhead-header.png','/letterhead-header.png','public','image/png'),
  ('letterhead-footer.png','/letterhead-footer.png','public','image/png'),
  ('letterhead-watermark.png','/letterhead-watermark.png','public','image/png'),
  ('yess-bangla-logo.jpeg','/yess-bangla-logo.jpeg','public','image/jpeg'),
  ('yess-bangla-letterhead.jpeg','/yess-bangla-letterhead.jpeg','public','image/jpeg')
) AS v(file_name, url, folder, mime)
WHERE NOT EXISTS (SELECT 1 FROM public.cms_media m WHERE m.url = v.url);