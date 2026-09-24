-- JCAI-FIX-01/S4 — RLS + function hardening.
--
-- Written 2026-09-23 against the live policy state reported in Q1. NOT applied
-- by the agent: apply on a branch database first, then production.
--
-- Findings closed here:
--   L3-04   site_settings writable by any signed-in user; contact_submissions
--           insertable by anon via REST.
--   Advisor public.is_master_admin() executable by anon via /rest/v1/rpc;
--           is_master_admin() and update_updated_at() have a mutable search_path.
--   L3-11   contact_submissions is missing 6 of the 9 fields the form sends.
--
-- Everything runs in one transaction so a single failing statement (for
-- example a policy or function name that differs from what Q1 reported) rolls
-- the whole file back instead of leaving the tables half-changed.

begin;

-- ── 1. site_settings — L3-04 / Q1 ────────────────────────────────────────────
-- Live: UPDATE for auth.role() = 'authenticated' with no WITH CHECK, so any
-- signed-in user could flip contact_form_enabled or any future flag.
-- The public SELECT policy (USING true) is intentionally left in place: the
-- landing page reads contact_form_enabled anonymously.

drop policy if exists "Allow authenticated update" on public.site_settings;

-- Only a master_admin may change a setting, and the row they write must still
-- pass the same check (WITH CHECK), so the policy cannot be used to hand the
-- row to someone else.
create policy "site_settings_update_master_admin"
  on public.site_settings
  for update
  to authenticated
  using (public.is_master_admin())
  with check (public.is_master_admin());

-- useSiteSettings.update() is an upsert. The rows the code expects
-- (open_registration, perplexity_hashtags_enabled, extra_platform_youtube) do
-- not exist live, so the admin needs INSERT as well or the toggles silently
-- no-op. PostgREST upsert needs both INSERT and UPDATE policies to pass.
create policy "site_settings_insert_master_admin"
  on public.site_settings
  for insert
  to authenticated
  with check (public.is_master_admin());

-- ── 2. contact_submissions — L3-04 / Q1 ──────────────────────────────────────
-- Live: INSERT for public WITH CHECK (true). The contact-form edge function
-- writes with the service role, which bypasses RLS, so this policy only ever
-- served anonymous REST inserts (spam straight into the table, no email, no
-- rate limit). The service_role SELECT policy is kept.

drop policy if exists "Allow insert from edge function" on public.contact_submissions;

-- ── 3. is_master_admin() / update_updated_at() — Security Advisor ─────────────
-- (a) Exposure. Supabase grants EXECUTE on new functions to PUBLIC, which
-- includes anon, so revoking from anon alone would be a no-op. Revoke from
-- PUBLIC and anon, then grant back exactly the roles that need it:
--   authenticated — RLS policies above call it under the caller's role.
--   service_role  — edge functions may call it; harmless either way.
-- Anon never legitimately calls it: the only anon-facing policies (blog_posts
-- published SELECT, site_settings SELECT) do not reference it. An anon UPDATE
-- attempt on site_settings now fails with "permission denied for function"
-- instead of an RLS violation — still denied, and it no longer leaks whether
-- the caller is an admin via /rest/v1/rpc/is_master_admin.

revoke execute on function public.is_master_admin() from public;
revoke execute on function public.is_master_admin() from anon;
grant  execute on function public.is_master_admin() to authenticated;
grant  execute on function public.is_master_admin() to service_role;

-- (b) Mutable search_path on SECURITY DEFINER functions lets a caller who can
-- create objects in an earlier schema shadow the tables the function reads.
-- `public` is used (not '') because the function bodies were not readable
-- from this checkout and almost certainly reference user_roles unqualified;
-- '' would break that. To confirm and optionally tighten to '', run:
--   select pg_get_functiondef('public.is_master_admin'::regproc);
--   select pg_get_functiondef('public.update_updated_at'::regproc);
-- If update_updated_at has a different signature the ALTER below fails and the
-- transaction rolls back — adjust the name and re-run.

alter function public.is_master_admin()  set search_path = public;
alter function public.update_updated_at() set search_path = public;

-- ── 4. contact_submissions columns — L3-11 ───────────────────────────────────
-- src/components/sections/Contact.tsx posts 9 fields; live table has 5
-- (id, name, email, message, created_at). Add the other 6 as nullable text so
-- the rewritten contact-form function (JCAI-FIX-01/S5) can store them.
-- Column names are snake_case; the function maps painPoint -> pain_point.

alter table public.contact_submissions
  add column if not exists service    text,
  add column if not exists pain_point text,
  add column if not exists budget     text,
  add column if not exists timeline   text,
  add column if not exists company    text,
  add column if not exists website    text;

-- Rate limiting for S5: sha-256(x-forwarded-for + CONTACT_IP_SALT) stored per
-- row, and the function counts rows with the same hash in the last hour
-- (429 above 3). Chosen over a separate contact_rate_limits table because it
-- needs no extra table, no cleanup job, and the count query is one indexed
-- lookup. The raw IP is never stored.

alter table public.contact_submissions
  add column if not exists ip_hash text;

create index if not exists contact_submissions_ip_hash_created_at_idx
  on public.contact_submissions (ip_hash, created_at desc);

commit;
