'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState('')
  const [devLink, setDevLink] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setError('')
    setDevLink('')

    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.dev_link) setDevLink(data.dev_link)
      setStatus('sent')
    } else {
      const data = await res.json().catch(() => ({}))
      setStatus('idle')
      setError(data.error ?? 'Something went wrong. Try again.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f0efed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
            <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Juno</span>
        </div>

        {status === 'sent' ? (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>
              {devLink ? 'Your sign-in link' : 'Check your email'}
            </h1>
            {devLink ? (
              <>
                <p style={{ fontSize: 13, color: '#5a5a5a', lineHeight: 1.6, marginBottom: 16 }}>
                  No email provider is configured. Click the link below to sign in:
                </p>
                <a
                  href={devLink}
                  style={{
                    display: 'block', wordBreak: 'break-all',
                    fontSize: 13, color: '#0a0a0a', fontWeight: 500,
                    background: 'rgba(0,0,0,0.04)', borderRadius: 8,
                    padding: '12px 14px', textDecoration: 'none',
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                >
                  Sign in →
                </a>
              </>
            ) : (
              <p style={{ fontSize: 14, color: '#5a5a5a', lineHeight: 1.7 }}>
                We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes.
              </p>
            )}
            <button
              onClick={() => { setStatus('idle'); setEmail(''); setDevLink('') }}
              style={{
                marginTop: 24, fontSize: 13, color: 'rgba(0,0,0,0.4)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Sign in or create account
            </h1>
            <p style={{ fontSize: 14, color: '#5a5a5a', marginBottom: 32 }}>
              Enter your email — we&apos;ll send a magic link. New emails create a free account automatically.
            </p>

            <form onSubmit={submit}>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px',
                  fontSize: 14, fontFamily: 'inherit',
                  border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8,
                  background: '#fff', color: '#0a0a0a', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {error && (
                <p style={{ fontSize: 13, color: '#c0392b', marginTop: 8 }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', marginTop: 12, padding: '11px',
                  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                  background: '#0a0a0a', color: '#f0efed',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  opacity: status === 'loading' ? 0.6 : 1,
                }}
              >
                {status === 'loading' ? 'Sending…' : 'Continue with email'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
