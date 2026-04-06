'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
  revoked_at: string | null
}

interface NewKey { id: string; name: string; key_prefix: string; raw_key: string; created_at: string }

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKey, setNewKey] = useState<NewKey | null>(null)
  const [keyName, setKeyName] = useState('')
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadKeys() }, [])

  function loadKeys() {
    apiFetch('/api-keys').then(setKeys).catch(e => setError(e.message))
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    if (!keyName.trim()) return
    setCreating(true)
    try {
      const k = await apiFetch('/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: keyName.trim() }),
      })
      setNewKey(k)
      setKeyName('')
      loadKeys()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this key? Any integrations using it will stop working.')) return
    try {
      await apiFetch(`/api-keys/${id}`, { method: 'DELETE' })
      loadKeys()
    } catch (e: any) {
      setError(e.message)
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const active = keys.filter(k => !k.revoked_at)
  const revoked = keys.filter(k => k.revoked_at)

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 32 }}>
        Settings
      </h1>

      {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      {/* New key banner */}
      {newKey && (
        <div style={{
          background: '#0a0a0a', borderRadius: 10, padding: '20px 24px', marginBottom: 32,
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
            Copy now — this key won&apos;t be shown again.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code style={{ flex: 1, fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 12, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {newKey.raw_key}
            </code>
            <button onClick={() => copy(newKey.raw_key)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: copied ? '#16a34a' : 'rgba(255,255,255,0.12)', color: '#fff',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s',
            }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => setNewKey(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* API Keys section */}
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', marginBottom: 16 }}>
        API Keys
      </p>

      {active.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
          {active.map(k => (
            <div key={k.id} style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{k.name}</p>
                <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                  {k.key_prefix}…
                  {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => revokeKey(k.id)}
                style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create key form */}
      <form onSubmit={createKey} style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
        <input
          type="text"
          placeholder="Key name (e.g. Production)"
          value={keyName}
          onChange={e => setKeyName(e.target.value)}
          style={{
            flex: 1, padding: '9px 14px', fontSize: 13, fontFamily: 'inherit',
            border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8,
            background: '#fff', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={creating || !keyName.trim()}
          style={{
            padding: '9px 18px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            background: '#0a0a0a', color: '#f0efed', border: 'none', borderRadius: 8,
            cursor: 'pointer', opacity: creating ? 0.6 : 1,
          }}
        >
          {creating ? 'Creating…' : 'New key'}
        </button>
      </form>

      {revoked.length > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.2)', marginBottom: 12 }}>
            Revoked
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(0,0,0,0.04)', borderRadius: 10, overflow: 'hidden' }}>
            {revoked.map(k => (
              <div key={k.id} style={{ background: '#f8f8f7', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: 0.5 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, textDecoration: 'line-through' }}>{k.name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                    {k.key_prefix}… · revoked {new Date(k.revoked_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
