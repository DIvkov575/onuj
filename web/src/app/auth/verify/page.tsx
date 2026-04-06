'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function VerifyInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setError('Missing token.'); return }

    fetch(`${API}/v1/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.jwt) {
          document.cookie = `juno_session=${data.jwt}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
          router.replace(data.is_new_user ? '/onboarding' : '/dashboard')
        } else {
          setError(data.detail ?? 'Link invalid or expired.')
        }
      })
      .catch(() => setError('Network error. Try again.'))
  }, [params, router])

  if (error) return (
    <>
      <p style={{ fontSize: 15, color: '#c0392b', marginBottom: 16 }}>{error}</p>
      <a href="/login" style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', textDecoration: 'none' }}>
        Back to sign in
      </a>
    </>
  )

  return <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>Signing you in…</p>
}

export default function VerifyPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#f0efed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Suspense fallback={<p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>Loading…</p>}>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  )
}
