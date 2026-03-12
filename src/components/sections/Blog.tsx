import { FaTiktok, FaInstagram } from 'react-icons/fa6'
import { AnimateOnScroll } from '../ui/AnimateOnScroll'

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
    accent: 'accent',
  },
]

export function Blog() {
  return (
    <section id="content" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-6">
            {'// content'}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Building in Public
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            I share everything I'm learning and building. Quick tips, full build
            sessions, wins, and fails.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.map((item, i) => (
            <AnimateOnScroll key={item.platform} delay={i * 150}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block card-glow rounded-xl border border-border bg-bg-card p-6 md:p-8"
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
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
