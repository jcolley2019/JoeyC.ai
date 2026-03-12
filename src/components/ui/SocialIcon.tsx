import type { SocialLink } from '../../types'

interface SocialIconProps {
  social: SocialLink
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-12 h-12 text-xl',
  lg: 'w-14 h-14 text-2xl',
}

export function SocialIcon({ social, size = 'md' }: SocialIconProps) {
  const Icon = social.icon

  return (
    <div className="relative group flex flex-col items-center gap-2">
      <a
        href={social.comingSoon ? undefined : social.url}
        target={social.comingSoon ? undefined : '_blank'}
        rel="noopener noreferrer"
        className={`${sizes[size]} flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-110 ${social.comingSoon ? 'opacity-50 cursor-default' : ''}`}
        aria-label={social.platform}
      >
        <Icon />
      </a>
      <span className="text-xs text-text-secondary">{social.platform}</span>
      {social.comingSoon && (
        <span className="absolute -top-2 -right-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
          Soon
        </span>
      )}
    </div>
  )
}
