import { FaPlay } from 'react-icons/fa6'
import { useParallax } from '../../hooks/useParallax'
import { Button } from '../ui/Button'

export function Hero() {
  const scrollY = useParallax()

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Grid background with parallax */}
      <div
        className="hero-grid absolute inset-0 w-full h-[120%] -top-[10%]"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#0a0a0f_70%)]" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-primary animate-fade-in-up"
            >
              Joey Colley
            </h1>

            <p
              className="mt-4 text-xl md:text-2xl font-semibold text-primary animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              Practical AI for Everyone
            </p>

            <p
              className="mt-4 text-lg md:text-xl text-text-secondary max-w-xl mx-auto lg:mx-0 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              I build apps, websites &amp; automations with AI — and show you how
            </p>

            <div
              className="mt-8 animate-fade-in-up"
              style={{ animationDelay: '600ms' }}
            >
              <Button href="https://www.tiktok.com/@buildaiwithjoey">
                <FaPlay className="text-sm" />
                Watch Me Build
              </Button>
            </div>
          </div>

          {/* Photo placeholder */}
          <div
            className="animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-6xl md:text-7xl font-extrabold text-primary/60">
                  JC
                </span>
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-3 rounded-full border border-primary/10 animate-[spin_20s_linear_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
