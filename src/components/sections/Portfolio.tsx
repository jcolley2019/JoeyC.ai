import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../../data/projects'
import type { Project } from '../../types'

gsap.registerPlugin(ScrollTrigger)

const LETTERS = 'PROJECTS'.split('')
const BLUE_INDICES = new Set([2, 5]) // O and C get accent color

// ── ProjectCard ──────────────────────────────────────────────

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

const ProjectCard = forwardRef<HTMLDivElement, { project: Project }>(
  ({ project }, ref) => {
    const [hovered, setHovered] = useState(false)
    const lastTapRef = useRef(0)
    const videoRef = useRef<HTMLVideoElement>(null)

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

    const handleClick = useCallback(() => {
      if (!isTouchDevice) {
        openLink()
        return
      }
      const now = Date.now()
      if (hovered && now - lastTapRef.current < 300) {
        openLink()
      } else {
        setHovered(true)
        lastTapRef.current = now
      }
    }, [openLink, hovered])

    const dismissOverlay = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      setHovered(false)
    }, [])

    const startTime = project.videoStart ?? 0

    // 8-second loop clamp (only for single-video cards)
    const handleTimeUpdate = useCallback(() => {
      const vid = videoRef.current
      if (!vid) return
      // Skip 8s clamp if this card has a video2 (let it play through to onEnded)
      if (project.video2) return
      if (vid.currentTime >= startTime + 8) {
        vid.currentTime = startTime
        vid.play().catch(() => {})
      }
    }, [project.video2, startTime])

    // When video1 ends, switch to video2 if available
    const handleVideoEnded = useCallback(() => {
      const vid = videoRef.current
      if (vid && project.video2) {
        vid.src = project.video2
        vid.currentTime = 0
        vid.play().catch(() => {})
      }
    }, [project.video2])

    const handleMouseEnter = useCallback(() => {
      setHovered(true)
      const vid = videoRef.current
      if (vid && project.video) {
        // Always start from video1
        if (vid.src !== window.location.origin + project.video) {
          vid.src = project.video
        }
        vid.currentTime = startTime
        vid.play().catch(() => {})
      }
    }, [project.video, startTime])

    const handleMouseLeave = useCallback(() => {
      setHovered(false)
      const vid = videoRef.current
      if (vid) {
        vid.pause()
        // Reset src back to video1 for next hover
        if (project.video && vid.src !== window.location.origin + project.video) {
          vid.src = project.video
        }
        vid.currentTime = startTime
      }
    }, [project.video])

    return (
      <div
        ref={ref}
        className="project-card"
        style={{ opacity: 0 }}
        tabIndex={0}
        role="link"
        aria-label={`${project.title} — ${project.description}`}
        onMouseEnter={isTouchDevice ? undefined : handleMouseEnter}
        onMouseLeave={isTouchDevice ? undefined : handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Top: Image area */}
        <div className="project-card-image">
          {/* Gradient fallback */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${project.gradient[0]}, ${project.gradient[1]})`,
            }}
          />

          {/* Screenshot */}
          {project.image && (
            <img
              src={project.image}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          )}

          {/* Monogram (only when no image) */}
          {!project.image && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span
                className="font-display text-white/[0.08]"
                style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', fontWeight: 700 }}
              >
                {project.initials}
              </span>
            </div>
          )}

          {/* Video — always in DOM for preloading, toggled with opacity */}
          {project.video && (
            <video
              ref={videoRef}
              src={project.video}
              preload="auto"
              className={project.portraitVideo
                ? 'absolute z-10'
                : 'absolute inset-0 w-full h-full object-cover z-10'
              }
              style={{
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
                ...(project.portraitVideo ? {
                  width: 'auto',
                  height: '140%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                } : {}),
              }}
              muted
              playsInline
              loop
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onError={(e) => console.log('Video error:', project.title, project.video, e)}
              aria-hidden="true"
            />
          )}

          {/* Hover overlay — "Preview coming soon" or mobile tap hint */}
          {hovered && !project.video && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
              <span
                className="font-display text-text-secondary text-xs tracking-[0.2em] uppercase"
                style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
              >
                Preview coming soon
              </span>
            </div>
          )}
          {hovered && isTouchDevice && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20">
              <span
                className="font-display text-text-secondary text-xs tracking-[0.2em] uppercase"
                style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
              >
                Tap again to visit →
              </span>
              <button
                onClick={dismissOverlay}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Bottom: Info below the image */}
        <div className="project-card-info">
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

    // ── Reduced motion: simple static fallback ──
    if (prefersReducedMotion) {
      section.style.height = 'auto'
      pin.style.height = 'auto'
      box.style.display = 'none'
      if (mobileHeadingRef.current) mobileHeadingRef.current.style.display = 'block'
      lettersWrap.style.display = 'none'

      const mobileGrid = gridRef.current
      if (mobileGrid) {
        mobileGrid.style.position = 'relative'
        mobileGrid.style.top = 'auto'
        mobileGrid.style.left = 'auto'
        mobileGrid.style.transform = 'none'
        mobileGrid.style.width = '100%'
      }

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

    // ── Mobile: Full ScrollTrigger animation with vertical letters ──
    if (isMobile) {
      if (mobileHeadingRef.current) mobileHeadingRef.current.style.display = 'none'

      const letters = lettersRef.current.filter(Boolean) as HTMLSpanElement[]
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
      if (!letters.length || !cards.length) return

      section.style.height = '600vh'

      // Force column layout before measuring so we get stacked height
      lettersWrap.style.flexDirection = 'column'

      // Measure vertical letters at scale 1
      gsap.set(box, { scale: 1, xPercent: -50, yPercent: -50 })
      gsap.set(lettersWrap, { scale: 1, xPercent: -50, yPercent: -50 })

      const mWrapRect = lettersWrap.getBoundingClientRect()
      const mNaturalWidth = mWrapRect.width + 80
      const mNaturalHeight = mWrapRect.height + 48

      box.style.width = mNaturalWidth + 'px'
      box.style.height = mNaturalHeight + 'px'

      const mEntryScale = 0.4
      gsap.set(box, { xPercent: -50, yPercent: -50, scale: mEntryScale })
      gsap.set(lettersWrap, { xPercent: -50, yPercent: -50, scale: mEntryScale })

      const mFullWidth = window.innerWidth * 0.90 - 40
      const mFullHeight = window.innerHeight - 80  // viewport minus navbar

      // Position grid to align with expanded box on mobile
      const grid = gridRef.current
      if (grid) {
        grid.style.width = mFullWidth + 'px'
        grid.style.left = '50%'
        grid.style.top = '60px'
        grid.style.bottom = 'auto'
        grid.style.transform = 'translateX(-50%)'
        grid.style.paddingTop = '0px'
        grid.style.height = 'auto'
        // Ensure grid starts at y:0 — card 1 at top, no negative offset
        gsap.set(grid, { y: 0, xPercent: -50, yPercent: 0 })
      }

      // Pre-compute mobile scatter: P flies UP, S flies DOWN, middle scatter left/right
      const mLetterTargets = letters.map((_, i) => {
        if (i === 0) return { x: 0, y: '-120vh', rotation: -15 }
        if (i === 7) return { x: 0, y: '120vh', rotation: 15 }
        const xDir = i % 2 === 0 ? -1 : 1
        return {
          x: xDir * gsap.utils.random(200, 400),
          y: gsap.utils.random(-100, 100),
          rotation: gsap.utils.random(-20, 20),
        }
      })

      // Cards alternate entry: odd from left, even from right
      const mCardEntryX = cards.map((_, i) => i % 2 === 0 ? '-110vw' : '110vw')
      const mCardEntryRot = cards.map(() => gsap.utils.random(-3, 3))
      const mCardExitX = cards.map((_, i) => i % 2 === 0 ? '-110vw' : '110vw')

      gsap.set(cards, {
        x: (i: number) => mCardEntryX[i],
        opacity: 0,
        scale: 0.8,
        rotation: (i: number) => mCardEntryRot[i],
      })

      // Double-tap detection for mobile
      let lastTapTime = 0
      const handleCardTap = (_card: HTMLDivElement, index: number) => {
        const now = Date.now()
        if (now - lastTapTime < 300) {
          // Double tap — open link
          const project = projects[index]
          if (project.link.startsWith('/')) {
            window.location.href = project.link
          } else {
            window.open(project.link, '_blank', 'noopener,noreferrer')
          }
        }
        lastTapTime = now
      }

      // Attach tap listeners
      cards.forEach((card, i) => {
        const handler = () => handleCardTap(card, i)
        card.addEventListener('touchend', handler, { passive: true })
        ;(card as any)._tapHandler = handler
      })

      const mTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: pin,
          scrub: 3,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress
            gridRef.current?.classList.toggle('cards-interactive', p > 0.45 && p < 0.82)
          },
        },
      })

      // Phase 1: Box + text zoom in (0 → 0.08)
      mTl.to(box, { scale: 1, duration: 0.08, ease: 'power2.out' }, 0)
      mTl.to(lettersWrap, { scale: 1, duration: 0.08, ease: 'power2.out' }, 0)

      // Phase 2: Box widens (0.08 → 0.18)
      mTl.to(box, { width: mFullWidth, duration: 0.10, ease: 'power2.inOut' }, 0.08)
      mTl.to(box, { height: mFullHeight, duration: 0.07, ease: 'power2.inOut' }, 0.18)

      // Phase 2b: Box scales beyond viewport and fades out (0.20 → 0.28)
      mTl.to(box, { scale: 3, opacity: 0, duration: 0.08, ease: 'power2.in' }, 0.20)
      mTl.to(lettersWrap, { opacity: 0, duration: 0.08, ease: 'power2.in' }, 0.20)

      // Phase 3: Letters scatter (0.25 → 0.35)
      mTl.to(letters, {
        x: (i: number) => mLetterTargets[i].x as number,
        y: (i: number) => mLetterTargets[i].y as number,
        rotation: (i: number) => mLetterTargets[i].rotation,
        opacity: 0,
        duration: 0.10,
        stagger: 0.008,
        ease: 'power2.inOut',
      } as gsap.TweenVars, 0.25)

      // Phase 4: Cards fly in alternating left/right (0.35 → 0.50)
      mTl.to(cards, {
        x: 0,
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.15,
        stagger: 0.012,
        ease: 'power2.out',
      }, 0.35)

      // Phase 5: Grid shifts UP to reveal cards 5 and 6 (0.50 → 0.72)
      if (grid) {
        // Measure total grid height vs visible area
        // Cards are (100vh-120px)/4 each in CSS, 6 cards + 5 gaps of 12px
        const mCardH = (window.innerHeight - 120) / 4
        const mTotalH = mCardH * cards.length + 12 * (cards.length - 1)
        const mVisibleH = window.innerHeight - 80 // viewport minus top offset
        const mOverflow = Math.max(0, mTotalH - mVisibleH) + 60
        if (mOverflow > 0) {
          mTl.to(grid, { y: -mOverflow, duration: 0.22, ease: 'none' }, 0.50)
          // Reset grid y AFTER cards have exited (0.90)
          mTl.set(grid, { y: 0 }, 0.90)
        }
      }

      // Phase 6: Pinned idle — all 6 cards visible (0.72 → 0.82)
      mTl.to({}, { duration: 0.10 }, 0.72)

      // Phase 7: Cards exit alternating (0.82 → 0.90)
      mTl.to(cards, {
        x: (i: number) => mCardExitX[i],
        opacity: 0,
        scale: 0.6,
        rotation: (_i: number) => gsap.utils.random(-5, 5),
        duration: 0.08,
        stagger: 0.008,
        ease: 'power3.in',
      }, 0.82)

      // Phase 8: Box returns — scale back to 1, opacity back to 1 (0.90 → 0.93)
      mTl.set(box, { scale: 3 }, 0.90)
      mTl.to(box, { scale: 1, opacity: 1, duration: 0.03, ease: 'power2.out' }, 0.90)
      mTl.to(lettersWrap, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0.90)

      // Phase 9: Letters reassemble (0.93 → 0.96)
      mTl.to(letters, {
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        scale: 1,
        duration: 0.03,
        stagger: 0.004,
        ease: 'power2.out',
      }, 0.93)

      // Phase 10: Box shrinks back + fades (0.96 → 1.0)
      mTl.to(box, { height: mNaturalHeight, width: mNaturalWidth, scale: mEntryScale, duration: 0.02, ease: 'power1.inOut' }, 0.96)
      mTl.to(lettersWrap, { scale: mEntryScale, duration: 0.02, ease: 'power2.in' }, 0.96)
      mTl.to(box, { opacity: 0, duration: 0.02, ease: 'power1.in' }, 0.98)
      mTl.to(lettersWrap, { opacity: 0, duration: 0.02, ease: 'power1.in' }, 0.98)

      // Debounced resize
      let mResizeTimer: number
      const mDebouncedResize = () => {
        clearTimeout(mResizeTimer)
        mResizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200)
      }
      window.addEventListener('resize', mDebouncedResize)

      return () => {
        mTl.kill()
        window.removeEventListener('resize', mDebouncedResize)
        clearTimeout(mResizeTimer)
        cards.forEach((card) => {
          const handler = (card as any)._tapHandler
          if (handler) card.removeEventListener('touchend', handler)
        })
      }
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
    const fullHeight = window.innerHeight - 100

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
      x: (i: number) => letterTargets[i].x as number,
      y: (i: number) => letterTargets[i].y as number,
      rotation: (i: number) => letterTargets[i].rotation,
      opacity: 0,
      duration: 0.12,
      stagger: 0.008,
      ease: 'power2.inOut',
    } as gsap.TweenVars, 0.28)

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
                fontSize: 'clamp(3rem, 12vw, 9rem)',
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
