import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../../data/projects'
import type { Project } from '../../types'

gsap.registerPlugin(ScrollTrigger)

const LETTERS = 'PROJECTS'.split('')
const BLUE_INDICES = new Set([2, 5]) // O and C get accent color

// ── ProjectCard ──────────────────────────────────────────────

const ProjectCard = forwardRef<HTMLDivElement, { project: Project }>(
  ({ project }, ref) => {
    const [hovered, setHovered] = useState(false)

    const openLink = useCallback(() => {
      if (project.link.startsWith('/')) {
        window.location.href = project.link
      } else {
        window.open(project.link, '_blank', 'noopener,noreferrer')
      }
    }, [project.link])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openLink()
      }
    }, [openLink])

    return (
      <div
        ref={ref}
        className="project-card"
        style={{ opacity: 0 }}
        tabIndex={0}
        role="link"
        aria-label={`${project.title} — ${project.description}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={openLink}
        onKeyDown={handleKeyDown}
      >
        {/* Layer 1: Gradient background */}
        {/* TODO: Replace gradient with screenshot */}
        {/* <img src={`/photos/projects/${project.initials.toLowerCase()}.jpg`} alt={project.title} /> */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${project.gradient[0]}, ${project.gradient[1]})`,
          }}
        />

        {/* Layer 2: Monogram initials */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span
            className="font-display text-white/[0.08]"
            style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', fontWeight: 700 }}
          >
            {project.initials}
          </span>
        </div>

        {/* Layer 3: Video overlay (hover) */}
        {hovered && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 transition-opacity">
            {/* TODO: Add video src when ready */}
            <video
              className="absolute inset-0 w-full h-full object-cover opacity-0"
              muted
              loop
              playsInline
              aria-hidden="true"
            />
            <span
              className="font-display text-text-secondary text-xs tracking-[0.2em] uppercase"
              style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
            >
              Preview coming soon
            </span>
          </div>
        )}

        {/* Layer 4: Info */}
        <div
          className="relative z-[5] p-5 flex flex-col justify-end h-full"
          style={{ minHeight: '220px' }}
        >
          <h3
            className="font-display text-lg mb-1"
            style={{ color: '#1a8fff' }}
          >
            {project.title}
          </h3>
          <p className="text-text-secondary text-sm leading-relaxed mb-3 line-clamp-2">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {project.tech.map((t) => (
              <span
                key={t}
                className="tag-mono px-2 py-0.5 rounded bg-primary/10 text-primary/80 border border-primary/10 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
          <span className="font-display text-primary text-sm tracking-wider">
            View Project →
          </span>
        </div>
      </div>
    )
  }
)

ProjectCard.displayName = 'ProjectCard'

// ── Portfolio Section ────────────────────────────────────────

export function Portfolio() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const pinContainerRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const lettersWrapRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const mobileHeadingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const pin = pinContainerRef.current
    const box = boxRef.current
    const lettersWrap = lettersWrapRef.current
    if (!section || !pin || !box || !lettersWrap) return

    // Check for mobile or reduced motion
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isMobile || prefersReducedMotion) {
      section.style.height = 'auto'
      pin.style.height = 'auto'
      box.style.display = 'none'
      if (mobileHeadingRef.current) mobileHeadingRef.current.style.display = 'block'

      const mobileGrid = gridRef.current
      if (mobileGrid) {
        mobileGrid.style.position = 'relative'
        mobileGrid.style.top = 'auto'
        mobileGrid.style.left = 'auto'
        mobileGrid.style.transform = 'none'
        mobileGrid.style.width = '100%'
      }

      // Hide desktop letters
      const lettersContainer = pin.querySelector('.projects-letters-wrap') as HTMLElement
      if (lettersContainer) lettersContainer.style.display = 'none'

      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.6, ease: 'power4.out' })
              obs.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1 }
      )
      cards.forEach((card) => {
        gsap.set(card, { opacity: 0, y: 30 })
        obs.observe(card)
      })
      return () => obs.disconnect()
    }

    // ── Desktop: Full ScrollTrigger 8-phase animation ──

    if (mobileHeadingRef.current) mobileHeadingRef.current.style.display = 'none'

    const letters = lettersRef.current.filter(Boolean) as HTMLSpanElement[]
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    if (!letters.length || !cards.length) return

    // ── Size the box to snugly fit the PROJECTS text ──
    // Reset scale to 1 before measuring so we get
    // the TRUE natural size of the text
    gsap.set(box, { scale: 1, xPercent: -50, yPercent: -50 })
    gsap.set(lettersWrap, { scale: 1, xPercent: -50, yPercent: -50 })

    const wrapRect = lettersWrap.getBoundingClientRect()
    const naturalWidth = wrapRect.width + 320  // 160px padding each side
    const naturalHeight = wrapRect.height * 1.2

    box.style.width = naturalWidth + 'px'
    box.style.height = naturalHeight + 'px'

    // Apply centering AFTER setting dimensions so GSAP centers correctly on any screen
    const entryScale = 0.5
    gsap.set(box, { xPercent: -50, yPercent: -50, scale: entryScale })
    gsap.set(lettersWrap, { xPercent: -50, yPercent: -50, scale: entryScale })

    // Calculate expansion targets — clamped to avoid exceeding viewport on smaller screens
    const fullWidth = Math.min(window.innerWidth * 0.95, window.innerWidth - 40)
    const fullHeight = Math.min(window.innerHeight * 0.75, window.innerHeight - 120)

    // ── Pre-compute random scatter values ──
    const letterTargets = letters.map((_, i) => {
      if (i === 0) return { x: '-120vw', y: 0, rotation: -15 }
      if (i === 7) return { x: '120vw', y: 0, rotation: 15 }
      const isAccent = BLUE_INDICES.has(i)
      const multiplier = isAccent ? 1.5 : 1
      const yDir = i % 2 === 0 ? -1 : 1
      return {
        x: (i - 4) * gsap.utils.random(40, 100) * multiplier,
        y: yDir * gsap.utils.random(100, 250) * multiplier,
        rotation: gsap.utils.random(-20, 20),
      }
    })

    const cardEntryRotations = cards.map(() => gsap.utils.random(-3, 3))
    const cardExitTargets = cards.map(() => ({
      x: gsap.utils.random(-110, -130) + 'vw',
      y: gsap.utils.random(-100, 100),
      rotation: gsap.utils.random(-10, 10),
    }))

    // ── Set initial card state (off-screen right) ──
    gsap.set(cards, {
      x: '110vw',
      opacity: 0,
      scale: 0.8,
      rotation: (i: number) => cardEntryRotations[i],
    })

    // ── Master timeline ──
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        pin: pin,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          const p = self.progress
          gridRef.current?.classList.toggle('cards-interactive', p > 0.50 && p < 0.75)
        },
      },
    })

    // ── Phase 1: Box + text zoom up together (0 → 0.10) ──
    tl.to(box, {
      scale: 1,
      duration: 0.10,
      ease: 'power2.out',
    }, 0)
    tl.to(lettersWrap, {
      scale: 1,
      duration: 0.10,
      ease: 'power2.out',
    }, 0)

    // ── Phase 2: Box widens horizontally (0.10 → 0.20) ──
    tl.to(box, {
      width: fullWidth,
      duration: 0.10,
      ease: 'power2.inOut',
    }, 0.10)

    // ── Phase 3: Box expands vertically (0.20 → 0.28) ──
    tl.to(box, {
      height: fullHeight,
      duration: 0.08,
      ease: 'power2.inOut',
    }, 0.20)

    // ── Phase 4: Letter scatter (0.28 → 0.40) ──
    tl.to(letters, {
      x: (i: number) => letterTargets[i].x,
      y: (i: number) => letterTargets[i].y,
      rotation: (i: number) => letterTargets[i].rotation,
      opacity: 0,
      duration: 0.12,
      stagger: 0.008,
      ease: 'power2.inOut',
    }, 0.28)

    // ── Phase 5: Cards tumble in from right (0.40 → 0.55) ──
    tl.to(cards, {
      x: 0,
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 0.15,
      stagger: 0.02,
      ease: 'power2.out',
    }, 0.40)

    // ── Phase 6: Pinned idle (0.55 → 0.72) — no tweens ──

    // ── Phase 7: Cards fly off LEFT (0.72 → 0.82) ──
    tl.to(cards, {
      x: (i: number) => cardExitTargets[i].x,
      y: (i: number) => cardExitTargets[i].y,
      rotation: (i: number) => cardExitTargets[i].rotation,
      opacity: 0,
      scale: 0.6,
      duration: 0.10,
      stagger: 0.012,
      ease: 'power3.in',
    }, 0.72)

    // ── Phase 8: Letters reassemble (0.82 → 0.88) ──
    tl.to(letters, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      scale: 1,
      duration: 0.06,
      stagger: 0.008,
      ease: 'power2.out',
    }, 0.82)

    // ── Phase 9: Box shrinks back (0.88 → 0.95) ──
    // Vertical shrink
    tl.to(box, {
      height: naturalHeight,
      duration: 0.035,
      ease: 'power1.inOut',
    }, 0.88)
    // Horizontal shrink
    tl.to(box, {
      width: naturalWidth,
      duration: 0.035,
      ease: 'power1.inOut',
    }, 0.915)

    // ── Phase 10: Box + text shrink to small + fade (0.95 → 1.0) ──
    tl.to(box, {
      scale: entryScale,
      duration: 0.03,
      ease: 'power2.in',
    }, 0.95)
    tl.to(lettersWrap, {
      scale: entryScale,
      duration: 0.03,
      ease: 'power2.in',
    }, 0.95)
    // Fade out
    tl.to(box, {
      opacity: 0,
      duration: 0.02,
      ease: 'power1.in',
    }, 0.98)
    tl.to(lettersWrap, {
      opacity: 0,
      duration: 0.02,
      ease: 'power1.in',
    }, 0.98)

    // ── Debounced resize handler ──
    let resizeTimer: number
    const debouncedResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        ScrollTrigger.refresh()
      }, 200)
    }
    window.addEventListener('resize', debouncedResize)

    // ── Cleanup ──
    return () => {
      tl.kill()
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      style={{ height: '400vh' }}
      className="relative bg-bg-section"
    >
      {/* Mobile / reduced-motion heading */}
      <div ref={mobileHeadingRef} className="px-6 pt-20 pb-8 max-w-5xl mx-auto" style={{ display: 'none' }}>
        <p className="section-label mb-6">{'// PROJECTS'}</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-3 font-display" style={{ color: '#1a8fff' }}>
          Things I've Built
        </h2>
        <p className="text-text-secondary mb-14 max-w-lg text-base">
          Real projects built with AI tools. Each one started as an idea and became something real.
        </p>
      </div>

      <div ref={pinContainerRef} className="projects-pin-container">
        {/* Visual box — scales independently, no children */}
        <div ref={boxRef} className="projects-box-visual" />

        {/* Letters wrapper — positioned like box, scales with it */}
        <div ref={lettersWrapRef} className="projects-letters-wrap" aria-label="PROJECTS">
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              ref={(el) => { lettersRef.current[i] = el }}
              aria-hidden="true"
              className="projects-title-letter font-display font-bold select-none"
              style={{
                fontSize: 'clamp(2rem, 8vw, 9rem)',
                color: BLUE_INDICES.has(i) ? '#1a8fff' : '#ffffff',
                textShadow: BLUE_INDICES.has(i)
                  ? '0 0 20px rgba(26, 143, 255, 0.4)'
                  : 'none',
                lineHeight: 1,
                letterSpacing: '0.05em',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Cards grid — centered in viewport, not inside box */}
        <div ref={gridRef} className="projects-grid">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.title}
              ref={(el) => { cardRefs.current[i] = el }}
              project={project}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
