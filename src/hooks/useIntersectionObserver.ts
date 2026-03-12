import { useEffect, useRef, useState } from 'react'

interface Options {
  threshold?: number
  triggerOnce?: boolean
  rootMargin?: string
}

export function useIntersectionObserver({
  threshold = 0.1,
  triggerOnce = true,
  rootMargin = '0px',
}: Options = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, triggerOnce, rootMargin])

  return { ref, isVisible }
}
