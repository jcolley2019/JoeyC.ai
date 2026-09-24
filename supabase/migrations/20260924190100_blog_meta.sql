-- JCAI-FIX-06/C2 — store the generated SEO fields with each post (L4-02).
--
-- NOT applied by the agent. Apply before pushing the matching app build: the
-- Studio's publish insert writes these two columns when the generated article
-- has a ```meta fence, and fails with an unknown-column error until they exist.
-- (BlogPost.tsx and api/blog.ts read them with select('*'), so reads work
-- either way.)
--
-- Both nullable: posts published before this, or articles without a fence,
-- keep using the excerpt as their description.

alter table public.blog_posts
  add column if not exists meta_description text,
  add column if not exists primary_keyword  text;
