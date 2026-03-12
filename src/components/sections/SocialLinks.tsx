import { socials } from '../../data/socials'
import { AnimateOnScroll } from '../ui/AnimateOnScroll'

export function SocialLinks() {
  return (
    <section id="connect" className="py-28 px-6 bg-bg-section">
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-6">
            {'// connect'}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Let's Connect
          </h2>
          <p className="text-text-secondary mb-14 max-w-lg text-base">
            Find me across the internet. I'm always down to talk AI, building,
            or whatever you're working on.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={150}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {socials.map((social) => {
              const Icon = social.icon
              return (
                <a
                  key={social.platform}
                  href={social.comingSoon ? undefined : social.url}
                  target={social.comingSoon ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-card card-glow ${
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
        </AnimateOnScroll>
      </div>
    </section>
  )
}
