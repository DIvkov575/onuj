'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

interface Turn { role: string; content: string; token_count?: number | null }
interface Detail {
  id: string
  external_id: string
  turns: Turn[]
  gap_flagged: boolean
  cluster_id: string | null
  cluster_label: string | null
  created_at: string
}

const ROLE_STYLE: Record<string, { bg: string; label: string; labelColor: string }> = {
  user:      { bg: '#fff',              label: 'User',      labelColor: '#0a0a0a' },
  assistant: { bg: 'rgba(0,0,0,0.03)', label: 'Assistant', labelColor: 'rgba(0,0,0,0.5)' },
  system:    { bg: 'rgba(0,0,0,0.015)',label: 'System',    labelColor: 'rgba(0,0,0,0.3)' },
}

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(`/dashboard/conversations/${id}`)
      .then(setData)
      .catch(e => setError(e.message))
  }, [id])

  if (error) return (
    <div>
      <button onClick={() => router.back()} style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24 }}>
        ← Back
      </button>
      <p style={{ color: '#c0392b', fontSize: 14 }}>{error}</p>
    </div>
  )

  if (!data) return <p style={{ color: 'rgba(0,0,0,0.35)', fontSize: 14 }}>Loading…</p>

  return (
    <div style={{ maxWidth: 720 }}>
      <button
        onClick={() => router.back()}
        style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24 }}
      >
        ← Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            {data.external_id}
          </h1>
          {data.gap_flagged && (
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: 'rgba(192,57,43,0.08)', color: '#c0392b', fontWeight: 500 }}>
              gap
            </span>
          )}
          {data.cluster_label && (
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }}>
              {data.cluster_label}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
          {data.turns.length} turn{data.turns.length !== 1 ? 's' : ''} · {new Date(data.created_at).toLocaleString()}
        </p>
      </div>

      {/* Turns */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden' }}>
        {data.turns.map((turn, i) => {
          const style = ROLE_STYLE[turn.role] ?? ROLE_STYLE.user
          return (
            <div key={i} style={{ background: style.bg, padding: '18px 24px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: style.labelColor, marginBottom: 8 }}>
                {style.label}
                {turn.token_count != null && (
                  <span style={{ fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                    {turn.token_count} tokens
                  </span>
                )}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#0a0a0a', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {turn.content}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
