import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useSiteSetting } from '../../hooks/useSiteSettings'

const SERVICE_OPTIONS = [
  'AI App / Custom Tool',
  'Website Build or Redesign',
  'Automation & Workflows',
  'AI Consulting / Strategy',
  'Other',
] as const

const PAIN_POINTS = [
  'Too much manual / repetitive work',
  'Need a custom app or tool built',
  'Website is outdated or not converting',
  'Want to use AI but don\'t know where to start',
  'Need to integrate existing tools',
  'Have an idea, need a technical partner',
] as const

const BUDGET_RANGES = [
  'Under $1,000',
  '$1,000 – $5,000',
  '$5,000 – $15,000',
  '$15,000 – $50,000',
  '$50,000+',
  'Not sure yet',
] as const

const TIMELINE_OPTIONS = [
  'ASAP',
  '1–3 months',
  '3–6 months',
  'Just exploring',
] as const

type FormData = {
  name: string
  email: string
  service: string
  painPoint: string
  budget: string
  timeline: string
  company: string
  website: string
  message: string
}

const TOTAL_STEPS = 3

export function Contact() {
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    service: '',
    painPoint: '',
    budget: '',
    timeline: '',
    company: '',
    website: '',
    message: '',
  })

  const { value: contactEnabled, loading: settingLoading } = useSiteSetting('contact_form_enabled')
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    if (leftRef.current) gsap.set(leftRef.current, { opacity: 0, x: -150 })
    if (rightRef.current) gsap.set(rightRef.current, { opacity: 0, x: 150 })

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (leftRef.current) {
            gsap.to(leftRef.current, { opacity: 1, x: 0, duration: 0.8, ease: 'power4.out' })
          }
          if (rightRef.current) {
            gsap.to(rightRef.current, { opacity: 1, x: 0, duration: 0.8, ease: 'power4.out' })
          }
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const canAdvance = () => {
    if (step === 1) return form.name.trim() && form.email.trim() && form.service
    if (step === 2) return true
    return true
  }

  const handleSubmit = async () => {
    setStatus('sending')
    try {
      const res = await fetch('https://cflhanugkedxeybbydha.supabase.co/functions/v1/contact-form', {
        method: 'POST',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setStatus('sent')
        setForm({ name: '', email: '', service: '', painPoint: '', budget: '', timeline: '', company: '', website: '', message: '' })
        setStep(1)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full px-4 py-3.5 rounded-xl bg-bg-card border border-border text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-[#4a6fa5]/60 focus:ring-1 focus:ring-[#4a6fa5]/30 focus:shadow-[0_0_15px_rgba(74,111,165,0.1)] transition-all text-sm'
  const labelClass = 'block font-mono text-xs tracking-wide uppercase text-text-secondary mb-2'

  const RadioGroup = ({
    options,
    value,
    onChange,
  }: {
    options: readonly string[]
    value: string
    onChange: (v: string) => void
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-3 rounded-xl border text-sm text-left transition-all ${
            value === opt
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-bg-card text-text-secondary hover:border-primary/30'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )

  return (
    <section id="contact" className="py-28 px-6">
      <div ref={sectionRef} className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16">
          {/* Left — heading & context */}
          <div ref={leftRef}>
            <p className="section-label mb-6">
              {'// CONTACT'}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Let's Build
              <br />
              <span className="gradient-text">Something Together</span>
            </h2>
            <p className="text-text-secondary text-base leading-relaxed mb-8">
              {contactEnabled
                ? 'Tell me a bit about your project so I can give you the best response. Takes about 60 seconds.'
                : "I'm not taking on new projects right now, but check back soon. I'd love to work with you in the future."
              }
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

            <p className="mt-8 text-text-secondary/60 text-xs">
              I'll reply within 24 hours.
            </p>
          </div>

          {/* Right — form or coming soon */}
          <div ref={rightRef}>
            {settingLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !contactEnabled ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-border bg-bg-card">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                <p className="text-text-secondary text-sm max-w-xs">
                  The contact form will be opening up soon. In the meantime, find me on social media.
                </p>
                <a
                  href="#connect"
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  Find me on socials
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 8h10m-4-4l4 4-4 4" />
                  </svg>
                </a>
              </div>
            ) : (
            <>
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-6">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div key={i} className="flex-1 flex items-center gap-3">
                  <div
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      i + 1 <= step ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                </div>
              ))}
              <span className="font-mono text-xs text-text-secondary ml-1">
                {step}/{TOTAL_STEPS}
              </span>
            </div>

            {status === 'sent' ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                    <path d="M4 12.5l6 6 10-10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Message sent!</h3>
                <p className="text-text-secondary text-sm">
                  I'll review your project details and get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-primary text-sm font-medium hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (step < TOTAL_STEPS) setStep(step + 1)
                  else handleSubmit()
                }}
              >
                {step === 1 && (
                  <div className="space-y-5">
                    <p className="font-mono text-xs text-primary tracking-wide uppercase mb-1">
                      About You
                    </p>
                    <div>
                      <label htmlFor="name" className={labelClass}>Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className={labelClass}>Email</label>
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="you@email.com"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>What do you need help with?</label>
                      <RadioGroup
                        options={SERVICE_OPTIONS}
                        value={form.service}
                        onChange={(v) => update('service', v)}
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <p className="font-mono text-xs text-primary tracking-wide uppercase mb-1">
                      Project Details
                    </p>
                    <div>
                      <label className={labelClass}>Biggest pain point</label>
                      <RadioGroup
                        options={PAIN_POINTS}
                        value={form.painPoint}
                        onChange={(v) => update('painPoint', v)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Budget range</label>
                      <RadioGroup
                        options={BUDGET_RANGES}
                        value={form.budget}
                        onChange={(v) => update('budget', v)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Timeline</label>
                      <RadioGroup
                        options={TIMELINE_OPTIONS}
                        value={form.timeline}
                        onChange={(v) => update('timeline', v)}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <p className="font-mono text-xs text-primary tracking-wide uppercase mb-1">
                      A Little More Context
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company" className={labelClass}>
                          Company <span className="text-text-secondary/40 normal-case">(optional)</span>
                        </label>
                        <input
                          type="text"
                          id="company"
                          placeholder="Acme Inc."
                          value={form.company}
                          onChange={(e) => update('company', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="website" className={labelClass}>
                          Website <span className="text-text-secondary/40 normal-case">(optional)</span>
                        </label>
                        <input
                          type="url"
                          id="website"
                          placeholder="https://example.com"
                          value={form.website}
                          onChange={(e) => update('website', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className={labelClass}>
                        Tell me about your project
                      </label>
                      <textarea
                        id="message"
                        rows={5}
                        placeholder="What are you building? What problem are you trying to solve?"
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-8">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="px-5 py-3.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:border-primary/30 transition-all"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!canAdvance() || status === 'sending'}
                    className="btn-primary flex-1 relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-bg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
                      ) : step < TOTAL_STEPS ? (
                        <>
                          Continue
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M3 8h10m-4-4l4 4-4 4" />
                          </svg>
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
                </div>

                {status === 'error' && (
                  <p className="text-center text-sm text-red-400 font-medium mt-4">
                    Something went wrong. Try again or email me directly.
                  </p>
                )}
              </form>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
