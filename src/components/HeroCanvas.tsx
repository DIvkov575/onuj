'use client'

import { useEffect, useRef } from 'react'

function fieldAt(
  px: number, py: number,
  poles: { x: number; y: number; charge: number }[]
) {
  let fx = 0, fy = 0
  for (const p of poles) {
    const dx = px - p.x
    const dy = py - p.y
    const r2 = dx * dx + dy * dy + 600
    const f = p.charge / r2
    fx += f * dx
    fy += f * dy
  }
  return { fx, fy }
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    let animId = 0
    const mouse = { x: 0.5, y: 0.5 }
    let targetMx = 0.5, targetMy = 0.5

    function resize() {
      W = canvas!.width  = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
    }

    function draw() {
      // Smooth mouse tracking
      mouse.x += (targetMx - mouse.x) * 0.06
      mouse.y += (targetMy - mouse.y) * 0.06

      ctx!.clearRect(0, 0, W, H)

      // Background gradient
      const bg = ctx!.createRadialGradient(W * 0.68, H * 0.58, 0, W * 0.68, H * 0.58, Math.max(W, H) * 1.3)
      bg.addColorStop(0,   'rgb(145,152,162)')
      bg.addColorStop(0.5, 'rgb(148,46,10)')
      bg.addColorStop(1,   'rgb(55,42,38)')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, W, H)

      // Navy overlay
      const navy = ctx!.createRadialGradient(W * 0.18, H * 0.5, 0, W * 0.18, H * 0.5, W * 0.75)
      navy.addColorStop(0, 'rgba(0,1,110,0.58)')
      navy.addColorStop(1, 'rgba(0,1,110,0)')
      ctx!.fillStyle = navy
      ctx!.fillRect(0, 0, W, H)

      // Poles placed well outside canvas — create a global flow field
      const poles = [
        { x: W * -0.6,  y: H * -0.4,  charge:  60000 },
        { x: W *  1.6,  y: H * -0.3,  charge: -60000 },
        { x: W * -0.5,  y: H *  1.5,  charge: -50000 },
        { x: W *  1.5,  y: H *  1.4,  charge:  50000 },
        { x: mouse.x * W, y: mouse.y * H, charge: -38000 },
      ]

      // Seed lines on a uniform grid across the top and left edges
      const STEPS    = 320
      const STEPSIZE = 3.2
      const seeds: [number, number][] = []
      const COLS = 22
      const ROWS = 10
      for (let c = 0; c <= COLS; c++) {
        seeds.push([c / COLS * W, -2])        // top
        seeds.push([c / COLS * W, H + 2])     // bottom
      }
      for (let r = 0; r <= ROWS; r++) {
        seeds.push([-2,     r / ROWS * H])    // left
        seeds.push([W + 2,  r / ROWS * H])    // right
      }

      for (const [sx, sy] of seeds) {
        let px = sx, py = sy
        const points: [number, number][] = [[px, py]]

        for (let step = 0; step < STEPS; step++) {
          const { fx, fy } = fieldAt(px, py, poles)
          const mag = Math.sqrt(fx * fx + fy * fy) + 1e-9
          px += (fx / mag) * STEPSIZE
          py += (fy / mag) * STEPSIZE
          if (px < -40 || px > W + 40 || py < -40 || py > H + 40) break
          points.push([px, py])
        }

        if (points.length < 4) continue

        ctx!.beginPath()
        ctx!.moveTo(points[0][0], points[0][1])
        for (let i = 1; i < points.length - 1; i++) {
          const mx2 = (points[i][0] + points[i + 1][0]) / 2
          const my2 = (points[i][1] + points[i + 1][1]) / 2
          ctx!.quadraticCurveTo(points[i][0], points[i][1], mx2, my2)
        }

        // Brighten lines near cursor
        const midIdx = Math.floor(points.length / 2)
        const [midX, midY] = points[midIdx]
        const dMouse = Math.sqrt((midX - mouse.x * W) ** 2 + (midY - mouse.y * H) ** 2)
        const proximity = Math.max(0, 1 - dMouse / (W * 0.3))
        const alpha = 0.1 + proximity * 0.4

        ctx!.strokeStyle = `rgba(220,215,210,${alpha})`
        ctx!.lineWidth = 0.8
        ctx!.stroke()
      }

      // Cursor glow
      const mx = mouse.x * W, my = mouse.y * H
      const glow = ctx!.createRadialGradient(mx, my, 0, mx, my, 110)
      glow.addColorStop(0, 'rgba(215,222,235,0.14)')
      glow.addColorStop(1, 'rgba(215,222,235,0)')
      ctx!.fillStyle = glow
      ctx!.beginPath()
      ctx!.arc(mx, my, 110, 0, Math.PI * 2)
      ctx!.fill()

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      targetMx = (e.clientX - rect.left)  / rect.width
      targetMy = (e.clientY - rect.top)   / rect.height
    }
    canvas.addEventListener('mousemove', onMove)

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
