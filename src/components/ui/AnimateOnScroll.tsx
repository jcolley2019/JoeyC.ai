import type { ReactNode } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

type Direction = 'up' | 'left' | 'right' | 'scale' | 'rotate' | 'rotate-right' | 'flip'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
  direction?: Direction
}

const classMap: Record<Direction, string> = {
  up: 'scroll-reveal',
  left: 'scroll-reveal-left',
  right: 'scroll-reveal-right',
  scale: 'scroll-reveal-scale',
  rotate: 'scroll-reveal-rotate',
  'rotate-right': 'scroll-reveal-rotate-right',
  flip: 'scroll-reveal-flip',
}

export function AnimateOnScroll({ children, delay = 0, className = '', direction = 'up' }: Props) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={`${classMap[direction]} ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
