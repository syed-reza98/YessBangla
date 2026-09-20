
DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('New', 'Reviewed', 'Rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS status public.application_status NOT NULL DEFAULT 'New';

DROP POLICY IF EXISTS "Admins can update applications" ON public.job_applications;
CREATE POLICY "Admins can update applications"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
