interface ButtonProps {
  children: React.ReactNode
  href: string
  variant?: 'primary' | 'outline'
  className?: string
}

export function Button({ children, href, variant = 'primary', className = '' }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 cursor-pointer'
  const variants = {
    primary: 'bg-primary text-white btn-glow hover:bg-primary-hover',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </a>
  )
}
