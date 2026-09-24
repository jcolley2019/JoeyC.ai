-- BASELINE, do not apply.
--
-- JCAI-FIX-01/S4 — schema documentation only (finding L3-04: "RLS is the only
-- guard and is not in source control", L3-11: backend drifts from the repo).
--
-- This file is NOT authoritative. It was reconstructed on 2026-09-23 from the
-- columns the application code reads and writes (src/types/index.ts, the
-- supabase-js calls in src/, and the edge functions in supabase/functions/),
-- not from the live database. Column types, defaults, constraints and indexes
-- are best guesses. Replace it with `supabase db pull` output when the CLI is
-- linked to project cflhanugkedxeybbydha.
--
-- Every statement uses IF NOT EXISTS so an accidental `supabase db push` is a
-- no-op against the live database rather than an error, but the intent is that
-- this file is never applied.
--
-- Live RLS state as reported by the owner on 2026-09-23 (Q1), for reference:
--   * RLS ENABLED on all 10 public tables.
--   * user_roles:          INSERT requires is_master_admin(); no UPDATE/DELETE policy.
--   * blog_posts:          ALL for master_admin (EXISTS on user_roles); SELECT public where status='published'.
--   * site_settings:       SELECT public (true); UPDATE for authenticated with no WITH CHECK  -> fixed in *_security_hardening.sql
--   * contact_submissions: INSERT public WITH CHECK (true); SELECT service_role only      -> fixed in *_security_hardening.sql
--   * content_generations: ALL for authenticated where user_id = auth.uid().
--   * brand_profiles, user_blog_connections, x_accounts, activity_log: own-row policies.
--   * public.is_master_admin() is SECURITY DEFINER; update_updated_at() is a trigger function.

-- ── Public site ──────────────────────────────────────────────────────────────

-- Read by BlogList/BlogPost/BlogPreview/rss/sitemap; written by CommandCenter publish.
create table if not exists public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  content       text not null,
  excerpt       text,
  status        text not null default 'draft',          -- 'draft' | 'published'
  tags          text[] not null default '{}',
  cover_image   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);

-- key/value feature flags read by useSiteSettings (anon-readable by design).
-- Upserted with onConflict: 'key', so key must be unique.
create table if not exists public.site_settings (
  key         text primary key,
  value       boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- Written only by the contact-form edge function (service role).
-- The 5 columns below are the ones that existed live on 2026-09-23; the
-- remaining form fields are added in *_security_hardening.sql.
create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ── Auth / admin ─────────────────────────────────────────────────────────────

-- One row per user. Trusted by admin-users, send-invite, post-to-x and every
-- master_admin RLS policy. Do not restructure (owner instruction, JCAI-FIX-01).
create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  role        text not null default 'user',              -- 'master_admin' | 'user'
  created_at  timestamptz not null default now()
);

-- Written by send-invite; read/deleted by AdminDashboard.
create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  invited_by   uuid references auth.users (id) on delete set null,
  status       text not null default 'pending',          -- 'pending' | 'accepted' | 'expired'
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz
);

-- Inserted by AuthGate/AuthCallback (client) and every edge function (service role).
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  action      text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ── Content Studio ───────────────────────────────────────────────────────────

-- Inserted by generate-content (service role); read/deleted by ContentHistory.
-- The daily limit in generate-content counts rows per user_id per UTC day.
create table if not exists public.content_generations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  input_type         text not null,                      -- 'youtube' | 'text' | 'voice'
  input_text         text,
  output_format      text not null,                      -- 'social' | 'blog' | 'thread' | 'video'
  platform           text,
  generated_content  text not null,
  created_at         timestamptz not null default now()
);

-- One row per user, CRUD from useBrandProfile (own-row RLS). Columns from src/types/index.ts BrandProfile.
create table if not exists public.brand_profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users (id) on delete cascade,
  display_name          text,
  title                 text,
  bio                   text,
  website_url           text,
  tiktok_handle         text,
  instagram_handle      text,
  pinterest_handle      text,
  youtube_handle        text,
  linkedin_handle       text,
  x_handle              text,
  style_preset          text not null default 'modern',  -- 'modern' | 'luxury' | 'editorial' | 'tech'
  accent_color          text not null default '#1a8fff',
  logo_url              text,
  has_branding_kit      boolean not null default false,
  brand_kit_notes       text,
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Written by blog-connection (service role), upsert onConflict 'user_id,platform'.
create table if not exists public.user_blog_connections (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  platform               text not null,                  -- 'wordpress' | 'ghost'
  site_url               text not null,
  credentials_encrypted  text not null,
  connected_at           timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (user_id, platform)
);

-- Written by x-oauth (service role) with a bare upsert, so user_id is assumed
-- to be the primary key. Read by post-to-x.
create table if not exists public.x_accounts (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  x_user_id         text not null,
  x_username        text not null,
  x_display_name    text,
  access_token      text not null,
  refresh_token     text not null,
  token_expires_at  timestamptz not null,
  scopes            text,
  connected_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
