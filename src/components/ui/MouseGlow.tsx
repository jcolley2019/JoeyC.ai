import { useEffect, useRef } from 'react'

export function MouseGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -500, y: -500 })
  const smoothMouse = useRef({ x: -500, y: -500 })
  const particles = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }>>([])
  const raf = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    window.addEventListener('resize', resize, { passive: true })

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }

      // Spawn particles on move
      for (let i = 0; i < 3; i++) {
        particles.current.push({
          x: mouse.current.x + (Math.random() - 0.5) * 50,
          y: mouse.current.y + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          life: 0,
          maxLife: 60 + Math.random() * 40,
        })
      }
      if (particles.current.length > 120) {
        particles.current = particles.current.slice(-120)
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Smooth lag — lerp toward actual mouse position
      smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * 0.12
      smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * 0.12

      const sx = smoothMouse.current.x
      const sy = smoothMouse.current.y

      // Main mouse glow — large, visible, steel blue
      if (sx > -300 && sy > -300) {
        const radius = 100
        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius)
        gradient.addColorStop(0, 'rgba(74, 111, 165, 0.15)')
        gradient.addColorStop(0.4, 'rgba(74, 111, 165, 0.08)')
        gradient.addColorStop(0.7, 'rgba(74, 111, 165, 0.03)')
        gradient.addColorStop(1, 'rgba(74, 111, 165, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(sx - radius, sy - radius, radius * 2, radius * 2)
      }

      // Draw trail particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.x += p.vx
        p.y += p.vy
        p.life++

        if (p.life >= p.maxLife) {
          particles.current.splice(i, 1)
          continue
        }

        const progress = p.life / p.maxLife
        const alpha = progress < 0.3
          ? progress / 0.3
          : 1 - (progress - 0.3) / 0.7
        const size = 2 + progress * 1.5

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 111, 165, ${alpha * 0.25})`
        ctx.fill()
      }

      raf.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
