
REVOKE ALL ON FUNCTION public.log_audit_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_email_format() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_application_status_updated_at() FROM PUBLIC, anon, authenticated;
