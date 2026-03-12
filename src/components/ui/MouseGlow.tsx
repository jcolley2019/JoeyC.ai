import { useEffect, useRef } from 'react'

export function MouseGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -500, y: -500 })
  const particles = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }>>([])
  const raf = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }
    resize()

    // Re-measure on scroll height changes
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(document.documentElement)

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY + window.scrollY }

      // Spawn a few particles on move
      for (let i = 0; i < 2; i++) {
        particles.current.push({
          x: mouse.current.x + (Math.random() - 0.5) * 40,
          y: mouse.current.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          life: 0,
          maxLife: 60 + Math.random() * 40,
        })
      }
      // Cap particles
      if (particles.current.length > 80) {
        particles.current = particles.current.slice(-80)
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Main mouse glow — follows cursor
      const scrollY = window.scrollY
      const viewX = mouse.current.x
      const viewY = mouse.current.y - scrollY

      // Only draw if mouse is near viewport
      if (viewY > -300 && viewY < canvas.height + 300) {
        const gradient = ctx.createRadialGradient(
          mouse.current.x, mouse.current.y, 0,
          mouse.current.x, mouse.current.y, 350
        )
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.04)')
        gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.015)')
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(
          mouse.current.x - 350,
          mouse.current.y - 350,
          700, 700
        )
      }

      // Draw particles
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
        const size = 1.5 + progress * 1

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6, 182, 212, ${alpha * 0.12})`
        ctx.fill()
      }

      raf.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('mousemove', onMove)
      resizeObserver.disconnect()
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
