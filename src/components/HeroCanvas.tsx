'use client'

import { useEffect, useRef } from 'react'

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// Clip a convex polygon to the half-plane containing (sx,sy)
// defined by the perpendicular bisector between (sx,sy) and (ox,oy)
function clipHalfPlane(
  poly: [number, number][],
  sx: number, sy: number,
  ox: number, oy: number
): [number, number][] {
  if (!poly.length) return []
  const mx = (sx + ox) / 2, my = (sy + oy) / 2
  const dx = ox - sx, dy = oy - sy
  const out: [number, number][] = []
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i]
    const [bx, by] = poly[(i + 1) % poly.length]
    const da = dx * (ax - mx) + dy * (ay - my)
    const db = dx * (bx - mx) + dy * (by - my)
    if (da >= 0) out.push([ax, ay])
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db)
      out.push([ax + t * (bx - ax), ay + t * (by - ay)])
    }
  }
  return out
}

interface Cell {
  sx: number; sy: number       // seed
  poly: [number, number][]     // clipped polygon
  z: number                    // current z lift (0–32)
  baseColor: { r: number; g: number; b: number }
  sortTie: number              // stable sort tiebreaker
}

function buildCells(W: number, H: number): Cell[] {
  const COLS = 9, ROWS = 5
  const seeds: [number, number][] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const jx = (Math.random() - 0.5) * 0.55
      const jy = (Math.random() - 0.5) * 0.55
      seeds.push([
        ((c + 0.5 + jx) / COLS) * W,
        ((r + 0.5 + jy) / ROWS) * H,
      ])
    }
  }

  const pad = 200
  const bounds: [number, number][] = [
    [-pad, -pad], [W + pad, -pad], [W + pad, H + pad], [-pad, H + pad],
  ]

  return seeds.map(([sx, sy], i) => {
    let poly: [number, number][] = bounds
    for (let j = 0; j < seeds.length; j++) {
      if (j === i) continue
      poly = clipHalfPlane(poly, sx, sy, seeds[j][0], seeds[j][1])
      if (!poly.length) break
    }

    // Sample gradient colour at seed position
    const tx = sx / W
    const ty = sy / H
    const t = tx * 0.6 + ty * 0.4
    const r = Math.round(lerp(lerp(145, 148, Math.min(t / 0.5, 1)), 55, Math.max(0, (t - 0.5) / 0.5)))
    const g = Math.round(lerp(lerp(152,  46, Math.min(t / 0.5, 1)), 42, Math.max(0, (t - 0.5) / 0.5)))
    const b = Math.round(lerp(lerp(162,  10, Math.min(t / 0.5, 1)), 38, Math.max(0, (t - 0.5) / 0.5)))

    return { sx, sy, poly, z: 0, baseColor: { r, g, b }, sortTie: i * 0.0001 }
  })
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
    let cells: Cell[] = []
    const mouse = { x: -999, y: -999 }
    let targetMx = -999, targetMy = -999

    function resize() {
      W = canvas!.width  = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
      cells = buildCells(W, H)
    }

    function draw() {
      // Smooth mouse
      mouse.x += (targetMx - mouse.x) * 0.055
      mouse.y += (targetMy - mouse.y) * 0.055

      ctx!.clearRect(0, 0, W, H)

      // Direct lift — z follows mouse proximity immediately
      for (const cell of cells) {
        const d = dist(mouse.x, mouse.y, cell.sx, cell.sy)
        const radius = Math.min(W, H) * 0.38
        const proximity = Math.max(0, 1 - d / radius)
        cell.z = proximity * 32
      }

      // Sort back to front — sortTie breaks ties stably to prevent z-fighting flicker
      const sorted = [...cells].sort((a, b) => (a.z + a.sortTie) - (b.z + b.sortTie))

      for (const cell of sorted) {
        if (cell.poly.length < 3) continue

        const z = cell.z
        const perspective = z / 280
        const INSET = 1.8

        ctx!.save()
        // Perspective shift: cells closer to mouse shift slightly toward it
        const dx = (mouse.x - cell.sx) * perspective * 0.12
        const dy = (mouse.y - cell.sy) * perspective * 0.12
        ctx!.translate(dx, dy)

        // Build inset polygon
        ctx!.beginPath()
        for (let i = 0; i < cell.poly.length; i++) {
          const [px, py] = cell.poly[i]
          // Inset toward centroid
          const edgeDist = dist(px, py, cell.sx, cell.sy)
          const insetRatio = edgeDist > 0 ? INSET / edgeDist : 0
          const ipx = lerp(px, cell.sx, insetRatio)
          const ipy = lerp(py, cell.sy, insetRatio)
          i === 0 ? ctx!.moveTo(ipx, ipy) : ctx!.lineTo(ipx, ipy)
        }
        ctx!.closePath()

        // Colour: lifted cells brighten
        const lift = Math.max(0, z)
        const { r, g, b } = cell.baseColor
        const br = Math.min(255, r + lift * 1.8)
        const bg2 = Math.min(255, g + lift * 1.1)
        const bb = Math.min(255, b + lift * 0.7)
        ctx!.fillStyle = `rgb(${Math.round(br)},${Math.round(bg2)},${Math.round(bb)})`
        ctx!.fill()

        // Edge: lifted cells get a brighter rim
        const edgeAlpha = 0.04 + (lift / 38) * 0.22
        ctx!.strokeStyle = `rgba(255,255,255,${edgeAlpha})`
        ctx!.lineWidth = 0.9
        ctx!.stroke()

        ctx!.restore()
      }

      // Subtle cursor glow on top
      if (mouse.x > 0) {
        const glow = ctx!.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 130)
        glow.addColorStop(0, 'rgba(215,222,235,0.13)')
        glow.addColorStop(1, 'rgba(215,222,235,0)')
        ctx!.fillStyle = glow
        ctx!.fillRect(0, 0, W, H)
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      // Only track when inside the canvas bounds
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        targetMx = x
        targetMy = y
      } else {
        targetMx = -999
        targetMy = -999
      }
    }
    window.addEventListener('mousemove', onMove)

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
