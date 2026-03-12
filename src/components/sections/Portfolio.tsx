import { projects } from '../../data/projects'
import { AnimateOnScroll } from '../ui/AnimateOnScroll'
import { PortfolioCard } from '../ui/PortfolioCard'

export function Portfolio() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Things I've Built
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Real projects I've built using AI tools. Each one started as an idea and became
            something real — no CS degree required.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <AnimateOnScroll key={project.title} delay={index * 150}>
              <PortfolioCard project={project} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
