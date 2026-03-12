import { AnimateOnScroll } from '../ui/AnimateOnScroll'
import { Button } from '../ui/Button'

export function WorkWithMe() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Work With Me</h2>
          <p className="text-text-secondary text-lg mb-8">
            Need AI-powered apps, automations, or websites for your business? Let's build something together.
          </p>
          <Button href="mailto:hello@joeyc.ai" variant="outline">
            Get in Touch
          </Button>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
