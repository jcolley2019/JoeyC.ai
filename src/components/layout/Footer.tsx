import { Logo } from '../ui/Logo'

export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <span className="font-mono text-sm text-text-secondary">JoeyC.ai</span>
          </div>

          <p className="text-text-secondary text-sm">
            &copy; {new Date().getFullYear()} Joey Colley.{' '}
            <span className="text-text-secondary/60">Built with AI, obviously.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
