'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Cluster { id: string; label: string; user_label: string | null; count: number; updated_at: string }

export default function GapsPage() {
  const [gaps, setGaps] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/dashboard/clusters?gaps_only=true')
      .then(d => { setGaps(d.clusters ?? d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: 'rgba(0,0,0,0.35)', fontSize: 14 }}>Loading…</p>
  if (error) return <p style={{ color: '#c0392b', fontSize: 14 }}>{error}</p>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Knowledge gaps
      </h1>
      <p style={{ fontSize: 14, color: '#5a5a5a', marginBottom: 32 }}>
        Topics your AI consistently fails to answer, ranked by frequency.
      </p>

      {gaps.length === 0 ? (
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>
          No gaps detected yet. Gap detection runs after conversations are processed.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden' }}>
          {gaps.map((g, i) => (
            <div key={g.id} style={{ background: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.25)', fontWeight: 500, minWidth: 24, paddingTop: 2 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#0a0a0a', marginBottom: 4 }}>
                  {g.user_label ?? g.label}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
                  {g.count.toLocaleString()} conversation{g.count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
