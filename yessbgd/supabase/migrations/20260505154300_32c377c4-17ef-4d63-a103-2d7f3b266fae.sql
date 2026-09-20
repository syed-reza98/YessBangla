
-- ============ Audit logs ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies: only the SECURITY DEFINER trigger writes here.

-- Trigger function: writes a row for every INSERT/UPDATE/DELETE
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec_id := COALESCE((OLD).id::text, NULL);
    INSERT INTO public.audit_logs(actor_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, rec_id, to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    rec_id := COALESCE((NEW).id::text, NULL);
    INSERT INTO public.audit_logs(actor_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, rec_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    rec_id := COALESCE((NEW).id::text, NULL);
    INSERT INTO public.audit_logs(actor_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, rec_id, NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_job_applications ON public.job_applications;
CREATE TRIGGER audit_job_applications
AFTER INSERT OR UPDATE OR DELETE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_contact_messages ON public.contact_messages;
CREATE TRIGGER audit_contact_messages
AFTER INSERT OR UPDATE OR DELETE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- ============ status_updated_at trigger (was function-only, now wired) ============
DROP TRIGGER IF EXISTS touch_application_status ON public.job_applications;
CREATE TRIGGER touch_application_status
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.touch_application_status_updated_at();

-- ============ Email validation triggers (instead of CHECK constraints) ============
CREATE OR REPLACE FUNCTION public.validate_email_format()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email USING ERRCODE = '22000';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_email_contact_messages ON public.contact_messages;
CREATE TRIGGER validate_email_contact_messages
BEFORE INSERT OR UPDATE OF email ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_email_format();

DROP TRIGGER IF EXISTS validate_email_job_applications ON public.job_applications;
CREATE TRIGGER validate_email_job_applications
BEFORE INSERT OR UPDATE OF email ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.validate_email_format();

-- ============ Performance indexes ============
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at
  ON public.job_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_status_created
  ON public.job_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_email_lower
  ON public.job_applications (lower(email));
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
  ON public.audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles (user_id, role);
