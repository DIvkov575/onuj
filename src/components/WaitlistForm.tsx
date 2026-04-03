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
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm"
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: '#a78bfa',
          backdropFilter: 'blur(12px)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M2.5 7.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        You&rsquo;re on the list — we&rsquo;ll be in touch.
      </div>
    )
  }

  return (
    <form action={action} className="relative flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        required
        autoComplete="email"
        className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          color: '#f1f5f9',
          backdropFilter: 'blur(12px)',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-50 cursor-pointer whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
          color: '#fff',
          boxShadow: '0 0 20px rgba(99,102,241,0.35)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
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
