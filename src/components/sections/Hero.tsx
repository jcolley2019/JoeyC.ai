import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'

function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 18,
      size: 3 + Math.random() * 1,
    })),
    []
  )

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[1]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

const NAME_LETTERS = 'JOEY COLLEY'.split('')

function HeroName() {
  const containerRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([])
  const tickRef = useRef<number>(0)

  useEffect(() => {
    const letters = lettersRef.current.filter(Boolean) as HTMLSpanElement[]
    if (!letters.length) return

    // Set initial state
    gsap.set(letters, {
      opacity: 0,
      y: 60,
    })

    // Staggered reveal — left to right
    gsap.to(letters, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.05,
      ease: 'power4.out',
      delay: 0.6,
    })

    // Start the random letter animation 3 seconds after page load
    const startDelay = window.setTimeout(() => {
      const animateChar = () => {
        if (Math.random() > 0.98) {
          const char = letters[Math.floor(Math.random() * letters.length)]
          if (
            char.classList.contains('to-top') ||
            char.classList.contains('to-right') ||
            char.classList.contains('to-bottom') ||
            char.classList.contains('to-left') ||
            char.classList.contains('letter-blue')
          ) return

          const directions = ['bottom', 'left', 'top', 'right'] as const
          const dir = directions[Math.floor(Math.random() * 4)]
          const cls = `to-${dir}`

          // Step 1: turn blue over 200ms
          char.classList.add('letter-blue')

          // Step 2: after 200ms, trigger the slide animation
          setTimeout(() => {
            char.classList.add(cls)
          }, 200)

          // Step 3: after slide completes (3000ms + 200ms offset), fade back to white
          setTimeout(() => {
            char.classList.remove(cls)
            char.classList.remove('letter-blue')
            char.classList.add('letter-white')
            // Remove the white transition class after it completes
            setTimeout(() => {
              char.classList.remove('letter-white')
            }, 200)
          }, 3200)
        }
      }

      tickRef.current = window.setInterval(animateChar, 100)
    }, 3000)

    return () => {
      clearTimeout(startDelay)
      clearInterval(tickRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full overflow-hidden leading-none">
      <h2
        className="hero-bg-text font-black text-white text-center uppercase select-none pointer-events-none whitespace-nowrap"
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 'clamp(3rem, 16vw, 18rem)',
          lineHeight: 0.85,
          letterSpacing: '-0.02em',
          paddingBottom: '0.05em',
        }}
      >
        {NAME_LETTERS.map((letter, i) => (
          <span
            key={i}
            ref={el => { lettersRef.current[i] = el }}
            style={{
              display: 'inline-block',
              minWidth: letter === ' ' ? '0.3em' : undefined,
              willChange: 'transform, opacity',
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h2>
    </div>
  )
}

export function Hero() {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    // Animate the lower-third card in
    const card = contentRef.current.querySelector('.hero-card')
    if (card) {
      gsap.fromTo(card,
        { opacity: 0, x: 60 },
        { opacity: 1, x: 0, duration: 1, ease: 'power4.out', delay: 0.8 }
      )
    }
  }, [])

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: '#080b16' }}
    >
      {/* Hero headshot — uses vh so it scales with window height, not width */}
      <div
        className="absolute inset-0 z-[1] flex items-start justify-center"
        style={{ paddingTop: '5vh' }}
      >
        <img
          src="/photos/joey-headshot2.png"
          alt=""
          className="hero-photo pointer-events-none select-none"
          style={{
            height: 'clamp(300px, 65vh, 700px)',
            width: 'auto',
            filter: 'brightness(0.75) contrast(1.15)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at center center, black 30%, transparent 70%)',
            maskImage: 'radial-gradient(ellipse 90% 85% at center center, black 30%, transparent 70%)',
          }}
        />
      </div>

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.15) 0%, rgba(10,10,15,0.3) 40%, rgba(10,10,15,0.7) 70%, rgba(10,10,15,0.92) 100%)',
        }}
      />

      {/* Floating particles */}
      <Particles />

      {/* === CONTENT LAYER === */}
      <div ref={contentRef} className="relative z-[10] min-h-screen flex flex-col">

        {/* Lower third card — absolute positioned on desktop, flows on mobile */}
        <div className="hero-card-wrapper flex-1 relative">
          <div className="hero-card" style={{ opacity: 0 }}>
            <div
              className="relative rounded-md overflow-visible"
              style={{
                background: '#000000',
                border: '1px solid rgba(0, 100, 255, 0.25)',
                padding: '12px 30px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8), inset 0 0 25px rgba(0, 100, 255, 0.05)',
              }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: '5px',
                  background: 'linear-gradient(90deg, #04133d 0%, #0a3aad 45%, #1a8fff 100%)',
                  boxShadow: '0 0 12px rgba(0, 100, 255, 0.5)',
                }}
              />
              {/* Bottom accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '4px',
                  background: 'linear-gradient(90deg, #04133d 0%, #0a3aad 45%, #1a8fff 100%)',
                  boxShadow: '0 0 8px rgba(0, 100, 255, 0.4)',
                }}
              />
              {/* Scanning electricity effect */}
              <div className="lower-third-scan absolute top-0 left-0 h-full pointer-events-none z-10" />

              {/* Row 1: JoeyC.ai */}
              <div className="flex items-center justify-center w-full mb-2">
                <span
                  className="font-display font-bold"
                  style={{
                    fontSize: '40px',
                    color: '#1a8fff',
                    textShadow: '0 0 15px rgba(0, 120, 255, 0.6)',
                    lineHeight: 1,
                  }}
                >
                  JoeyC.ai
                </span>
              </div>

              {/* Row 2: Tags */}
              <div
                className="flex items-center justify-center gap-3 mx-auto rounded"
                style={{
                  background: 'rgba(30, 30, 30, 0.5)',
                  padding: '6px 16px',
                  border: '1px solid rgba(0, 100, 255, 0.15)',
                  whiteSpace: 'nowrap',
                  fontSize: 'clamp(9px, 1.1vw, 13px)',
                }}
              >
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2.5px', color: '#cbd5e1' }}>TECH CREATOR</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#0a5acc', textShadow: '0 0 8px rgba(0, 100, 255, 0.5)' }}>//</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2.5px', color: '#1a8fff', textShadow: '0 0 10px rgba(0, 120, 255, 0.6)' }}>AI ENTHUSIAST</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#0a5acc', textShadow: '0 0 8px rgba(0, 100, 255, 0.5)' }}>//</span>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2.5px', color: '#cbd5e1' }}>BUILD IN PUBLIC</span>
              </div>

              {/* Row 3: Socials */}
              <div className="flex items-center justify-evenly w-full mt-3 px-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                <a href="https://www.tiktok.com/@buildaiwithjoey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-[#1a8fff] transition-colors" style={{ fontSize: '18px', fontWeight: 600 }}>
                  <svg fill="currentColor" viewBox="0 0 448 512" width="20" height="20">
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                  </svg>
                  @buildaiwithjoey
                </a>
                <a href="https://instagram.com/gobuildai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:text-pink-500 transition-colors" style={{ fontSize: '18px', fontWeight: 600 }}>
                  <svg viewBox="0 0 448 512" width="20" height="20">
                    <defs>
                      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fd5949" />
                        <stop offset="50%" stopColor="#d6249f" />
                        <stop offset="100%" stopColor="#285AEB" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#ig-grad)" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                  </svg>
                  @gobuildai
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* === BOTTOM: JOEY COLLEY — GSAP staggered letter reveal === */}
        <div className="w-full">
          <HeroName />
        </div>
      </div>

      {/* Bottom edge fade to site bg */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg to-transparent z-[11] pointer-events-none" />
    </section>
  )
}
