import { AnimateOnScroll } from '../ui/AnimateOnScroll'

export function WorkWithMe() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <AnimateOnScroll>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-6">
            {'// services'}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Work With Me</h2>
          <p className="text-text-secondary text-lg mb-8">
            Need AI-powered apps, automations, or websites for your business? Let's build something together.
          </p>
          <a
            href="mailto:hello@joeyc.ai"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all text-sm font-medium"
          >
            Get in Touch
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10m-4-4l4 4-4 4" />
            </svg>
          </a>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
