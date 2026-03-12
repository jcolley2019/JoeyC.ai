import { AnimateOnScroll } from '../ui/AnimateOnScroll'

export function About() {
  return (
    <section id="about" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <AnimateOnScroll>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-6">
            {'// about'}
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 lg:gap-16 items-start">
          {/* Story */}
          <div>
            <AnimateOnScroll delay={100}>
              <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
                Not your typical
                <br />
                <span className="text-text-secondary">tech story.</span>
              </h2>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200}>
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
            </AnimateOnScroll>
          </div>

          {/* Photo + quick facts */}
          <AnimateOnScroll delay={300}>
            <div className="space-y-6">
              <div className="relative">
                <img
                  src="/joey-headshot.jpg"
                  alt="Joey Colley"
                  className="w-full rounded-xl object-cover border border-border"
                />
                <div className="absolute -bottom-3 -left-3 w-12 h-12 border-l-2 border-b-2 border-primary/20 rounded-bl-xl" />
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Building with', value: 'Claude, GPT, n8n' },
                  { label: 'Sharing on', value: 'TikTok & Instagram' },
                  { label: 'Mission', value: 'AI for everyone' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between border-b border-border/50 pb-2"
                  >
                    <span className="font-mono text-xs text-text-secondary uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="text-sm text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
}
