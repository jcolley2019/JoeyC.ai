import { useState } from 'react'
import { AnimateOnScroll } from '../ui/AnimateOnScroll'

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('sending')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('https://formspree.io/f/maqpjpkg', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })

      if (res.ok) {
        setStatus('sent')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16">
          {/* Left — heading & context */}
          <div>
            <AnimateOnScroll>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-6">
                {'// contact'}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                Let's Build
                <br />
                <span className="gradient-text">Something Together</span>
              </h2>
              <p className="text-text-secondary text-base leading-relaxed mb-8">
                Have an idea? Need an AI-powered app, automation, or website?
                Or just want to say what's up? Drop me a message.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'AI Apps & Websites', icon: '>' },
                  { label: 'Automations & Workflows', icon: '>' },
                  { label: 'Consulting & Collabs', icon: '>' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="font-mono text-primary text-sm">{item.icon}</span>
                    <span className="text-text-secondary text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>

          {/* Right — form */}
          <AnimateOnScroll delay={150}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block font-mono text-xs tracking-wide uppercase text-text-secondary mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-3.5 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-mono text-xs tracking-wide uppercase text-text-secondary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="you@email.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="message" className="block font-mono text-xs tracking-wide uppercase text-text-secondary mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell me about your project or idea..."
                  className="w-full px-4 py-3.5 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary relative w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-bg font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {status === 'sending' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 8h10m-4-4l4 4-4 4" />
                      </svg>
                    </>
                  )}
                </span>
              </button>

              {/* Status messages */}
              {status === 'sent' && (
                <p className="text-center text-sm text-primary font-medium flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8.5l3.5 3.5 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Message sent! I'll get back to you soon.
                </p>
              )}
              {status === 'error' && (
                <p className="text-center text-sm text-red-400 font-medium">
                  Something went wrong. Try emailing me directly.
                </p>
              )}
            </form>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
}
