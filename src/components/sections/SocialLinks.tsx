import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { socials } from '../../data/socials'
import { useSocialBurst } from '../../hooks/useSocialBurst'

export function SocialLinks() {
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { onMouseEnter } = useSocialBurst()
  const [tappedPlatform, setTappedPlatform] = useState<string | null>(null)
  const tappedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Per-card primed state and timers
  const primedRef = useRef<Record<string, boolean>>({})
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleCardClick = (e: React.MouseEvent | React.TouchEvent, social: typeof socials[number]) => {
    if (social.comingSoon) return
    e.preventDefault()

    // Trigger burst animation
    const isTouchEvent = 'touches' in e
    const clientX = isTouchEvent ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = isTouchEvent ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY
    const fakeEvent = { currentTarget: e.currentTarget, clientX, clientY } as any
    onMouseEnter(fakeEvent, social.platform)

    if (primedRef.current[social.platform]) {
      // Second click — navigate
      clearTimeout(timerRef.current[social.platform])
      primedRef.current[social.platform] = false
      setTappedPlatform(null)
      window.open(social.url, '_blank', 'noopener,noreferrer')
    } else {
      // First click — prime the card
      if (tappedTimeoutRef.current) clearTimeout(tappedTimeoutRef.current)
      // Clear any other primed cards
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
    const grid = gridRef.current
    const observers: IntersectionObserver[] = []

    if (header) {
      gsap.set(header, { opacity: 0, y: 60 })
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { gsap.to(header, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }); obs.disconnect() } },
        { threshold: 0.1 }
      )
      obs.observe(header)
      observers.push(obs)
    }

    if (grid) {
      const cards = Array.from(grid.querySelectorAll('.social-card'))
      if (cards.length > 0) {
        gsap.set(cards, { opacity: 0, y: 80 })
        const obs = new IntersectionObserver(
          ([e]) => { if (e.isIntersecting) { gsap.to(cards, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out', stagger: 0.1 }); obs.disconnect() } },
          { threshold: 0.1 }
        )
        obs.observe(grid)
        observers.push(obs)
      }
    }

    return () => observers.forEach(obs => obs.disconnect())
  }, [])

  return (
    <section id="connect" className="py-28 px-6 bg-bg-section">
      <div className="max-w-5xl mx-auto">
        <div ref={headerRef}>
          <p className="section-label mb-6">
            {'// CONNECT'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Let's Connect
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            Find me across the internet. I'm always down to talk AI, building,
            or whatever you're working on.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {socials.map((social) => {
            const Icon = social.icon
            return (
              <a
                key={social.platform}
                href={social.comingSoon ? undefined : social.url}
                rel="noopener noreferrer"
                onClick={(e) => handleCardClick(e, social)}
                onTouchStart={(e) => handleCardClick(e, social)}
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
