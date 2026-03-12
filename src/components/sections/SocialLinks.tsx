import { socials } from '../../data/socials'
import { AnimateOnScroll } from '../ui/AnimateOnScroll'
import { SocialIcon } from '../ui/SocialIcon'

export function SocialLinks() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Follow the Journey</h2>
          <p className="text-text-secondary mb-10">
            I share everything I'm building and learning across these platforms.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={150}>
          <div className="flex justify-center gap-6 flex-wrap">
            {socials.map((social) => (
              <SocialIcon key={social.platform} social={social} size="lg" />
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
