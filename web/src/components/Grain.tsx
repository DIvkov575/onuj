'use client'

import { useEffect, useRef } from 'react'

export default function Grain({ opacity = 0.15, zIndex = 9999 }: { opacity?: number; zIndex?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0

    function resize() {
      if (!canvas) return
      // Use a smaller internal resolution for coarser, more visible grain
      W = canvas.width  = Math.floor(window.innerWidth  / 1.5)
      H = canvas.height = Math.floor(window.innerHeight / 1.5)
    }

    function draw() {
      if (!ctx) return
      const imageData = ctx.createImageData(W, H)
      const buf = imageData.data
      for (let i = 0; i < buf.length; i += 4) {
        const v = (Math.random() * 255) | 0
        buf[i]     = v
        buf[i + 1] = v
        buf[i + 2] = v
        buf[i + 3] = (Math.random() * 255) | 0
      }
      ctx.putImageData(imageData, 0, 0)
      // static — draw once only
    }

    resize()
    window.addEventListener('resize', () => { resize(); draw() })
    draw()

    return () => {
      window.removeEventListener('resize', draw)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex,
        pointerEvents: 'none',
        opacity,
        mixBlendMode: 'overlay',
      }}
    />
  )
}
