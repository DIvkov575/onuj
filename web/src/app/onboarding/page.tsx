'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function getToken() {
  return document.cookie.match(/juno_session=([^;]+)/)?.[1] ?? ''
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'name' | 'key'>('name')
  const [workspaceName, setWorkspaceName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceName.trim()) return
    setLoading(true)
    setError('')

    const token = getToken()
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

    // Update workspace name (best-effort — not blocking if it fails)
    await fetch(`${API}/v1/workspace`, { method: 'PATCH', headers, body: JSON.stringify({ name: workspaceName.trim() }) })

    // Create first API key
    const keyRes = await fetch(`${API}/v1/api-keys`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Default' }),
    })

    if (!keyRes.ok) {
      setError('Something went wrong. Try again.')
      setLoading(false)
      return
    }

    const { raw_key } = await keyRes.json()
    setApiKey(raw_key)
    setStep('key')
    setLoading(false)
  }

  function copy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f0efed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
            <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
            <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Juno</span>
        </div>

        {step === 'name' ? (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Name your workspace
            </h1>
            <p style={{ fontSize: 14, color: '#5a5a5a', marginBottom: 32 }}>
              Usually your product or company name.
            </p>
            <form onSubmit={saveName}>
              <input
                type="text"
                placeholder="Acme AI"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
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
              {error && <p style={{ fontSize: 13, color: '#c0392b', marginTop: 8 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', marginTop: 12, padding: '11px',
                  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                  background: '#0a0a0a', color: '#f0efed',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Setting up…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Your API key
            </h1>
            <p style={{ fontSize: 14, color: '#5a5a5a', lineHeight: 1.7, marginBottom: 24 }}>
              Copy this now — it won&apos;t be shown again.
            </p>

            <div style={{
              background: '#0a0a0a', borderRadius: 10, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              marginBottom: 24,
            }}>
              <code style={{
                fontFamily: 'var(--font-geist-mono, monospace)',
                fontSize: 12, color: 'rgba(255,255,255,0.85)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {apiKey}
              </code>
              <button
                onClick={copy}
                style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: 6,
                  fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                  background: copied ? '#16a34a' : 'rgba(255,255,255,0.12)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '14px 16px',
              fontSize: 13, lineHeight: 1.7, color: '#3a3a3a', marginBottom: 32,
            }}>
              <strong>Quick start:</strong>
              <br />
              <code style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12 }}>
                pip install juno-analytics
              </code>
              <br />
              <code style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12 }}>
                JUNO_API_KEY={apiKey.slice(0, 20)}...
              </code>
            </div>

            <button
              onClick={() => router.replace('/dashboard')}
              style={{
                width: '100%', padding: '11px',
                fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                background: '#0a0a0a', color: '#f0efed',
                border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
