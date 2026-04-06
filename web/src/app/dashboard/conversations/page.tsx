'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface Conversation {
  id: string
  external_id: string
  first_msg: string | null
  gap_flagged: boolean
  cluster_label: string | null
  created_at: string
  turn_count: number
}

export default function ConversationsPage() {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [search, setSearch] = useState('')
  const [gapsOnly, setGapsOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (gapsOnly) params.set('gap_flagged', 'true')
    apiFetch(`/dashboard/conversations?${params}`)
      .then(d => { setConvs(d.conversations ?? d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [search, gapsOnly])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 24 }}>
        Conversations
      </h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          style={{
            flex: 1, maxWidth: 320, padding: '9px 14px',
            fontSize: 13, fontFamily: 'inherit',
            border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8,
            background: '#fff', outline: 'none',
          }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>
          <input type="checkbox" checked={gapsOnly} onChange={e => setGapsOnly(e.target.checked)} />
          Gaps only
        </label>
      </div>

      {error && <p style={{ color: '#c0392b', fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'rgba(0,0,0,0.35)', fontSize: 14 }}>Loading…</p>
      ) : convs.length === 0 ? (
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>No conversations found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden' }}>
          {convs.map(c => (
            <a
              key={c.id}
              href={`/dashboard/conversations/${c.id}`}
              style={{ background: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'flex-start', gap: 16, textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: '#0a0a0a', lineHeight: 1.5, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.first_msg ?? c.external_id}
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {c.cluster_label && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }}>
                      {c.cluster_label}
                    </span>
                  )}
                  {c.gap_flagged && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(192,57,43,0.08)', color: '#c0392b' }}>
                      gap
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)' }}>
                    {c.turn_count} turn{c.turn_count !== 1 ? 's' : ''} · {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
