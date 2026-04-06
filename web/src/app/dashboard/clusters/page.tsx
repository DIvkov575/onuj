'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Cluster {
  id: string
  label: string
  user_label: string | null
  count: number
  is_gap: boolean
  hidden: boolean
  updated_at: string
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/dashboard/clusters')
      .then(d => { setClusters(d.clusters ?? d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: 'rgba(0,0,0,0.35)', fontSize: 14 }}>Loading…</p>
  if (error) return <p style={{ color: '#c0392b', fontSize: 14 }}>{error}</p>

  const intent = clusters.filter(c => !c.is_gap && !c.hidden)
  const gap = clusters.filter(c => c.is_gap && !c.hidden)

  function Section({ title, items }: { title: string; items: Cluster[] }) {
    if (items.length === 0) return null
    const total = items.reduce((s, c) => s + c.count, 0)
    return (
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', marginBottom: 16 }}>
          {title}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden' }}>
          {items.map(c => {
            const pct = total > 0 ? Math.round((c.count / total) * 100) : 0
            return (
              <div key={c.id} style={{ background: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#0a0a0a', marginBottom: 4 }}>
                    {c.user_label ?? c.label}
                  </p>
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#0a0a0a', borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{c.count.toLocaleString()}</p>
                  <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>{pct}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 32 }}>
        Intent clusters
      </h1>
      {clusters.length === 0 ? (
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>
          No clusters yet. Clusters are generated once you have at least 50 processed conversations.
        </p>
      ) : (
        <>
          <Section title="Top intents" items={intent} />
          <Section title="Knowledge gaps" items={gap} />
        </>
      )}
    </div>
  )
}
