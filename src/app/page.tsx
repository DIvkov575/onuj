import WaitlistForm from '@/components/WaitlistForm'

const features = [
  {
    label: 'Gap Detection',
    description: 'See exactly which questions your AI fails to answer, ranked by frequency.',
  },
  {
    label: 'Intent Clustering',
    description: 'Automatically groups conversations by what users are trying to do — no manual tagging.',
  },
  {
    label: 'One-line setup',
    description: 'Wrap your OpenAI or Anthropic client. Zero other changes. Insights within hours.',
  },
]

const gapRows = [
  { count: '412', label: 'How do I export data to CSV?', delta: '+3×', hot: true },
  { count: '287', label: 'Does it support team accounts?', delta: 'new', hot: true },
  { count: '198', label: 'What are the rate limits?', delta: '+40%', hot: false },
  { count: '143', label: 'Can I use my own model?', delta: '+22%', hot: false },
  { count: '91',  label: 'How do I cancel my subscription?', delta: '—', hot: false },
]

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f1f5f9', fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>

      {/* Nav */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(3,7,18,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em' }}>chatAnalytics</span>
          <a
            href="#waitlist"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            Join waitlist
          </a>
        </div>
      </header>

      {/* Background */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 600,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          top: 300,
          right: -100,
          width: 500,
          height: 500,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)',
        }} />
      </div>

      {/* Hero */}
      <main style={{ position: 'relative', zIndex: 10, maxWidth: 700, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.25)',
          color: '#a78bfa',
          fontSize: 12,
          fontWeight: 500,
          marginBottom: 32,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6366f1',
            boxShadow: '0 0 8px #6366f1',
            display: 'inline-block',
          }} />
          Early access — join the waitlist
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          marginBottom: 24,
        }}>
          Know what your users
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            are actually asking.
          </span>
        </h1>

        {/* Subhead */}
        <p style={{ fontSize: 17, lineHeight: 1.7, color: '#64748b', maxWidth: 500, margin: '0 auto 48px' }}>
          chatAnalytics finds the questions your AI can&rsquo;t answer and clusters
          what your users want — so you build the right thing next.
        </p>

        {/* Waitlist */}
        <div id="waitlist" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 80 }}>
          <WaitlistForm />
          <p style={{ fontSize: 12, color: '#334155' }}>No spam · Early access invites only</p>
        </div>

        {/* Mock gap report */}
        <div style={{
          borderRadius: 16,
          overflow: 'hidden',
          textAlign: 'left',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          {/* Card header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#334155', marginLeft: 4 }}>gap-report.json</span>
            </div>
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'rgba(99,102,241,0.12)',
              color: '#818cf8',
            }}>
              Last 7 days
            </span>
          </div>

          {/* Rows */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-geist-mono, monospace)' }}>
            {gapRows.map(({ count, label, delta, hot }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: hot ? 'rgba(99,102,241,0.07)' : 'transparent',
                  border: hot ? '1px solid rgba(99,102,241,0.12)' : '1px solid transparent',
                }}
              >
                <span style={{ width: 32, textAlign: 'right', fontSize: 12, color: '#475569', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {count}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: hot ? '#c7d2fe' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 5,
                  flexShrink: 0,
                  fontFamily: 'var(--font-geist-sans, system-ui)',
                  background: delta === 'new'
                    ? 'rgba(99,102,241,0.2)'
                    : delta.startsWith('+')
                      ? 'rgba(34,197,94,0.12)'
                      : 'rgba(255,255,255,0.04)',
                  color: delta === 'new'
                    ? '#a78bfa'
                    : delta.startsWith('+')
                      ? '#4ade80'
                      : '#475569',
                }}>
                  {delta}
                </span>
              </div>
            ))}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 12,
              marginTop: 4,
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 12, color: '#334155' }}>5 gap clusters · 1,131 unanswered conversations</span>
              <span style={{
                fontSize: 12,
                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                View all →
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: 1000, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {features.map(({ label, description }) => (
            <div
              key={label}
              style={{
                padding: '24px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#475569' }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '20px 24px',
        fontSize: 12,
        color: '#1e293b',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        chatAnalytics · 2026
      </footer>
    </div>
  )
}
