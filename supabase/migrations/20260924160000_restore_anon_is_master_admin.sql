-- JCAI-FIX-02 follow-up (applied to production 2026-09-24 via MCP as
-- "restore_anon_is_master_admin").
--
-- Reverts one line of 20260923232532_security_hardening.sql. Revoking EXECUTE
-- on public.is_master_admin() from anon broke every anonymous blog read:
-- the public SELECT policy on blog_posts sub-selects user_roles, whose own
-- RLS policies call is_master_admin(), and Postgres evaluates that under the
-- anon role. Result: 42501 on /blog for every visitor.
--
-- The function is SECURITY DEFINER + STABLE and returns false for anon, so
-- granting EXECUTE back exposes nothing; the Security Advisor WARN
-- (anon_security_definer_function_executable) is accepted as a known,
-- harmless lint. search_path hardening from the original migration stays.

grant execute on function public.is_master_admin() to anon;
