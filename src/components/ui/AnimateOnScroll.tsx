import type { ReactNode } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
}

export function AnimateOnScroll({ children, delay = 0, className = '' }: Props) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
