'use client'

import { useEffect, useRef, useState } from 'react'

function parse(val: string): { prefix: string; num: number; suffix: string } {
  const match = val.match(/^([^0-9]*)([0-9.]+)([^0-9]*)$/)
  if (!match) return { prefix: '', num: 0, suffix: val }
  return { prefix: match[1], num: parseFloat(match[2]), suffix: match[3] }
}

export default function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState('0')
  const [started, setStarted] = useState(false)
  const { prefix, num, suffix } = parse(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect() } },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const isFloat = num % 1 !== 0
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = num * eased
      setDisplay(isFloat ? current.toFixed(1) : Math.floor(current).toString())
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [started, num, duration])

  return <span ref={ref}>{prefix}{display}{suffix}</span>
}
