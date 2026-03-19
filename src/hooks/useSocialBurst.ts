import { useCallback } from 'react'
import gsap from 'gsap'

// SVG icon markup for each platform
const BURST_ICONS: Record<string, string> = {
  TikTok: `<svg fill="#ffffff" viewBox="0 0 448 512" width="SIZE" height="SIZE"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>`,
  YouTube: `<svg fill="#ff0000" viewBox="0 0 576 512" width="SIZE" height="SIZE"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>`,
  Instagram: `<svg viewBox="0 0 448 512" width="SIZE" height="SIZE"><defs><linearGradient id="burst-ig-ID" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fd5949"/><stop offset="50%" stop-color="#d6249f"/><stop offset="100%" stop-color="#285AEB"/></linearGradient></defs><path fill="url(#burst-ig-ID)" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>`,
  Pinterest: `<svg fill="#E60023" viewBox="0 0 384 512" width="SIZE" height="SIZE"><path d="M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-24.9 0-46.2-18-46.2-43.8 0-37.8 26.4-74.4 26.4-113.4 0-66.2-93.9-54.2-93.9 25.8 0 16.8 2.1 35.4 9.6 50.7-13.8 59.4-42 147.9-42 209.1 0 18.9 2.7 37.5 4.5 56.4 3.4 3.8 1.7 3.4 6.9 1.5 50.4-69 48.6-82.5 71.4-172.8 12.3 23.4 44.1 36 69.3 36 106.2 0 153.9-103.5 153.9-196.8C384 71.3 298.2 6.5 204 6.5z"/></svg>`,
  X: `<svg fill="#ffffff" viewBox="0 0 512 512" width="SIZE" height="SIZE"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>`,
  Website: `<svg fill="#4a6fa5" viewBox="0 0 512 512" width="SIZE" height="SIZE"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6C378.6 23.8 431.2 71.3 463.4 132H463.4zM256 512c-34.2 0-65.4-55.1-83.1-144H339.1C321.4 456.9 290.2 512 256 512zm-95-176H351c2 21.3 3 42.4 3 64s-1 42.7-3 64H161c-2-21.3-3-42.4-3-64s1-42.7 3-64zm-48.3-32H8.1C2.8 283.5 0 262.1 0 240s2.8-43.5 8.1-64h104.6c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64zM48.6 132c32.2-60.7 84.8-108.2 142-123.6C165.1 42.6 145.3 96.1 135.3 160H48.6zM256 0c34.2 0 65.4 55.1 83.1 144H172.9C190.6 55.1 221.8 0 256 0zM48.6 380h86.7c10 63.9 29.8 117.4 55.3 151.6C133.4 516.2 80.8 468.7 48.6 380zm268.1 151.6c25.5-34.2 45.3-87.7 55.3-151.6h86.7c-32.2 60.7-84.8 108.2-142 123.6z"/></svg>`,
}

let burstCounter = 0

function playBurstSound() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08)
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.25)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}

export function useSocialBurst() {
  const onMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>, platform: string) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const startX = rect.left + rect.width / 2
    const startY = rect.top + rect.height / 2
    const svgTemplate = BURST_ICONS[platform]
    if (!svgTemplate) return

    playBurstSound()

    const viewportH = window.innerHeight
    const isDesktop = window.innerWidth >= 768
    const count = isDesktop ? 12 : 8

    for (let i = 0; i < count; i++) {
      const size = isDesktop
        ? 40 + Math.random() * 50
        : 30 + Math.random() * 30
      const id = `burst-${++burstCounter}-${i}`

      // Replace gradient IDs to avoid conflicts between multiple icons
      const svg = svgTemplate
        .replace(/SIZE/g, String(Math.round(size)))
        .replace(/ID/g, id)

      // Random horizontal spread
      const spreadX = (Math.random() - 0.5) * (isDesktop ? 600 : 300)
      // Random rotation
      const rotation = -360 + Math.random() * 720
      // Fall distance — off the bottom of the screen
      const fallY = viewportH - startY + 100 + Math.random() * 200

      const el = document.createElement('div')
      el.innerHTML = svg
      el.style.cssText = `
        position: fixed;
        left: ${startX - size / 2}px;
        top: ${startY - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        z-index: 9999;
        pointer-events: none;
        opacity: 0.8;
      `
      document.body.appendChild(el)

      // Phase 1: burst outward (fast)
      gsap.to(el, {
        x: spreadX * 0.4,
        y: -80 - Math.random() * 120,
        rotation: rotation * 0.3,
        scale: 1.2,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          // Phase 2: gravity fall off screen (slower, easing in)
          gsap.to(el, {
            x: spreadX,
            y: fallY,
            rotation,
            opacity: 0,
            scale: 0.6 + Math.random() * 0.4,
            duration: 1.5 + Math.random() * 1,
            ease: 'power1.in',
            onComplete: () => {
              el.remove()
            },
          })
        },
      })
    }
  }, [])

  return { onMouseEnter }
}
