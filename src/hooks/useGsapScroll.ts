import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Triggers a GSAP animation when the element enters the viewport.
 * Fires once, then disconnects the observer.
 */
export function useGsapScroll<T extends HTMLElement = HTMLDivElement>(
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  threshold = 0.1
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    gsap.set(el, from)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(el, { ...to, ease: 'power4.out', duration: 0.8 })
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

/**
 * Triggers staggered GSAP animations on child elements matching a selector.
 */
export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(
  selector: string,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  stagger = 0.1,
  threshold = 0.1
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const children = Array.from(container.querySelectorAll(selector))
    if (!children.length) return

    gsap.set(children, from)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(children, { ...to, ease: 'power4.out', duration: 0.8, stagger })
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return ref
}
