-- Extend application status enum with hiring lifecycle steps
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'Submitted';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'Under review';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'Interview';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'Offer';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'Hired';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'On hold';

-- Track when admin last updated the status, plus an optional admin note shown to the applicant
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status_note text;

-- Auto-touch status_updated_at when status changes
CREATE OR REPLACE FUNCTION public.touch_application_status_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.status_note IS DISTINCT FROM OLD.status_note THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_applications_status_touch ON public.job_applications;
CREATE TRIGGER trg_job_applications_status_touch
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.touch_application_status_updated_at();

-- Realtime so the applicant tracker reflects admin changes live
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;