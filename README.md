# joeyc.ai

Personal site and blog for Joey Colley, plus a gated Content Studio (`/command-center`) that turns a YouTube link, text or voice note into blog posts, social captions, threads and video scripts with Claude.

## Stack

- React 19 + TypeScript 5.9, Vite 7, Tailwind CSS 4, GSAP, react-router 7
- Supabase (Postgres + RLS, Auth, Storage, Edge Functions on Deno)
- Deployed on Vercel as a single-page app; `/sitemap.xml` and `/rss.xml` are rewritten to edge functions (see `vercel.json`)

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b` then `vite build` into `dist/`
- `npm run typecheck` — `tsc -b --noEmit`
- `npm run lint` — ESLint over `src/` and `supabase/functions/`
- `npm run preview` — serve the production build locally

Node `>=22.12 <25` (see `.nvmrc`).

## Environment variables

Client (`.env`, never committed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Edge functions (Supabase secrets): `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `RESEND_API_KEY`, `SITE_URL`, `ENV`, `BLOG_CREDENTIALS_KEY`, `CONTACT_IP_SALT`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`, `X_OAUTH_CLIENT_ID`, `X_OAUTH_CLIENT_SECRET`, plus the platform-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Edge functions (`supabase/functions/`)

`verify_jwt` is the gateway flag from `supabase/config.toml`; it only requires *some* valid JWT (the anon key qualifies), so every function also checks auth in code. Redeploy a function after changing its flag.

| function | verify_jwt | purpose |
|---|---|---|
| generate-content | true | Claude content generation (user session required) |
| blog-connection | true | External blog publishing credentials |
| post-to-x | true | Post to X; master account fallback is master_admin only |
| x-oauth | true | X OAuth 1.0a / 2.0 PKCE flow |
| translate | true | Claude translation (user session required) |
| youtube-transcript | true | Transcript fetch (user session required) |
| perplexity-hashtags | false | Hashtag research (checks auth in code) |
| admin-users | false | Admin user management (checks role in code) |
| send-invite | false | Invite emails via Resend (checks role in code) |
| rss | false | Public RSS feed |
| sitemap | false | Public sitemap |
| contact-form | false | Public contact form: validated, escaped, rate-limited |

Database schema and RLS live in `supabase/migrations/`.
