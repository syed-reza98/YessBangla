-- Secure public lookup function: anon can call this with ref + email, returns single row only on match.
CREATE OR REPLACE FUNCTION public.lookup_application(_ref text, _email text)
RETURNS TABLE (
  id uuid,
  job_title text,
  full_name text,
  email text,
  status public.application_status,
  status_note text,
  status_updated_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, job_title, full_name, email, status, status_note, status_updated_at, created_at
  FROM public.job_applications
  WHERE lower(email) = lower(trim(_email))
    AND id::text ILIKE (lower(regexp_replace(coalesce(_ref,''), '[^a-fA-F0-9-]', '', 'g')) || '%')
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_application(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_application(text, text) TO anon, authenticated;

-- Allow anon realtime subscription on a single row by id (filter is enforced client-side via subscription filter).
-- We add a narrow SELECT policy that only allows SELECT when the id is not null AND request includes a matching email check.
-- Simpler & safer: keep table-level SELECT admin-only (already in place); realtime needs SELECT.
-- For realtime to work for anon trackers, expose a minimal view via the function only. We'll poll instead of relying on realtime for anon.
