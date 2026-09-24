import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const storageKey = (key: string) => `scroll:${key}`

const readSaved = (key: string): number | null => {
  try {
    const raw = sessionStorage.getItem(storageKey(key))
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

const save = (key: string, y: number) => {
  try {
    sessionStorage.setItem(storageKey(key), String(y))
  } catch {
    // storage unavailable: restoration simply falls back to top
  }
}

/**
 * New navigations (PUSH/REPLACE) scroll to the top. Back/forward (POP) restores the
 * position that was saved for that history entry, retrying briefly so lazy routes and
 * async data have time to give the page its full height. The browser's own restoration
 * is disabled because it fires before the SPA has rendered anything.
 */
export function ScrollToTop() {
  const { key } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // Keep the current entry's scroll position up to date
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => save(key, window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [key])

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0)
      return
    }
    const target = readSaved(key)
    if (target === null || target === 0) return

    let tries = 0
    let timer = 0
    const attempt = () => {
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      if (maxY >= target || tries >= 40) {
        window.scrollTo(0, target)
        return
      }
      tries += 1
      timer = window.setTimeout(attempt, 50)
    }
    attempt()
    return () => window.clearTimeout(timer)
  }, [key, navigationType])

  return null
}
