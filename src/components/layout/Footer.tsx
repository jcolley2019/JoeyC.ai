export function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="notranslate font-display text-sm font-medium text-primary glow-text tracking-wider" translate="no">
            JoeyC.ai
          </span>

          <p className="text-text-secondary text-sm">
            &copy; {new Date().getFullYear()} <span className="notranslate" translate="no">Joey Colley</span>.{' '}
            <span className="text-text-secondary/60">Built with AI, obviously.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
