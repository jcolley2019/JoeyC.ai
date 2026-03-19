import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function About() {
  const textRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    if (textRef.current) gsap.set(textRef.current, { opacity: 0, y: 60 })
    if (photoRef.current) gsap.set(photoRef.current, { opacity: 0, x: 150 })

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (textRef.current) {
            gsap.to(textRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' })
          }
          if (photoRef.current) {
            gsap.to(photoRef.current, { opacity: 1, x: 0, duration: 0.8, ease: 'power4.out' })
          }
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="about" className="py-28 px-6 overflow-hidden">
      <div ref={sectionRef} className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-8 items-start">
          {/* LEFT — Text content */}
          <div ref={textRef} className="max-w-xl">
            <p className="section-label mb-6">
              {'// ABOUT'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Not your typical
              <br />
              <span className="text-text-secondary">tech story.</span>
            </h2>

            <div className="space-y-5 text-text-secondary text-base leading-relaxed">
              <p>
                I'm not a traditional developer. No CS degree, no years of coding bootcamps.
                What I have is curiosity, determination, and a growing obsession with what
                AI makes possible.
              </p>
              <p>
                One day I discovered that AI tools could help me build real things — apps,
                websites, automations — without needing to be a full-stack engineer. So I
                started building. Then I started sharing on{' '}
                <a
                  href="https://www.tiktok.com/@buildaiwithjoey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover transition-colors underline underline-offset-4 decoration-primary/30"
                >
                  TikTok
                </a>{' '}
                and{' '}
                <a
                  href="https://www.instagram.com/gobuildai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover transition-colors underline underline-offset-4 decoration-primary/30"
                >
                  Instagram
                </a>
                , because I realized most people didn't know this was possible.
              </p>
              <p className="text-text-primary font-medium border-l-2 border-primary/40 pl-4">
                Now I build in public every day. The wins, the fails, everything in between.
                My goal: show everyday people what's possible with AI and help them start
                building too.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {[
                { label: 'Building with', value: 'Claude, GPT, n8n' },
                { label: 'Sharing on', value: 'TikTok & Instagram' },
                { label: 'Mission', value: 'AI for everyone' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between border-b border-border/50 pb-2 max-w-sm"
                >
                  <span className="font-mono text-xs text-text-secondary uppercase tracking-wide">
                    {item.label}
                  </span>
                  <span className="text-sm text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Large floating cutout photo */}
          <div ref={photoRef} className="relative flex justify-center lg:justify-end">
            <img
              src="/photos/joey-hero2.png"
              alt="Joey Colley"
              className="w-[22rem] md:w-[25rem] lg:w-[27.5rem] xl:w-[32.5rem] h-auto object-contain drop-shadow-[0_0_40px_rgba(74,111,165,0.08)]"
              style={{
                WebkitMaskImage: 'radial-gradient(ellipse 80% 85% at 50% 40%, black 40%, transparent 70%)',
                maskImage: 'radial-gradient(ellipse 80% 85% at 50% 40%, black 40%, transparent 70%)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
