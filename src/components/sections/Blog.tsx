import { FaTiktok, FaInstagram } from 'react-icons/fa6'
import { AnimateOnScroll } from '../ui/AnimateOnScroll'

export function Blog() {
  return (
    <section className="py-24 px-6 bg-bg-section">
      <div className="max-w-6xl mx-auto">
        <AnimateOnScroll>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
            Latest from TikTok &amp; Instagram
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Quick tips, build sessions, and behind-the-scenes of my AI projects.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={150}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: FaTiktok, platform: 'TikTok', handle: '@buildaiwithjoey' },
              { icon: FaInstagram, platform: 'Instagram', handle: '@gobuildai' },
              { icon: FaTiktok, platform: 'TikTok', handle: '@buildaiwithjoey' },
            ].map((item, i) => (
              <div
                key={i}
                className="aspect-[9/16] max-h-80 rounded-2xl bg-bg border border-border flex flex-col items-center justify-center gap-4 text-text-secondary"
              >
                <item.icon className="text-4xl" />
                <p className="font-medium">{item.platform}</p>
                <p className="text-sm text-primary">{item.handle}</p>
                <p className="text-xs">Content coming soon</p>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
