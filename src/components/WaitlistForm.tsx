'use client'

import { useActionState } from 'react'
import { joinWaitlist, type WaitlistResult } from '@/app/actions/waitlist'

const initialState: WaitlistResult | null = null

export default function WaitlistForm({ dark = false }: { dark?: boolean }) {
  const [result, action, pending] = useActionState(
    async (_prev: WaitlistResult | null, formData: FormData) => {
      return joinWaitlist(formData)
    },
    initialState
  )

  if (result?.success) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '10px 20px', borderRadius: 999,
        background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.12)',
        color: dark ? '#fff' : '#0a0a0a',
        fontSize: 13,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l3.5 3.5L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        You&rsquo;re on the list — we&rsquo;ll be in touch.
      </div>
    )
  }

  const inputStyle: React.CSSProperties = dark ? {
    padding: '10px 18px', borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 13, outline: 'none',
    minWidth: 220, transition: 'border-color 0.15s',
  } : {
    padding: '10px 18px', borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.15)',
    background: 'rgba(255,255,255,0.7)',
    color: '#0a0a0a', fontSize: 13, outline: 'none',
    minWidth: 220, transition: 'border-color 0.15s',
  }

  const btnStyle: React.CSSProperties = dark ? {
    padding: '10px 22px', borderRadius: 999,
    background: '#f0efed', color: '#0a0a0a',
    fontSize: 13, fontWeight: 500, border: 'none',
    cursor: pending ? 'default' : 'pointer',
    opacity: pending ? 0.6 : 1,
    transition: 'opacity 0.15s', whiteSpace: 'nowrap',
  } : {
    padding: '10px 22px', borderRadius: 999,
    background: '#0a0a0a', color: '#f0efed',
    fontSize: 13, fontWeight: 500, border: 'none',
    cursor: pending ? 'default' : 'pointer',
    opacity: pending ? 0.6 : 1,
    transition: 'opacity 0.15s', whiteSpace: 'nowrap',
  }

  return (
    <form action={action} style={{ position: 'relative', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        required
        autoComplete="email"
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')}
      />
      <button
        type="submit"
        disabled={pending}
        style={btnStyle}
        onMouseEnter={e => { if (!pending) e.currentTarget.style.opacity = '0.8' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = pending ? '0.6' : '1' }}
      >
        {pending ? 'Joining…' : 'Join waitlist'}
      </button>
      {result && !result.success && (
        <p style={{ position: 'absolute', bottom: -22, left: 0, fontSize: 12, color: dark ? '#fca5a5' : '#dc2626' }}>
          {result.error}
        </p>
      )}
    </form>
  )
}
