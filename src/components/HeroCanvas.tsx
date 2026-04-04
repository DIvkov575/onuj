'use client'

import { useEffect, useRef } from 'react'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

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

function pointInPoly(px: number, py: number, poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

interface Cell {
  sx: number; sy: number
  poly: [number, number][]
  baseColor: { r: number; g: number; b: number }
  lift: number  // 0–1, animated
}

function buildCells(W: number, H: number): Cell[] {
  const COLS = 15, ROWS = 9
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

  return seeds.map(([sx, sy]) => {
    let poly: [number, number][] = bounds
    for (let j = 0; j < seeds.length; j++) {
      if (seeds[j][0] === sx && seeds[j][1] === sy) continue
      poly = clipHalfPlane(poly, sx, sy, seeds[j][0], seeds[j][1])
      if (!poly.length) break
    }

    const tx = sx / W
    const ty = sy / H
    const t = tx * 0.6 + ty * 0.4
    const r = Math.round(lerp(lerp(145, 148, Math.min(t / 0.5, 1)), 55, Math.max(0, (t - 0.5) / 0.5)))
    const g = Math.round(lerp(lerp(152,  46, Math.min(t / 0.5, 1)), 42, Math.max(0, (t - 0.5) / 0.5)))
    const b = Math.round(lerp(lerp(162,  10, Math.min(t / 0.5, 1)), 38, Math.max(0, (t - 0.5) / 0.5)))

    return { sx, sy, poly, baseColor: { r, g, b }, lift: 0 }
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
    let cells: Cell[] = []
    let hoveredIndex = -1
    let animId = 0
    let needsDraw = false

    function resize() {
      W = canvas!.width  = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
      cells = buildCells(W, H)
      needsDraw = true
    }

    function draw() {
      animId = requestAnimationFrame(draw)

      // Animate lift values
      let anyChanging = false
      for (let i = 0; i < cells.length; i++) {
        const target = i === hoveredIndex ? 1 : 0
        const next = lerp(cells[i].lift, target, 0.1)
        if (Math.abs(next - cells[i].lift) > 0.001) {
          cells[i].lift = next
          anyChanging = true
        } else if (cells[i].lift !== target) {
          cells[i].lift = target
          anyChanging = true
        }
      }

      if (!anyChanging && !needsDraw) return
      needsDraw = false

      ctx!.clearRect(0, 0, W, H)
      const INSET = 1.8

      for (const cell of cells) {
        if (cell.poly.length < 3) continue
        const { lift } = cell

        ctx!.save()

        if (lift > 0) {
          ctx!.translate(cell.sx, cell.sy)
          ctx!.scale(1 + lift * 0.012, 1 + lift * 0.012)
          ctx!.translate(-cell.sx, -cell.sy)
        }

        ctx!.beginPath()
        for (let j = 0; j < cell.poly.length; j++) {
          const [px, py] = cell.poly[j]
          const edgeDist = Math.sqrt((px - cell.sx) ** 2 + (py - cell.sy) ** 2)
          const insetRatio = edgeDist > 0 ? INSET / edgeDist : 0
          const ipx = lerp(px, cell.sx, insetRatio)
          const ipy = lerp(py, cell.sy, insetRatio)
          j === 0 ? ctx!.moveTo(ipx, ipy) : ctx!.lineTo(ipx, ipy)
        }
        ctx!.closePath()

        const { r, g, b } = cell.baseColor
        const boost = lift * 18
        ctx!.fillStyle = `rgb(${Math.min(255, Math.round(r + boost))},${Math.min(255, Math.round(g + boost * 0.6))},${Math.min(255, Math.round(b + boost * 0.4))})`
        ctx!.fill()

        ctx!.strokeStyle = `rgba(255,255,255,${0.04 + lift * 0.18})`
        ctx!.lineWidth = 0.9
        ctx!.stroke()

        ctx!.restore()
      }
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      if (mx < 0 || mx > rect.width || my < 0 || my > rect.height) {
        hoveredIndex = -1
        return
      }

      hoveredIndex = -1
      for (let i = 0; i < cells.length; i++) {
        if (pointInPoly(mx, my, cells[i].poly)) {
          hoveredIndex = i
          break
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)
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
