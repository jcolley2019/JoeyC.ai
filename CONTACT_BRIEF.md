# SEO.JOEYCAI.MONEYPAGE.1 — make /contact a real, pre-rendered money page

Context: the contact form is src/components/sections/Contact.tsx, rendered only as a section on the home page (/#contact). /contact falls through to NotFound. api/blog.ts pre-renders /blog and /blog/:slug by injecting data-prerender head tags + a plain-HTML body into dist/index.html; main.tsx strips those tags on mount. api/sitemap.ts builds the sitemap from blog_posts. Reuse all of that; do not touch the home page (src/App.tsx) or the Hero.

## 1. Route
- New page src/pages/ContactPage.tsx, route path="/contact" in src/AppRoutes.tsx (above the "*" route).
- It renders: <Seo> (below), a short intro block, then the existing <Contact /> component unchanged (the form, its Supabase call and validation stay as they are).
- Intro block (above the form, same dark styling as the rest of the site): 
  - H1: "Work with me: AI apps, websites and automations for small businesses"
  - One paragraph (40–60 words), first person, no hype: Joey builds and ships AI apps, websites and automations himself with Claude Code, names two live builds (luxvibe.io, titilinks.com), and says what happens after the form (reply within 24 hours, a short call, a fixed quote). Keep claims to what the site already says.
- The Contact section keeps its own "Let's Build Something Together" display heading, but make sure the page has exactly one <h1> (if the section's heading is an h1, demote it to h2 on this page only — do not change it on the home page).
- Navbar: leave the "Contact" link as #contact on the home page; on /contact and blog routes, if the navbar's #contact link wouldn't work (no section on that page), point it to /contact there. Check how Navbar handles non-home routes before changing anything.

## 2. Seo (client) for /contact
title "Work with me — AI apps, websites & automations | Joey Colley"
description (under 155 chars) "Hire Joey Colley to build your AI app, website or automation. Tell me about your project in 60 seconds — I reply within 24 hours."
canonical `${SITE_URL}/contact`, ogType website, default OG image.
jsonLd: one ContactPage object with mainEntity a Person { name "Joey Colley", url SITE_URL, sameAs: whatever social URLs the site already publishes (reuse the existing list; add none) }.

## 3. Pre-render /contact
- Move readShell, headTags, compose (and anything else they need) out of api/blog.ts into api/_prerender.ts and import them from both api/blog.ts and the new api/contact.ts. api/blog.ts behaviour must not change.
- api/contact.ts: serve dist/index.html with the same head tags as §2 (title, description, canonical, og:*, twitter:*, ContactPage JSON-LD) and a plain-HTML body: the H1, the intro paragraph, a list of the four service options (AI App / Custom Tool, Website Build or Redesign, Automation & Workflows, AI Consulting / Strategy) and the line "I'll reply within 24 hours." No form in the prerender body (the SPA mounts it). Cache-Control like blog's CACHE_OK.
- vercel.json: add { "source": "/contact", "destination": "/api/contact" } above the catch-all rewrite; add api/contact.ts to "functions" with includeFiles dist/index.html, same as api/blog.ts.
- api/sitemap.ts: add { loc: `${SITE_URL}/contact`, lastmod: null } after the /blog entry.

## 4. Blog → money page link
- Append a CTA block after the article body in BOTH the pre-render (api/blog.ts post body, after the prose div) and the React page (src/pages/BlogPost.tsx, before "Back to blog"): small heading "Working on something like this?", one sentence, and a link with the exact anchor text "Work with me" → /contact. Same markup/classes in both so the SPA swap is invisible.
- /blog list page: no CTA.

## 5. Verify (print pass/fail)
Run: npm run typecheck, npm run lint, npm run build — all clean. Then commit ("seo: MONEYPAGE.1 /contact money page + blog CTA") and push to main. After Vercel deploys (wait up to 3 min), curl -s each and check:
- https://www.joeyc.ai/contact → 200; HTML contains the <title> from §2, the meta description, rel=canonical to https://www.joeyc.ai/contact, exactly one <h1> with "Work with me", the ContactPage JSON-LD, and NO "noindex".
- https://www.joeyc.ai/sitemap.xml contains https://www.joeyc.ai/contact.
- https://www.joeyc.ai/blog/how-i-use-claude-to-build-faster contains the "Work with me" link to /contact.
- https://www.joeyc.ai/blog still returns 200 with its existing title (unchanged).
- https://www.joeyc.ai/ unchanged (same first 300 bytes of <head> as before the deploy — diff against a pre-deploy curl you take first).
- Open https://www.joeyc.ai/contact in Playwright (or Chrome): the form renders and the page has one h1 after hydration; take no screenshots.
If deploy isn't done after 3 min, report dist-level checks as pass and live checks as "pending".

Print the report between the lines "=== REPORT — SEO.JOEYCAI.MONEYPAGE.1 ===" and "=== END REPORT ===": outcome/commit hash, departures with reasons, the verification table with pass/fail counts, git status, up to three worth-knowing notes. Under 60 lines, no diffs. Below END REPORT, print the final intro paragraph and the blog CTA sentence verbatim so the architect can review the copy.
