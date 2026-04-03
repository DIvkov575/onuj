'use client'

import { useActionState } from 'react'
import { joinWaitlist, type WaitlistResult } from '@/app/actions/waitlist'

const initialState: WaitlistResult | null = null

export default function WaitlistForm() {
  const [result, action, pending] = useActionState(
    async (_prev: WaitlistResult | null, formData: FormData) => {
      return joinWaitlist(formData)
    },
    initialState
  )

  if (result?.success) {
    return (
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl border text-sm"
        style={{ borderColor: 'rgba(124,106,247,0.4)', background: 'rgba(124,106,247,0.08)', color: '#a89ff7' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        You&rsquo;re on the list. We&rsquo;ll be in touch.
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <div className="flex-1 relative">
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f0f0f0',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'rgba(124,106,247,0.6)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          }}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
        style={{
          background: '#7c6af7',
          color: '#fff',
        }}
        onMouseEnter={e => { if (!pending) e.currentTarget.style.background = '#6a59e0' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#7c6af7' }}
      >
        {pending ? 'Joining…' : 'Join waitlist'}
      </button>
      {result && !result.success && (
        <p className="absolute -bottom-6 left-0 text-xs" style={{ color: '#f87171' }}>
          {result.error}
        </p>
      )}
    </form>
  )
}
