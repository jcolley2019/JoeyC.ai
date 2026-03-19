import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { projects } from '../../data/projects'
import { FaArrowUpRightFromSquare } from 'react-icons/fa6'

export function Portfolio() {
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Header animation
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

    // Cards animation — alternating sides
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.project-card')
      cards.forEach((card, i) => {
        const fromLeft = i % 2 === 0
        gsap.set(card, { opacity: 0, x: fromLeft ? -150 : 150 })
      })

      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            cards.forEach((card, i) => {
              gsap.to(card, {
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: 'power4.out',
                delay: i * 0.15,
              })
            })
            obs.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(gridRef.current)
    }
  }, [])

  return (
    <section id="portfolio" className="py-28 px-6 bg-bg-section">
      <div className="max-w-5xl mx-auto">
        <div ref={headerRef}>
          <p className="section-label mb-6">
            {'// PROJECTS'}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Things I've Built
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            Real projects built with AI tools. Each one started as an idea and became
            something real — no CS degree required.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, index) => {
            const isFeature = index === 0
            return (
              <a
                key={project.title}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`project-card group block rounded-xl border border-border bg-bg-card p-6 transition-all duration-300 hover:-translate-y-2 hover:border-[#4a6fa5]/50 hover:shadow-[0_0_30px_rgba(74,111,165,0.12)] ${
                  isFeature ? 'md:col-span-2 md:p-8' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-2 h-2 rounded-full bg-primary/60" />
                      <h3
                        className={`font-bold text-text-primary group-hover:text-primary transition-colors ${
                          isFeature ? 'text-xl md:text-2xl' : 'text-lg'
                        }`}
                      >
                        {project.title}
                      </h3>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed max-w-xl">
                      {project.description}
                    </p>
                  </div>
                  <FaArrowUpRightFromSquare className="text-text-secondary/40 group-hover:text-primary transition-colors mt-1 shrink-0 ml-4 text-sm" />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="tag-mono px-2.5 py-1 rounded-md bg-primary/5 text-primary/80 border border-primary/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
