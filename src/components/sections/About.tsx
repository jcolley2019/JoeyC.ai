import { AnimateOnScroll } from '../ui/AnimateOnScroll'

export function About() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            About Me
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll delay={150}>
          <div className="space-y-6 text-text-secondary text-lg leading-relaxed">
            <p>
              I'm not a traditional developer. I didn't go to school for computer science, and I
              don't have years of coding experience under my belt. What I do have is curiosity,
              determination, and a growing obsession with what AI can do.
            </p>
            <p>
              One day I discovered that AI tools could help me build real things — apps, websites,
              automations — without needing to be a full-stack engineer. So I started building. And
              then I started sharing what I was learning on TikTok and Instagram, because I realized
              that a lot of people didn't know this was possible.
            </p>
            <p>
              Now I build in public every day. I document the wins, the fails, and everything in
              between. My goal is simple:{' '}
              <span className="text-primary font-medium">
                show everyday people what's possible with AI
              </span>{' '}
              and help them start building too.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
