import { useEffect, useState } from 'react'

export function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />

      {/* Scanline texture */}
      <div className="absolute inset-0 scanline pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Photo — asymmetric, not a centered circle */}
          <div
            className={`relative shrink-0 ${mounted ? 'animate-scale-in' : 'opacity-0'}`}
            style={{ animationDelay: '200ms' }}
          >
            {/* Offset glow behind photo */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 to-accent/10 rounded-2xl blur-2xl" />

            <div className="relative">
              <img
                src="/joey-avatar-glow.png"
                alt="Joey Colley"
                className="w-56 h-56 md:w-72 md:h-72 rounded-2xl object-cover border border-border"
              />
              {/* Corner accent */}
              <div className="absolute -bottom-2 -right-2 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-2xl" />
              <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-accent/30 rounded-tl-xl" />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Mono label */}
            <p
              className={`font-mono text-xs tracking-[0.2em] uppercase text-text-secondary mb-4 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '300ms' }}
            >
              <span className="text-primary">~/</span>joey-colley
            </p>

            {/* Name — big, bold, distinctive */}
            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] ${mounted ? 'animate-slide-in' : 'opacity-0'}`}
              style={{ animationDelay: '400ms' }}
            >
              Joey
              <br />
              <span className="gradient-text">Colley</span>
            </h1>

            {/* Tagline with terminal feel */}
            <div
              className={`mt-6 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '600ms' }}
            >
              <p className="text-xl md:text-2xl font-medium text-text-primary">
                Practical AI for Everyone
              </p>
              <p className="mt-3 text-base md:text-lg text-text-secondary max-w-lg mx-auto lg:mx-0 leading-relaxed">
                I build apps, websites & automations with AI — and show you how.
                No CS degree. No gatekeeping. Just building.
              </p>
            </div>

            {/* CTA row */}
            <div
              className={`mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-4 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: '800ms' }}
            >
              <a
                href="https://www.tiktok.com/@buildaiwithjoey"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary relative inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-primary text-bg font-semibold text-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6 3.5v9l7-4.5z" />
                  </svg>
                  Watch Me Build
                </span>
              </a>
              <a
                href="#portfolio"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all text-sm font-medium"
              >
                See My Work
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8h10m-4-4l4 4-4 4" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent" />
    </section>
  )
}
