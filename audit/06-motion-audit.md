# 06 — Scroll & motion audit (JCAI-FIX-04 / M1)

Scope: the landing-page motion system as of `023f1da`. Rule for this phase: **same choreography, modern mechanics**. Nothing below changes a timing, easing, distance, stagger, scale or trigger value; items marked *recommendation* are questions for the owner, not work done in FIX-04.

## Baseline capture

- Dev server, `/` only, Chromium via Playwright, 1440×900 (mouse) and 390×844 (touch + mobile UA).
- 21 stops at 0 %, 5 %, … 100 % of `scrollHeight − innerHeight`. After each stop: 400 ms, then wait until two consecutive frames are byte-identical (cap 4 s) so IntersectionObserver reveals (0.8 s) and the scrub lag (1 s desktop / 3 s mobile) have finished. Frames are taken with Playwright `animations: 'disabled'`, which holds infinite CSS keyframes (particles, scan bars, gradient text, divider scan) at a fixed phase; GSAP is JavaScript-driven and is not affected.
- `Math.random` is pinned to `0.5` in the page for the capture so the particle field and the Portfolio scatter values are identical from run to run, and the hero letter-swap (`Math.random() > 0.98`) never fires. Baseline frames therefore show every particle in one column; that is a capture artefact, not the live look.
- Reproducibility check, two captures of the same code: worst step 0.153 % differing pixels (390 step-00), 0 steps above 0.5 %. Without the settle-wait the same comparison reached 2.68 % (1440 step-09) purely from tween timing, which is why the wait exists.
- Files: `audit/motion/baseline/{1440,390}/step-NN.png` + `steps.json` (scroll offsets and settle times); `audit/motion/baseline/{1440,390}.webm` (smooth 12 s scroll, git-ignored).
- Video hover is inert during capture: no pointer events are dispatched, so no `<video>` ever plays and MouseGlow never draws.

## Per-file findings

### `src/components/sections/Hero.tsx`
- **Technique.** `HeroName`: `gsap.set` + `gsap.to` staggered letter reveal (0.8 s, stagger 0.05, `power4.out`, delay 0.6), then after 3 s a 100 ms `setInterval` that, 2 % of ticks, adds `letter-blue` and a `to-{dir}` class with nested `setTimeout`s at 200 / 3200 / +200 ms; the slide itself is a CSS keyframe. `Hero`: one `gsap.fromTo` on `.hero-card` (x 60 → 0, 1 s, delay 0.8) gated on `(min-width: 1367px)`. `Particles`: 60 absolutely-positioned divs on a CSS `particleFloat` loop with random left/delay/duration. Scan bar: CSS `lowerThirdScan` loop.
- **Cleanup.** The 3 s start timer and the interval are cleared; the three nested `setTimeout`s inside `animateChar` are not (L4-13): unmounting mid-swap leaves timers that touch detached spans. The GSAP tweens are never killed; on a fast unmount (route change during the first 1.4 s) they keep ticking against detached nodes.
- **Reduced motion.** Not honoured: letter reveal, card slide, particles and scan bar all run.
- **Resize.** No dependency on viewport numbers; `clamp()` handles sizing. The 1367 px card gate is evaluated once at mount, which matches the CSS breakpoint that hides the card, so a resize across it only misses the entrance tween (card appears at opacity 0 → the CSS then hides it below 1366 px; above it, the card stays at opacity 0 until reload). Minor, pre-existing.
- **Verdict.** Modernize mechanics: `useGSAP` for the tweens, a `Set` of timeout ids cleared in cleanup, particles capped at 20 rendered nodes, CSS reduced-motion end-states.
- **Scroll-driven CSS?** No. Nothing here is scroll-linked; the reveal is time-based on load. A CSS `@starting-style`/keyframe entrance could replace the GSAP stagger, but that is a re-implementation with no functional gain.

### `src/components/sections/About.tsx`
- **Technique.** `gsap.set` initial (text y 60, photo x 150), one `IntersectionObserver` at threshold 0.1 on the section wrapper; on first intersection two `gsap.to` (0.8 s, `power4.out`) then `obs.disconnect()`.
- **Cleanup.** Observer disconnected on unmount. Tweens are not killed (only matters if unmounted during the 0.8 s).
- **Reduced motion.** Ignored; content is invisible until the observer fires, then animates.
- **Resize.** No viewport numbers baked in.
- **Verdict.** Modernize mechanics: move into `useGSAP` (observer created inside, disconnected in the cleanup). Same threshold, same one-shot.
- **Scroll-driven CSS?** Yes, in principle: `animation-timeline: view()` with `animation-range: entry 0% entry 10%` reproduces a one-shot fade-up without JS. Not done here because CSS view-timelines *reverse* when scrolling back up unless frozen, which would be a visible choreography change from today's one-shot reveal.

### `src/components/sections/Content.tsx`
- **Technique.** Four independent `IntersectionObserver`s (header x −150, photo y 60, connect header y 60, social cards y 80 with stagger 0.1), each threshold 0.1, each one-shot. Separate effect owns tap/prime timers for the social cards.
- **Cleanup.** All four observers disconnected; timers cleared in their own effect. Tweens not killed.
- **Reduced motion.** Ignored.
- **Resize.** Nothing viewport-derived.
- **Verdict.** Modernize mechanics: `useGSAP` wrapper, observers inside. Leave the timer effect alone (already correct).
- **Scroll-driven CSS?** Same answer as About: feasible, but reversal-on-scroll-up differs from the one-shot behaviour, so recommendation only.

### `src/components/sections/Contact.tsx`
- **Technique.** One observer on the section (threshold 0.1) → two `gsap.to` (left x −150 → 0, right x 150 → 0, 0.8 s `power4.out`). `gradient-text` CSS loop on the heading.
- **Cleanup.** Observer disconnected; tweens not killed.
- **Reduced motion.** Ignored (including the 4 s gradient shift).
- **Resize.** Nothing viewport-derived.
- **Verdict.** Modernize mechanics: `useGSAP`; `gradient-text` gets a static end state under reduced motion.
- **Scroll-driven CSS?** Feasible for the slide-in with the same reversal caveat; recommendation only.

### `src/components/sections/BlogPreview.tsx`
- **Technique.** Effect keyed on `[posts]`: header y 60 (threshold 0.1) and cards x 200 with stagger 0.15 / `power3.out` (threshold 0.2 on the grid). Because the effect re-runs when the Supabase result arrives, the placeholder cards are `gsap.set` to opacity 0 twice: once for the empty array (no cards, no-op) and once for the real posts.
- **Cleanup.** Observers disconnected on every re-run; tweens not killed. If the fetch resolves *after* the header has already animated in, the re-run resets the header to opacity 0 / y 60 and re-observes it — visible only if the section is already on screen when the data lands (slow network + fast scroll). Pre-existing; not changed in M2 because fixing it alters what a slow-network visitor sees.
- **Reduced motion.** Ignored.
- **Resize.** Nothing viewport-derived.
- **Verdict.** Modernize mechanics: `useGSAP` with `dependencies: [posts]` and `revertOnUpdate: true` so the re-run reverts the previous run's inline styles before applying new ones. Same thresholds and values. *Recommendation:* observe the header only once (guard with a ref) so a late fetch cannot re-hide it.
- **Scroll-driven CSS?** Cards could use `view()` timelines; same reversal caveat.

### `src/components/sections/Portfolio.tsx`
- **Technique.** ScrollTrigger pin of `.projects-pin-container` over a 400vh (desktop) / 600vh (mobile) section, `scrub: 1` desktop / `scrub: 3` mobile, `anticipatePin: 1`, `onUpdate` toggles `cards-interactive` on a progress window. Desktop: 10-phase timeline (box zoom, widen to `min(innerWidth·0.95, innerWidth−40)`, heighten to `innerHeight−100`, letter scatter with `gsap.utils.random`, cards tumble in from `110vw`, idle, exit left, letters reassemble, box shrink, fade). Mobile: 10-phase variant with vertical letters, `mFullWidth = innerWidth·0.9 − 40`, `mFullHeight = innerHeight − 80`, grid shift measured from real card height, `touchend` double-tap handler per card. Reduced-motion branch: unpins, hides box and letters, shows the static heading, per-card fade-up via observer.
- **Cleanup.** `tl.kill()` / `mTl.kill()` kill the timeline and its ScrollTrigger; resize listener and debounce timer removed; touch handlers removed. `gsap.set` inline styles and the manual `element.style.*` writes are **not** reverted, so a remount (e.g. HMR, or a future route that unmounts `/`) starts from stale inline state.
- **Reduced motion.** Handled once at mount via `matchMedia().matches`; a change of the OS setting while the page is open is not observed. The CSS block in `index.css` also forces `.project-card` / `.projects-title-letter` to opacity 1 under reduce.
- **Resize / orientation.** `isMobile`, `fullWidth`, `fullHeight`, `mFullWidth`, `mFullHeight`, `mOverflow` are captured **once** at mount and baked into tween end values; resize only calls `ScrollTrigger.refresh()`, which re-measures the pin but not the tween targets. Rotating a phone from 390 to 844 wide keeps the mobile branch with a 311 px box and mobile letter layout (L4-18). This is the one real functional bug in scope.
- **Verdict.** Modernize mechanics: `gsap.matchMedia()` with three contexts, `(max-width: 767px) and (prefers-reduced-motion: no-preference)`, `(min-width: 768px) and (prefers-reduced-motion: no-preference)`, and `(prefers-reduced-motion: reduce)`. matchMedia re-runs the correct setup when a query flips and reverts the previous context's tweens, ScrollTriggers and `gsap.set` styles. Every numeric value, ease, stagger, phase position and scrub setting stays identical. Manual `element.style.*` writes are moved onto `gsap.set` so they are reverted too.
- **Scroll-driven CSS?** No. Pinning plus a scrubbed, multi-phase timeline with measured layout values is exactly what ScrollTrigger exists for; a CSS `scroll()` timeline cannot pin or express the phase overlaps without a large rewrite. Keep GSAP.
- *Recommendations (not done):* (1) the desktop `x: '110vw'` card entry and `-120vw` letter exits are safe for any width, but `fullWidth` clamps oddly on ultra-wide screens (0.95·w vs w−40 always picks w−40 above 800 px), so the box never reaches 95 % — harmless, just misleading code. (2) On touch devices the `touchend` double-tap and `ProjectCard`'s own tap-to-play both fire on the same tap; consider one handler.

### `src/components/layout/Navbar.tsx`
- **Technique.** Scroll listener sets a `scrolled` class (CSS transition). Menu open: `gsap.fromTo` overlay (0.4 s), links (0.6 s, stagger 0.08, delay 0.15), label (0.5 s, delay 0.1); close: `gsap.to` overlay opacity 0 → `setMenuOpen(false)`; link click: `setTimeout(350)` then `gsap.to(window, { scrollTo })` (ScrollToPlugin, 1 s `power2.inOut`).
- **Cleanup.** Scroll listener and `body.overflow` restored. The open/close tweens are never killed; the 350 ms timeout is untracked. Opening and closing the menu rapidly can leave an opacity tween running against a node that React has removed (harmless in practice because the overlay unmounts). The scroll tween outlives the component if the user navigates during the 1 s.
- **Reduced motion.** Ignored (0.4–1 s fades and a 1 s smooth scroll).
- **Resize.** N/A.
- **Verdict.** Modernize mechanics: `useGSAP` with `dependencies: [menuOpen]` for the open tweens; `contextSafe` for `close` and the scroll tween so they revert on unmount. Values unchanged. *Recommendation:* under reduced motion, jump (`duration: 0`) instead of the 1 s smooth scroll.
- **Scroll-driven CSS?** N/A (no scroll-linked motion).

### `src/components/ui/MouseGlow.tsx`
- **Technique.** Full-window `<canvas>`; a `requestAnimationFrame` loop every frame from mount: clears, lerps a glow toward the pointer (0.12), draws up to 120 trail particles spawned three per `mousemove`.
- **Cleanup.** Listeners and the rAF are removed.
- **Reduced motion.** Ignored.
- **Resize.** Canvas re-sized on `resize` (correct).
- **Idle cost.** The loop runs at 60 Hz forever, including on touch devices where no pointer ever arrives (canvas stays blank) and when the mouse is still.
- **Verdict.** Modernize mechanics: do not mount the loop when `(pointer: coarse)` matches; on fine pointers stop the loop 500 ms after the last `pointermove` and restart on the next one. Drawing during movement is byte-identical.
- **Scroll-driven CSS?** N/A.

### `src/hooks/useSocialBurst.ts`
- **Technique.** On card hover: a fresh `AudioContext` + oscillator chirp, then 8–12 detached `<div>`s with inline SVG appended to `body`, each on a two-phase `gsap.to` (burst 0.4 s → fall 1.5–2.5 s) and `el.remove()` on complete.
- **Cleanup.** Elements remove themselves; tweens complete on their own. Nothing is tied to the component lifecycle, so navigating away mid-burst leaves ≤ 2.5 s of tweens on body-level nodes that then remove themselves (acceptable). A new `AudioContext` per hover is never closed: browsers cap live contexts (Chrome ≈ 6 per tab) after which `new AudioContext()` throws and the hover handler aborts before spawning icons. Also, the first `AudioContext` before a user gesture is created in the *suspended* state (hover is not a gesture), so the sound is silent until a click has happened.
- **Reduced motion.** Ignored.
- **Resize.** Uses `innerWidth`/`innerHeight` at call time (correct).
- **Verdict.** Keep (not in the M2 change list; the owner scoped M2 to GSAP context, Hero timers, MouseGlow, CSS and particles). *Recommendations:* reuse one module-level `AudioContext` and `resume()` it; wrap the sound in try/catch so the burst still renders when audio fails; skip the burst under reduced motion.
- **Scroll-driven CSS?** N/A.

### `src/index.css` (keyframes + reduced-motion block)
- **Technique.** Infinite loops used on the landing page: `particleFloat` (`.particle`), `lowerThirdScan` (`.lower-third-scan`, two instances), `dividerScan` (`.section-divider::after`, every section boundary), `gradientShift` (`.gradient-text`, Contact heading). Finite: `letterToTop/Bottom/Left/Right` (3 s, hero letter swap), `letter-blue`/`letter-white` colour transitions. Defined but unused on `/`: `slideIn`, `slideInRight`, `fadeUp`, `scaleIn`, `float`, `typewriter`, `blink`, `gridPulse`, `fadeIn`, `slideInFromRight/OutToRight` (Studio).
- **Reduced motion.** The existing `@media (prefers-reduced-motion: reduce)` block only covers the Portfolio pin, cards and letters. None of the loops above stop, which is why the lane measured 70 running animations under `reduce`.
- **Verdict.** Modernize: extend the block so `.particle`, `.lower-third-scan`, `.section-divider::after`, `.gradient-text`, `.to-*` and `.letter-blue/.letter-white` resolve to their static end state (`animation: none`, explicit final `opacity`/`background-position`, `transition: none`). No change outside `reduce`.
- **Scroll-driven CSS?** N/A; these are time loops.

## Ranked list — what M2 changes

1. **Portfolio → `gsap.matchMedia()`** (three contexts; fixes orientation change; everything reverts). Highest value, highest care.
2. **`useGSAP` in Hero, About, Content, Contact, BlogPreview, Navbar** so every tween / `gsap.set` reverts on unmount; observers created inside and disconnected in cleanup. Same thresholds, same values.
3. **Hero timer leak**: `Set` of timeout ids cleared with the interval.
4. **MouseGlow idle/coarse gating**: no loop on touch, loop parks 500 ms after the last move.
5. **CSS reduced-motion end states** for every keyframe class on `/`; particles rendered count 60 → 20.
6. **`@gsap/react@2.1.2`** added (the only dependency change).

## What M2 will not change

- Any duration, delay, ease, stagger, distance, scale, threshold, scrub, phase position or section height.
- The IntersectionObserver one-shot pattern (no switch to ScrollTrigger `once`, no switch to CSS view timelines).
- `useSocialBurst` (recommendations above only).
- BlogPreview's re-run-on-fetch behaviour (revert-on-update keeps it equivalent, the late-fetch reset stays).
- Navbar's 1 s smooth scroll under reduced motion.

## Questions for the owner (choreography / scroll-driven CSS)

Each is a visible change and therefore out of scope for FIX-04.

1. **CSS `view()` timelines for About / Content / Contact / BlogPreview reveals.** Effect: reveals would replay (and un-reveal) when scrolling back up instead of staying revealed; zero JS for these four sections.
2. **Reduced motion for the Navbar scroll.** Effect: anchor links jump instantly instead of a 1 s glide when the OS asks for less motion.
3. **BlogPreview header guard.** Effect: on a slow connection the header no longer re-hides and re-reveals when posts arrive.
4. **Social burst audio.** Effect: the chirp becomes audible on the first hover after any click and never blocks the icon burst; one shared AudioContext.
5. **Portfolio touch handlers.** Effect: a single tap on mobile would either play the preview *or* count toward the double-tap, not both.
6. **Portfolio ultra-wide clamp.** Effect: on screens wider than 800 px the expanded box could actually reach 95 % width instead of `width − 40`; purely cosmetic on very wide monitors.
