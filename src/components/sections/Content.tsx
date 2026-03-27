import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { socials } from '../../data/socials'
import { useSocialBurst } from '../../hooks/useSocialBurst'

export function Content() {
  const headerRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const connectHeaderRef = useRef<HTMLDivElement>(null)
  const socialGridRef = useRef<HTMLDivElement>(null)
  const { onMouseEnter } = useSocialBurst()
  const [tappedPlatform, setTappedPlatform] = useState<string | null>(null)
  const tappedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Per-card primed state and timers
  const primedRef = useRef<Record<string, boolean>>({})
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Track whether a touch just happened so we can ignore the duplicate onClick
  const touchHandledRef = useRef(false)

  const handleCardInteraction = (e: React.MouseEvent | React.TouchEvent, social: typeof socials[number]) => {
    if (social.comingSoon) return
    e.preventDefault()
    e.stopPropagation()

    const isTouchEvent = 'touches' in e || e.type === 'touchend'

    if (!isTouchEvent && touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }

    if (isTouchEvent) {
      touchHandledRef.current = true
      setTimeout(() => { touchHandledRef.current = false }, 400)
    }

    const clientX = isTouchEvent
      ? (e.nativeEvent as TouchEvent).changedTouches?.[0]?.clientX ?? 0
      : (e as React.MouseEvent).clientX
    const clientY = isTouchEvent
      ? (e.nativeEvent as TouchEvent).changedTouches?.[0]?.clientY ?? 0
      : (e as React.MouseEvent).clientY
    const fakeEvent = { currentTarget: e.currentTarget, clientX, clientY } as any
    onMouseEnter(fakeEvent, social.platform)

    if (primedRef.current[social.platform]) {
      clearTimeout(timerRef.current[social.platform])
      primedRef.current[social.platform] = false
      setTappedPlatform(null)
      window.open(social.url, '_blank', 'noopener,noreferrer')
    } else {
      if (tappedTimeoutRef.current) clearTimeout(tappedTimeoutRef.current)
      Object.keys(primedRef.current).forEach(k => {
        if (primedRef.current[k]) {
          clearTimeout(timerRef.current[k])
          primedRef.current[k] = false
        }
      })

      primedRef.current[social.platform] = true
      setTappedPlatform(social.platform)

      timerRef.current[social.platform] = setTimeout(() => {
        primedRef.current[social.platform] = false
        setTappedPlatform((prev) => prev === social.platform ? null : prev)
      }, 3000)
    }
  }

  useEffect(() => {
    return () => {
      if (tappedTimeoutRef.current) clearTimeout(tappedTimeoutRef.current)
      Object.values(timerRef.current).forEach(t => clearTimeout(t))
    }
  }, [])

  useEffect(() => {
    const header = headerRef.current
    const photo = photoRef.current
    const connectHeader = connectHeaderRef.current
    const socialGrid = socialGridRef.current
    const observers: IntersectionObserver[] = []

    // Header — slide from left
    if (header) {
      gsap.set(header, { opacity: 0, x: -150 })
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { gsap.to(header, { opacity: 1, x: 0, duration: 0.8, ease: 'power4.out' }); obs.disconnect() } },
        { threshold: 0.1 }
      )
      obs.observe(header)
      observers.push(obs)
    }

    // Photo — fade up
    if (photo) {
      gsap.set(photo, { opacity: 0, y: 60 })
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { gsap.to(photo, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }); obs.disconnect() } },
        { threshold: 0.1 }
      )
      obs.observe(photo)
      observers.push(obs)
    }

    // Connect header — fade up
    if (connectHeader) {
      gsap.set(connectHeader, { opacity: 0, y: 60 })
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { gsap.to(connectHeader, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }); obs.disconnect() } },
        { threshold: 0.1 }
      )
      obs.observe(connectHeader)
      observers.push(obs)
    }

    // Social cards — stagger up
    if (socialGrid) {
      const cards = Array.from(socialGrid.querySelectorAll('.social-card'))
      if (cards.length > 0) {
        gsap.set(cards, { opacity: 0, y: 80 })
        const obs = new IntersectionObserver(
          ([e]) => { if (e.isIntersecting) { gsap.to(cards, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out', stagger: 0.1 }); obs.disconnect() } },
          { threshold: 0.1 }
        )
        obs.observe(socialGrid)
        observers.push(obs)
      }
    }

    return () => observers.forEach(obs => obs.disconnect())
  }, [])

  return (
    <section id="content" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* === CONTENT HEADER === */}
        <div ref={headerRef}>
          <p className="section-label mb-6">
            {'// CONTENT'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Building in Public
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            I share everything I'm learning and building. Quick tips, full build
            sessions, wins, and fails.
          </p>
        </div>

        {/* === PERSONAL PHOTO + TAGLINES === */}
        <div ref={photoRef} className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-0 mb-10">
          <div className="w-[40%] sm:w-auto shrink-0">
            <img
              src="/photos/joey-hero5.png"
              alt="Joey Colley"
              className="w-full sm:w-[240px] md:w-[280px] h-auto object-contain"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              }}
            />
          </div>
          <div className="flex flex-col sm:items-center sm:mt-4">
            <p className="font-display text-white font-bold text-[1.6rem] sm:text-[1.8rem] md:text-[2rem] leading-tight mb-3">
              Joey Colley
            </p>
            <div className="flex flex-col sm:items-center gap-1">
              <p className="font-mono text-xs sm:text-sm" style={{ color: '#8892a4', letterSpacing: '0.1em' }}>
                {'// Content Creator'}
              </p>
              <p className="font-mono text-xs sm:text-sm" style={{ color: '#1a8fff', letterSpacing: '0.1em' }}>
                {'// Technology Explorer'}
              </p>
              <p className="font-mono text-xs sm:text-sm" style={{ color: '#8892a4', letterSpacing: '0.1em' }}>
                {'// AI Educator'}
              </p>
            </div>
          </div>
        </div>

        {/* === FIND ME EVERYWHERE + SOCIAL CARDS === */}
        <div ref={connectHeaderRef}>
          <h3 className="text-xl font-bold mb-6">Find Me Everywhere</h3>
        </div>

        <div ref={socialGridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {socials.map((social) => {
            const Icon = social.icon
            return (
              <a
                key={social.platform}
                href={social.comingSoon ? undefined : social.url}
                rel="noopener noreferrer"
                onClick={(e) => handleCardInteraction(e, social)}
                onTouchEnd={(e) => handleCardInteraction(e, social)}
                onMouseEnter={(e) => !social.comingSoon && onMouseEnter(e, social.platform)}
                className={`social-card group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(26,143,255,0.1)] overflow-visible ${
                  social.comingSoon
                    ? 'opacity-40 cursor-default border-border bg-bg-card'
                    : tappedPlatform === social.platform
                      ? 'border-[#1a8fff]/50 bg-[#1a8fff]/5 scale-[1.02]'
                      : 'border-border bg-bg-card hover:border-[#4a6fa5]/50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-text-secondary group-hover:text-primary group-hover:border-primary/30 transition-all">
                  <Icon className="text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{social.platform}</p>
                  <p className="font-mono text-xs text-text-secondary truncate">
                    {social.comingSoon ? 'Coming soon' : social.url.replace('https://www.', '').replace('https://', '')}
                  </p>
                </div>
                {!social.comingSoon && tappedPlatform === social.platform ? (
                  <span className="text-[10px] font-mono text-[#1a8fff] whitespace-nowrap animate-pulse shrink-0">
                    tap again →
                  </span>
                ) : !social.comingSoon ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-text-secondary/30 group-hover:text-primary transition-colors shrink-0"
                  >
                    <path d="M3 8h10m-4-4l4 4-4 4" />
                  </svg>
                ) : null}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
