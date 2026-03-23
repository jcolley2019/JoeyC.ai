import { useEffect, useRef } from 'react'
import { FaTiktok, FaInstagram } from 'react-icons/fa6'
import gsap from 'gsap'
import { socials } from '../../data/socials'
import { useSocialBurst } from '../../hooks/useSocialBurst'

const content = [
  {
    platform: 'TikTok',
    icon: FaTiktok,
    handle: '@buildaiwithjoey',
    url: 'https://www.tiktok.com/@buildaiwithjoey',
    description: 'Quick AI build tutorials, tool reviews, and "watch me build this" sessions.',
    accent: 'primary',
  },
  {
    platform: 'Instagram',
    icon: FaInstagram,
    handle: '@gobuildai',
    url: 'https://www.instagram.com/gobuildai',
    description: 'Behind-the-scenes of my AI projects, tips, and the journey of building in public.',
    accent: 'primary',
  },
]

export function Blog() {
  const headerRef = useRef<HTMLDivElement>(null)
  const tiktokRef = useRef<HTMLAnchorElement>(null)
  const instaRef = useRef<HTMLAnchorElement>(null)
  const connectHeaderRef = useRef<HTMLDivElement>(null)
  const socialGridRef = useRef<HTMLDivElement>(null)
  const { onMouseEnter } = useSocialBurst()

  useEffect(() => {
    // Header — slide from left
    if (headerRef.current) {
      gsap.set(headerRef.current, { opacity: 0, x: -150 })
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(headerRef.current, { opacity: 1, x: 0, duration: 0.8, ease: 'power4.out' })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(headerRef.current)
    }

    // TikTok card — slide from left
    if (tiktokRef.current) {
      gsap.set(tiktokRef.current, { opacity: 0, x: -150 })
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(tiktokRef.current, { opacity: 1, x: 0, duration: 0.8, ease: 'power4.out' })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(tiktokRef.current)
    }

    // Instagram card — slide from right
    if (instaRef.current) {
      gsap.set(instaRef.current, { opacity: 0, x: 150 })
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(instaRef.current, { opacity: 1, x: 0, duration: 0.8, ease: 'power4.out' })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(instaRef.current)
    }

    // Connect header
    if (connectHeaderRef.current) {
      gsap.set(connectHeaderRef.current, { opacity: 0, y: 60 })
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            gsap.to(connectHeaderRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(connectHeaderRef.current)
    }

    // Social cards — stagger up
    if (socialGridRef.current) {
      const cards = Array.from(socialGridRef.current.querySelectorAll('.social-card'))
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
      obs.observe(socialGridRef.current)
    }
  }, [])


  return (
    <section id="content" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* === CONTENT HEADER === */}
        <div ref={headerRef}>
          <p className="section-label mb-6">
            {'// CONTENT & CONNECT'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Building in Public
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            I share everything I'm learning and building. Quick tips, full build
            sessions, wins, and fails.
          </p>
        </div>

        {/* === FEATURED PLATFORMS: TikTok & Instagram === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.map((item, i) => (
            <a
              key={item.platform}
              ref={i === 0 ? tiktokRef : instaRef}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-border bg-bg-card p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#4a6fa5]/50 hover:shadow-[0_0_30px_rgba(74,111,165,0.12)]"
            >
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    item.accent === 'primary'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent/10 text-accent'
                  }`}
                >
                  <item.icon className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{item.platform}</p>
                  <p className="font-mono text-xs text-text-secondary">{item.handle}</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                {item.description}
              </p>
              <span
                className={`inline-flex items-center gap-2 text-sm font-medium ${
                  item.accent === 'primary' ? 'text-primary' : 'text-accent'
                } group-hover:gap-3 transition-all`}
              >
                Follow along
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8h10m-4-4l4 4-4 4" />
                </svg>
              </span>
            </a>
          ))}
        </div>

        {/* === ALL SOCIAL LINKS === */}
        <div className="mt-16" id="connect">
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
                  target={social.comingSoon ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  onMouseEnter={(e) => !social.comingSoon && onMouseEnter(e, social.platform)}
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
                </a>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
