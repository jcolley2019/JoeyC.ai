import { FaArrowUpRightFromSquare } from 'react-icons/fa6'
import type { Project } from '../../types'

interface Props {
  project: Project
}

export function PortfolioCard({ project }: Props) {
  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-bg-section border border-border rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <FaArrowUpRightFromSquare className="text-text-secondary group-hover:text-primary transition-colors mt-1 shrink-0 ml-2" />
      </div>
      <p className="text-text-secondary text-sm leading-relaxed mb-4">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <span
            key={t}
            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium"
          >
            {t}
          </span>
        ))}
      </div>
    </a>
  )
}
