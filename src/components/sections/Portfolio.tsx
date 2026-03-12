import { projects } from '../../data/projects'
import { AnimateOnScroll } from '../ui/AnimateOnScroll'
import { FaArrowUpRightFromSquare } from 'react-icons/fa6'

export function Portfolio() {
  return (
    <section id="portfolio" className="py-28 px-6 bg-bg-section">
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-6">
            {'// projects'}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Things I've Built
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            Real projects built with AI tools. Each one started as an idea and became
            something real — no CS degree required.
          </p>
        </AnimateOnScroll>

        {/* Bento grid — asymmetric */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, index) => {
            const isFeature = index === 0
            return (
              <AnimateOnScroll
                key={project.title}
                delay={index * 100}
                className={isFeature ? 'md:col-span-2' : ''}
              >
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block card-glow rounded-xl border border-border bg-bg-card p-6 ${
                    isFeature ? 'md:p-8' : ''
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
              </AnimateOnScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}
