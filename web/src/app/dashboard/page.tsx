'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface Overview {
  total_conversations: number
  monthly_count: number
  gap_rate: number
  cluster_count: number
  last_received_at: string | null
  plan: string
  monthly_limit: number | null
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 10, padding: '24px 28px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', marginBottom: 10 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: '#0a0a0a' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/dashboard/overview')
      .then(setData)
      .catch(e => setError(e.message))
  }, [])

  if (error) return <p style={{ color: '#c0392b', fontSize: 14 }}>{error}</p>
  if (!data) return <p style={{ color: 'rgba(0,0,0,0.35)', fontSize: 14 }}>Loading…</p>

  const gapPct = data.gap_rate != null ? `${Math.round(data.gap_rate * 100)}%` : '—'
  const lastSeen = data.last_received_at
    ? new Date(data.last_received_at).toLocaleDateString()
    : 'Never'

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 32 }}>
        Overview
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
        <Stat label="Total conversations" value={data.total_conversations.toLocaleString()} />
        <Stat label="This month" value={data.monthly_count.toLocaleString()} sub={data.monthly_limit ? `of ${data.monthly_limit.toLocaleString()} limit` : undefined} />
        <Stat label="Gap rate" value={gapPct} sub="conversations with unanswered intent" />
        <Stat label="Intent clusters" value={data.cluster_count} sub={`last data ${lastSeen}`} />
      </div>

      {data.total_conversations === 0 && (
        <div style={{
          border: '1px dashed rgba(0,0,0,0.15)', borderRadius: 12,
          padding: '48px 40px', textAlign: 'center', maxWidth: 480,
        }}>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 10 }}>No conversations yet</p>
          <p style={{ fontSize: 13, color: '#5a5a5a', lineHeight: 1.7, marginBottom: 24 }}>
            Wrap your OpenAI or Anthropic client with the Juno SDK to start capturing conversations.
          </p>
          <a href="/docs" style={{
            fontSize: 13, fontWeight: 500,
            padding: '9px 20px', borderRadius: 8,
            background: '#0a0a0a', color: '#f0efed', textDecoration: 'none',
          }}>
            View integration docs →
          </a>
        </div>
      )}
    </div>
  )
}
