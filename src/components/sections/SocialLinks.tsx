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

  const handleTouchStart = (e: React.TouchEvent, social: typeof socials[number]) => {
    if (social.comingSoon) return
    e.preventDefault()

    const touch = e.touches[0]
    const fakeEvent = {
      currentTarget: e.currentTarget,
      clientX: touch.clientX,
      clientY: touch.clientY
    } as any
    onMouseEnter(fakeEvent, social.platform)

    if (tappedPlatform === social.platform) {
      clearTimeout(tappedTimeoutRef.current!)
      setTappedPlatform(null)
      window.open(social.url, '_blank')
    } else {
      if (tappedTimeoutRef.current) clearTimeout(tappedTimeoutRef.current)
      setTappedPlatform(social.platform)
      tappedTimeoutRef.current = setTimeout(() => {
        setTappedPlatform(null)
      }, 3000)
    }
  }

  useEffect(() => {
    return () => {
      if (tappedTimeoutRef.current) clearTimeout(tappedTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    // Header
    if (headerRef.current) {
      gsap.set(headerRef.current, { opacity: 0, y: 60 })
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(headerRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(headerRef.current)
    }

    // Social cards — stagger up from below
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.social-card')
      gsap.set(cards, { opacity: 0, y: 80 })

      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(cards, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out', stagger: 0.1 })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(gridRef.current)
    }
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
                target={social.comingSoon ? undefined : '_blank'}
                rel="noopener noreferrer"
                onMouseEnter={(e) => !social.comingSoon && onMouseEnter(e, social.platform)}
                onTouchStart={(e) => handleTouchStart(e, social)}
                className={`social-card group relative flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-card transition-all duration-300 hover:scale-105 hover:border-[#4a6fa5]/50 hover:shadow-[0_0_30px_rgba(26,143,255,0.1)] overflow-visible ${
                  social.comingSoon ? 'opacity-40 cursor-default' : ''
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
                {!social.comingSoon && (
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
                )}
                {tappedPlatform === social.platform && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-28px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    color: '#1a8fff',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(26,143,255,0.3)',
                    zIndex: 50,
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    TAP AGAIN TO VISIT
                  </div>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
