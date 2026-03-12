import { socials } from '../../data/socials'
import { SocialIcon } from '../ui/SocialIcon'

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-8">
        <div className="flex gap-4">
          {socials.map((social) => (
            <SocialIcon key={social.platform} social={social} size="sm" />
          ))}
        </div>

        <div className="text-center text-text-secondary text-sm space-y-1">
          <p className="font-semibold text-text-primary">JoeyC.ai</p>
          <p>&copy; {new Date().getFullYear()} Joey Colley. Built with AI.</p>
        </div>
      </div>
    </footer>
  )
}
