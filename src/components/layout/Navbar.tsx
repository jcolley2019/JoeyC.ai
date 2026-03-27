import { useState, useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)

const links = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#portfolio' },
  { label: 'Content & Connect', href: '#content' },
  { label: 'Contact', href: '#contact' },
  { label: 'Content Studio', href: '/command-center', isRoute: true },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([])
  const labelRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Animate in
  useEffect(() => {
    if (!menuOpen || !overlayRef.current) return

    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    )

    const items = linksRef.current.filter(Boolean) as HTMLAnchorElement[]
    gsap.fromTo(items,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power4.out', stagger: 0.08, delay: 0.15 }
    )

    if (labelRef.current) {
      gsap.fromTo(labelRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out', delay: 0.1 }
      )
    }
  }, [menuOpen])

  const close = useCallback(() => {
    if (!overlayRef.current) { setMenuOpen(false); return }

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => setMenuOpen(false),
    })
  }, [])

  const handleLinkClick = useCallback((href: string, isRoute?: boolean) => {
    if (isRoute) {
      close()
      return
    }
    close()
    // Wait for overlay to fade out, then scroll via GSAP
    setTimeout(() => {
      gsap.to(window, { scrollTo: { y: href, offsetY: 0 }, duration: 1, ease: 'power2.inOut' })
    }, 350)
  }, [close])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-bg/90 backdrop-blur-xl border-b border-[#0a3aad]/30 shadow-lg shadow-black/20'
            : 'bg-bg/20 backdrop-blur-sm'
        }`}
      >
        <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center group">
            <span className="notranslate font-display text-sm font-medium text-primary glow-text group-hover:text-primary-hover transition-colors tracking-wider" translate="no">
              JoeyC.ai
            </span>
          </a>

          {/* Hamburger button */}
          <button
            onClick={() => menuOpen ? close() : setMenuOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-[5px]">
              <span
                className={`block h-[1.5px] bg-current transition-all duration-300 origin-center ${
                  menuOpen ? 'rotate-45 translate-y-[6.5px]' : ''
                }`}
              />
              <span
                className={`block h-[1.5px] bg-current transition-all duration-300 ${
                  menuOpen ? 'opacity-0 scale-x-0' : ''
                }`}
              />
              <span
                className={`block h-[1.5px] bg-current transition-all duration-300 origin-center ${
                  menuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Full-screen overlay menu */}
      {menuOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-bg/98 backdrop-blur-2xl flex flex-col items-center justify-center"
        >
          <p
            ref={labelRef}
            className="font-display text-xs tracking-[0.3em] uppercase text-primary/50 mb-12"
          >
            Navigation
          </p>

          <nav className="flex flex-col items-center gap-2">
            {links.map((link, i) => (
              <a
                key={link.label}
                ref={el => { linksRef.current[i] = el }}
                href={link.href}
                onClick={(e) => {
                  if (!link.isRoute) e.preventDefault()
                  handleLinkClick(link.href, link.isRoute)
                }}
                className={`block text-center py-3 px-6 rounded-lg transition-all duration-300 ${
                  link.isRoute
                    ? 'text-3xl md:text-5xl font-bold text-[#1a8fff] hover:text-[#4aa3ff] mt-6'
                    : 'text-3xl md:text-5xl font-bold text-text-primary hover:text-primary'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="absolute bottom-12 text-center">
            <span className="notranslate font-display text-xs text-text-secondary/40 tracking-wider" translate="no">
              JoeyC.ai
            </span>
          </div>
        </div>
      )}
    </>
  )
}
