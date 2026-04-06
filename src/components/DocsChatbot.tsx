'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function DocsChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const convId = useRef<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Stable session ID per page load
    convId.current = genId()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/docs-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, conversationId: convId.current }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setMessages(m => [...m, { role: 'assistant', content: data.reply ?? 'Something went wrong.' }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error.'
      setMessages(m => [...m, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open docs chat'}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 100,
          width: 48, height: 48, borderRadius: '50%',
          background: '#0a0a0a', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          transition: 'transform 0.15s, opacity 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.opacity = '0.82')}
        onMouseOut={e => (e.currentTarget.style.opacity = '1')}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12M14 2L2 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 5a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5z" fill="white"/>
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 28, zIndex: 100,
          width: 360, maxHeight: 520,
          background: '#f0efed',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 14,
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
              <rect x="13" y="2" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
              <rect x="2" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a" opacity="0.3"/>
              <rect x="13" y="13" width="9" height="9" rx="1.5" fill="#0a0a0a"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Juno Docs</span>
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginLeft: 2 }}>Ask anything</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', lineHeight: 1.6, margin: 'auto 0' }}>
                Ask about installation, the SDK API, backfill, streaming — anything in the docs.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? '#0a0a0a' : 'rgba(0,0,0,0.06)',
                color: m.role === 'user' ? '#f0efed' : '#0a0a0a',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '9px 13px',
                fontSize: 13,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                background: 'rgba(0,0,0,0.06)',
                borderRadius: '12px 12px 12px 2px',
                padding: '10px 14px',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.3)',
                    animation: 'dot-pulse 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px 12px',
            borderTop: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask a question..."
              style={{
                flex: 1, resize: 'none', border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 8, padding: '9px 12px',
                fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit',
                background: '#fff', color: '#0a0a0a',
                outline: 'none', maxHeight: 100, overflowY: 'auto',
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                flexShrink: 0, width: 34, height: 34,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: input.trim() && !loading ? '#0a0a0a' : 'rgba(0,0,0,0.1)',
                color: input.trim() && !loading ? '#f0efed' : 'rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dot-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
